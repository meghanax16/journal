import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { loadDetailedEntries, loadGratitudeEntries, loadHighlightEntries, loadHabits, Habit } from './storage';

export interface JournalEntryData {
  id: string;
  content: string;
  timestamp: Date;
  mood?: string;
}

export interface GratitudeEntryData {
  id: string;
  gratitude1: string;
  gratitude2: string;
  gratitude3: string;
  timestamp: Date;
  mood?: string;
}

export interface HighlightEntryData {
  id: string;
  highlight: string;
  reason: string;
  timestamp: Date;
  mood?: string;
}

interface MoodAnalytics {
  mood: string;
  count: number;
  percentage: number;
}

interface JournalAnalytics {
  totalEntries: number;
  entriesByType: {
    detailed: number;
    gratitude: number;
    highlight: number;
  };
  moodAnalytics: MoodAnalytics[];
  entriesByMonth: { [key: string]: number };
  averageEntriesPerWeek: number;
  longestStreak: number;
  currentStreak: number;
  habitAnalytics: {
    totalHabits: number;
    completedToday: number;
    averageCompletionRate: number;
    longestHabitStreak: number;
    habitsByStreak: { name: string; streak: number }[];
  };
}

export const generateJournalAnalytics = async (): Promise<JournalAnalytics> => {
  const [detailedEntries, gratitudeEntries, highlightEntries, habits] = await Promise.all([
    loadDetailedEntries(),
    loadGratitudeEntries(),
    loadHighlightEntries(),
    loadHabits(),
  ]);

  const allEntries = [
    ...detailedEntries.map(e => ({ ...e, type: 'detailed' })),
    ...gratitudeEntries.map(e => ({ ...e, type: 'gratitude' })),
    ...highlightEntries.map(e => ({ ...e, type: 'highlight' })),
  ];

  // Sort entries by date
  allEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Calculate mood analytics
  const moodCounts: { [key: string]: number } = {};
  allEntries.forEach(entry => {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }
  });

  const totalMoodEntries = Object.values(moodCounts).reduce((sum, count) => sum + count, 0);
  const moodAnalytics: MoodAnalytics[] = Object.entries(moodCounts).map(([mood, count]) => ({
    mood,
    count,
    percentage: totalMoodEntries > 0 ? Math.round((count / totalMoodEntries) * 100) : 0,
  }));

  // Calculate entries by month
  const entriesByMonth: { [key: string]: number } = {};
  allEntries.forEach(entry => {
    const monthKey = new Date(entry.timestamp).toISOString().substring(0, 7); // YYYY-MM
    entriesByMonth[monthKey] = (entriesByMonth[monthKey] || 0) + 1;
  });

  // Calculate streaks
  const entryDates = allEntries.map(entry => 
    new Date(entry.timestamp).toISOString().substring(0, 10)
  );
  const uniqueDates = [...new Set(entryDates)].sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak
  const today = new Date().toISOString().substring(0, 10);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  
  if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
    let streakCount = 0;
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const checkDate = new Date(Date.now() - streakCount * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
      if (uniqueDates.includes(checkDate)) {
        streakCount++;
      } else {
        break;
      }
    }
    currentStreak = streakCount;
  }

  // Calculate average entries per week
  const weeks = Math.max(1, Math.ceil(uniqueDates.length / 7));
  const averageEntriesPerWeek = Math.round((allEntries.length / weeks) * 10) / 10;

  // Calculate habit analytics
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completed).length;
  const longestHabitStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const habitsByStreak = habits.map(h => ({ name: h.name, streak: h.streak }))
    .sort((a, b) => b.streak - a.streak);

  // Calculate average completion rate
  let totalCompletions = 0;
  let totalPossibleDays = 0;
  habits.forEach(habit => {
    const completionDates = Object.keys(habit.completionsByDate);
    totalCompletions += completionDates.filter(date => habit.completionsByDate[date]).length;
    
    // Calculate days since habit creation
    const daysSinceCreation = Math.ceil((Date.now() - habit.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    totalPossibleDays += Math.max(1, daysSinceCreation);
  });
  const averageCompletionRate = totalPossibleDays > 0 ? Math.round((totalCompletions / totalPossibleDays) * 100) : 0;

  return {
    totalEntries: allEntries.length,
    entriesByType: {
      detailed: detailedEntries.length,
      gratitude: gratitudeEntries.length,
      highlight: highlightEntries.length,
    },
    moodAnalytics,
    entriesByMonth,
    averageEntriesPerWeek,
    longestStreak,
    currentStreak,
    habitAnalytics: {
      totalHabits,
      completedToday,
      averageCompletionRate,
      longestHabitStreak,
      habitsByStreak,
    },
  };
};

export const exportJournalToExcel = async (): Promise<string> => {
  try {
    const [detailedEntries, gratitudeEntries, highlightEntries, habits, analytics] = await Promise.all([
      loadDetailedEntries(),
      loadGratitudeEntries(),
      loadHighlightEntries(),
      loadHabits(),
      generateJournalAnalytics(),
    ]);

    // Debug logging
    console.log('DEBUG Excel Export - Habits loaded:', habits.length);
    console.log('DEBUG Excel Export - Habits data:', habits);
    console.log('DEBUG Excel Export - Analytics habit data:', analytics.habitAnalytics);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Journal Export Report', '', '', ''],
      ['Generated on:', new Date().toLocaleDateString(), '', ''],
      ['', '', '', ''],
      ['JOURNAL OVERVIEW', '', '', ''],
      ['Total Entries:', analytics.totalEntries, '', ''],
      ['Detailed Journal Entries:', analytics.entriesByType.detailed, '', ''],
      ['Gratitude Journal Entries:', analytics.entriesByType.gratitude, '', ''],
      ['Highlight Journal Entries:', analytics.entriesByType.highlight, '', ''],
      ['Average Entries per Week:', analytics.averageEntriesPerWeek, '', ''],
      ['Current Streak (days):', analytics.currentStreak, '', ''],
      ['Longest Streak (days):', analytics.longestStreak, '', ''],
      ['', '', '', ''],
      ['HABIT TRACKING OVERVIEW', '', '', ''],
      ['Total Habits:', analytics.habitAnalytics.totalHabits, '', ''],
      ['Completed Today:', analytics.habitAnalytics.completedToday, '', ''],
      ['Average Completion Rate:', `${analytics.habitAnalytics.averageCompletionRate}%`, '', ''],
      ['Longest Habit Streak:', analytics.habitAnalytics.longestHabitStreak, '', ''],
      ['', '', '', ''],
      ['HABIT STREAKS', '', '', ''],
      ['Habit Name', 'Current Streak', '', ''],
      ...analytics.habitAnalytics.habitsByStreak.map(habit => [habit.name, habit.streak, '', '']),
      ['', '', '', ''],
      ['MOOD ANALYTICS', '', '', ''],
      ['Mood', 'Count', 'Percentage', ''],
      ...analytics.moodAnalytics.map(mood => [mood.mood, mood.count, `${mood.percentage}%`, '']),
      ['', '', '', ''],
      ['ENTRIES BY MONTH', '', '', ''],
      ['Month', 'Count', '', ''],
      ...Object.entries(analytics.entriesByMonth).map(([month, count]) => [month, count, '', '']),
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Detailed Entries Sheet
    if (detailedEntries.length > 0) {
      const detailedData = [
        ['Date', 'Time', 'Content', 'Mood', 'Word Count'],
        ...detailedEntries.map(entry => [
          new Date(entry.timestamp).toLocaleDateString(),
          new Date(entry.timestamp).toLocaleTimeString(),
          entry.content,
          entry.mood || '',
          entry.content.split(' ').length,
        ]),
      ];
      const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Journal');
    }

    // Gratitude Entries Sheet
    if (gratitudeEntries.length > 0) {
      const gratitudeData = [
        ['Date', 'Time', 'Gratitude 1', 'Gratitude 2', 'Gratitude 3', 'Mood'],
        ...gratitudeEntries.map(entry => [
          new Date(entry.timestamp).toLocaleDateString(),
          new Date(entry.timestamp).toLocaleTimeString(),
          entry.gratitude1,
          entry.gratitude2,
          entry.gratitude3,
          entry.mood || '',
        ]),
      ];
      const gratitudeSheet = XLSX.utils.aoa_to_sheet(gratitudeData);
      XLSX.utils.book_append_sheet(workbook, gratitudeSheet, 'Gratitude Journal');
    }

    // Highlight Entries Sheet
    if (highlightEntries.length > 0) {
      const highlightData = [
        ['Date', 'Time', 'Highlight', 'Reason', 'Mood'],
        ...highlightEntries.map(entry => [
          new Date(entry.timestamp).toLocaleDateString(),
          new Date(entry.timestamp).toLocaleTimeString(),
          entry.highlight,
          entry.reason,
          entry.mood || '',
        ]),
      ];
      const highlightSheet = XLSX.utils.aoa_to_sheet(highlightData);
      XLSX.utils.book_append_sheet(workbook, highlightSheet, 'Highlights');
    }

    // Habits Sheet
    if (habits.length > 0) {
      const habitData = [
        ['Habit Name', 'Current Streak', 'Created Date', 'Completed Today', 'Total Completions', 'Completion Rate %'],
        ...habits.map(habit => {
          const totalCompletions = Object.values(habit.completionsByDate).filter(Boolean).length;
          const daysSinceCreation = Math.ceil((Date.now() - habit.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          const completionRate = daysSinceCreation > 0 ? Math.round((totalCompletions / daysSinceCreation) * 100) : 0;
          
          return [
            habit.name,
            habit.streak,
            new Date(habit.createdAt).toLocaleDateString(),
            habit.completed ? 'Yes' : 'No',
            totalCompletions,
            completionRate,
          ];
        }),
      ];
      const habitSheet = XLSX.utils.aoa_to_sheet(habitData);
      XLSX.utils.book_append_sheet(workbook, habitSheet, 'Habits');

      // Habit Completion History Sheet
      // Only create habit history if there's actual completion data
      const hasCompletionData = habits.some(habit => Object.keys(habit.completionsByDate).length > 0);
      
      if (hasCompletionData) {
        const habitHistoryData = [['Date', ...habits.map(h => h.name)]];
        
        // Get all unique dates from all habits
        const allDates = new Set<string>();
        habits.forEach(habit => {
          Object.keys(habit.completionsByDate).forEach(date => allDates.add(date));
        });
        
        const sortedDates = Array.from(allDates).sort();
        sortedDates.forEach(date => {
          const row = [date];
          habits.forEach(habit => {
            row.push(habit.completionsByDate[date] ? '✓' : '');
          });
          habitHistoryData.push(row);
        });
        
        const habitHistorySheet = XLSX.utils.aoa_to_sheet(habitHistoryData);
        XLSX.utils.book_append_sheet(workbook, habitHistorySheet, 'Habit History');
      }
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    
    // Save to file system
    const fileName = `journal_report_${new Date().toISOString().substring(0, 10)}.xlsx`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export journal to Excel');
  }
};

export const shareExcelReport = async (): Promise<void> => {
  try {
    // Debug: Check if habits exist in storage
    const habits = await loadHabits();
    console.log('DEBUG: Habits loaded for Excel export:', habits.length, habits);
    
    const fileUri = await exportJournalToExcel();
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Share Journal Report',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error sharing Excel report:', error);
    throw error;
  }
};
