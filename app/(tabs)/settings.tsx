import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useJournalSettings } from '@/contexts/JournalSettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { generateJournalAnalytics, shareExcelReport } from '@/utils/excelExport';
import { clearAllJournalData, exportAllJournalData } from '@/utils/storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'; // 👈 import
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [dataExport, setDataExport] = useState(false);
  const [excelExport, setExcelExport] = useState(false);
  
  const { currentTheme, themeMode, toggleTheme } = useTheme();
  const { toggleJournalType, isJournalTypeEnabled } = useJournalSettings();
  const colors = Colors[currentTheme];

  const tabBarHeight = useBottomTabBarHeight(); // 👈 dynamic bottom padding


  const handleThemeChange = () => {
    Alert.alert(
      'Choose Theme',
      'Select your preferred theme',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Light', 
          onPress: () => toggleTheme('light'),
          style: themeMode === 'light' ? 'default' : undefined
        },
        { 
          text: 'Dark', 
          onPress: () => toggleTheme('dark'),
          style: themeMode === 'dark' ? 'default' : undefined
        },
        { 
          text: 'System', 
          onPress: () => toggleTheme('system'),
          style: themeMode === 'system' ? 'default' : undefined
        },
      ]
    );
  };

  const handleDataExport = async () => {
    Alert.alert(
      'Export Data',
      'This will export your journal entries as a JSON file.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: async () => {
          setDataExport(true);
          try {
            const exportData = await exportAllJournalData();
            if (exportData) {
              // In a real app, you'd save this to a file or share it
              console.log('Export data:', exportData);
              Alert.alert('Success', 'Data exported successfully!');
            } else {
              Alert.alert('Error', 'Failed to export data.');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to export data.');
          } finally {
            setDataExport(false);
          }
        }}
      ]
    );
  };

  const handleExcelExport = async () => {
    Alert.alert(
      'Export Excel Report',
      'This will generate a comprehensive Excel report with analytics, charts, and all your journal entries organized by type.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate Report', onPress: async () => {
          setExcelExport(true);
          try {
            await shareExcelReport();
            Alert.alert('Success', 'Excel report generated and ready to share!');
          } catch (error) {
            console.error('Excel export error:', error);
            Alert.alert('Error', 'Failed to generate Excel report. Please try again.');
          } finally {
            setExcelExport(false);
          }
        }}
      ]
    );
  };

  const handleViewAnalytics = async () => {
    try {
      const analytics = await generateJournalAnalytics();
      const moodSummary = analytics.moodAnalytics.length > 0 
        ? analytics.moodAnalytics.map(m => `${m.mood}: ${m.percentage}%`).join('\n')
        : 'No mood data available';
      
      Alert.alert(
        'Journal Analytics',
        `Total Entries: ${analytics.totalEntries}\n` +
        `Current Streak: ${analytics.currentStreak} days\n` +
        `Longest Streak: ${analytics.longestStreak} days\n` +
        `Avg Entries/Week: ${analytics.averageEntriesPerWeek}\n\n` +
        `Entry Types:\n` +
        `• Detailed: ${analytics.entriesByType.detailed}\n` +
        `• Gratitude: ${analytics.entriesByType.gratitude}\n` +
        `• Highlights: ${analytics.entriesByType.highlight}\n\n` +
        `Habit Analytics:\n` +
        `• Total Habits: ${analytics.habitAnalytics.totalHabits}\n` +
        `• Completed Today: ${analytics.habitAnalytics.completedToday}\n` +
        `• Completion Rate: ${analytics.habitAnalytics.averageCompletionRate}%\n` +
        `• Longest Streak: ${analytics.habitAnalytics.longestHabitStreak}\n\n` +
        `Mood Distribution:\n${moodSummary}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to load analytics.');
    }
  };


  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your journal entries. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: async () => {
          try {
            await clearAllJournalData();
            Alert.alert('Data Cleared', 'All journal data has been cleared.');
          } catch (error) {
            Alert.alert('Error', 'Failed to clear data.');
          }
        }}
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Journal App',
      'Version 1.0.0\n\nA simple journaling app with habit tracking built with React Native and Expo.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
        <ThemedText style={styles.subtitle}>
          Customize your journaling experience
        </ThemedText>
      </ThemedView>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }} // 👈 ensures About is above tab bar
      >
        {/* Appearance Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            <IconSymbol name="paintbrush.fill" size={16} color={colors.icon} /> Appearance
          </ThemedText>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleThemeChange}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="moon.fill" size={20} color={colors.icon} />
              <ThemedText style={styles.settingText}>Theme</ThemedText>
            </ThemedView>
            <ThemedView style={styles.settingRight}>
              <ThemedText style={styles.settingValue}>
                {themeMode === 'system' ? 'System' : themeMode === 'dark' ? 'Dark' : 'Light'}
              </ThemedText>
              <IconSymbol name="chevron.right" size={16} color={colors.tabIconDefault} />
            </ThemedView>
          </TouchableOpacity>
        </ThemedView>

        {/* Notifications Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            <IconSymbol name="bell.fill" size={16} color={colors.icon} /> Notifications
          </ThemedText>
          
          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="bell.badge" size={20} color={colors.icon} />
              <ThemedText style={styles.settingText}>Enable Notifications</ThemedText>
            </ThemedView>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.background, true: colors.tint }}
              thumbColor={notificationsEnabled ? colors.background : colors.tint}
            />
          </ThemedView>

          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="clock.fill" size={20} color={colors.icon} />
              <ThemedText style={styles.settingText}>Default Reminder Time</ThemedText>
            </ThemedView>
            <TouchableOpacity 
              style={[styles.timeButton, { backgroundColor: colors.background }]}
              onPress={() => Alert.prompt('Set Time', 'Enter time (HH:MM)', [
                { text: 'Cancel' },
                { text: 'Set', onPress: (time) => time && setReminderTime(time) }
              ], 'plain-text', reminderTime)}
            >
              <ThemedText style={styles.timeText}>{reminderTime}</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={colors.icon} />
              <ThemedText style={styles.settingText}>Weekly Progress Reports</ThemedText>
            </ThemedView>
            <Switch
              value={weeklyReports}
              onValueChange={setWeeklyReports}
              trackColor={{ false: colors.background, true: colors.tint }}
              thumbColor={weeklyReports ? colors.background : colors.tint}
            />
          </ThemedView>

          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="flame.fill" size={20} color={colors.icon} />
              <ThemedText style={styles.settingText}>Streak Reminders</ThemedText>
            </ThemedView>
            <Switch
              value={streakReminders}
              onValueChange={setStreakReminders}
              trackColor={{ false: colors.background, true: colors.tint }}
              thumbColor={streakReminders ? colors.background : colors.tint}
            />
          </ThemedView>
        </ThemedView>

          {/* Data Management */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              <IconSymbol name="chart.bar" size={16} color={colors.icon} /> Reports & Analytics
            </ThemedText>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleViewAnalytics}
            >
              <ThemedView style={styles.settingLeft}>
                <IconSymbol name="chart.bar" size={20} color={colors.icon} />
                <ThemedText style={styles.settingText}>View Analytics</ThemedText>
              </ThemedView>
              <IconSymbol name="chevron.right" size={16} color={colors.tabIconDefault} />
            </TouchableOpacity>


            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleExcelExport}
              disabled={excelExport}
            >
              <ThemedView style={styles.settingLeft}>
                <IconSymbol name="doc.text" size={20} color={colors.icon} />
                <ThemedText style={styles.settingText}>Export Excel Report</ThemedText>
              </ThemedView>
              {excelExport ? (
                <ThemedText style={styles.exportingText}>Generating...</ThemedText>
              ) : (
                <IconSymbol name="chevron.right" size={16} color={colors.tabIconDefault} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleDataExport}
              disabled={dataExport}
            >
              <ThemedView style={styles.settingLeft}>
                <IconSymbol name="square.and.arrow.up" size={20} color={colors.icon} />
                <ThemedText style={styles.settingText}>Export JSON Data</ThemedText>
              </ThemedView>
              {dataExport ? (
                <ThemedText style={styles.exportingText}>Exporting...</ThemedText>
              ) : (
                <IconSymbol name="chevron.right" size={16} color={colors.tabIconDefault} />
              )}
            </TouchableOpacity>
          </ThemedView>

        {/* Data Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            <IconSymbol name="externaldrive.fill" size={16} color={colors.icon} /> Data & Privacy
          </ThemedText>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="trash.fill" size={20} color={colors.icon} />
              <ThemedText style={[styles.settingText, { color: '#FF3B30' }]}>Clear All Data</ThemedText>
            </ThemedView>
            <IconSymbol name="chevron.right" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </ThemedView>

{/* Journal Type Section */}
<ThemedView style={styles.section}>
  <ThemedText type="subtitle" style={styles.sectionTitle}>
    <IconSymbol name="book.fill" size={16} color={colors.icon} /> Journal Types
  </ThemedText>
  <ThemedText style={styles.sectionDescription}>
    Select one or more journal types to use
  </ThemedText>

  <ThemedView style={styles.settingItem}>
    <ThemedView style={styles.settingLeft}>
      <IconSymbol name="sun.max.fill" size={20} color={colors.icon} />
      <ThemedText style={styles.settingText}>Gratitude Journal</ThemedText>
    </ThemedView>
    <Switch
      value={isJournalTypeEnabled('gratitude')}
      onValueChange={() => toggleJournalType('gratitude')}
      trackColor={{ false: colors.background, true: colors.tint }}
      thumbColor={isJournalTypeEnabled('gratitude') ? colors.background : colors.tint}
    />
  </ThemedView>

  <ThemedView style={styles.settingItem}>
    <ThemedView style={styles.settingLeft}>
      <IconSymbol name="star.fill" size={20} color={colors.icon} />
      <ThemedText style={styles.settingText}>Highlight of the Day</ThemedText>
    </ThemedView>
    <Switch
      value={isJournalTypeEnabled('highlight')}
      onValueChange={() => toggleJournalType('highlight')}
      trackColor={{ false: colors.background, true: colors.tint }}
      thumbColor={isJournalTypeEnabled('highlight') ? colors.background : colors.tint}
    />
  </ThemedView>

  <ThemedView style={styles.settingItem}>
    <ThemedView style={styles.settingLeft}>
      <IconSymbol name="doc.text.fill" size={20} color={colors.icon} />
      <ThemedText style={styles.settingText}>Detailed Journal</ThemedText>
    </ThemedView>
    <Switch
      value={isJournalTypeEnabled('detailed')}
      onValueChange={() => toggleJournalType('detailed')}
      trackColor={{ false: colors.background, true: colors.tint }}
      thumbColor={isJournalTypeEnabled('detailed') ? colors.background : colors.tint}
    />
    </ThemedView>
  </ThemedView>

        {/* About Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            <IconSymbol name="info.circle.fill" size={16} color={colors.icon} /> About
          </ThemedText>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="questionmark.circle.fill" size={20} color={colors.icon} />
              <ThemedText style={styles.settingText}>About Journal App</ThemedText>
            </ThemedView>
            <IconSymbol name="chevron.right" size={16} color={colors.tabIconDefault} />
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDescription: {
    paddingHorizontal: 20,
    marginBottom: 12,
    fontSize: 14,
    opacity: 0.6,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingText: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 14,
    opacity: 0.7,
  },
  timeButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  exportingText: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});
