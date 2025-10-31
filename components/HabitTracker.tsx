import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { AccountabilityPartner, Habit } from '@/utils/storage';
import { sendAccountabilityMessage } from '@/utils/whatsapp';
import * as Notifications from 'expo-notifications';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, LayoutChangeEvent, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';

function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDaysInMonth(year: number, monthIndexZeroBased: number): number {
  return new Date(year, monthIndexZeroBased + 1, 0).getDate();
}

function calculateStreak(completionsByDate: Record<string, boolean>): number {
  // Count consecutive days ending today
  let streak = 0;
  const today = new Date();
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = formatISODate(d);
    if (completionsByDate[key]) streak += 1; else break;
  }
  return streak;
} //TODO: Some Bug in the Calculation, it becomes 0 when the todays streak is toggled, tho previous days are marked done.


interface HabitTrackerProps {
  habits?: Habit[];
  onHabitsChange?: (habits: Habit[]) => void;
}

export function HabitTracker({ habits = [], onHabitsChange }: HabitTrackerProps) {
  const [newHabitName, setNewHabitName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [gridWidth, setGridWidth] = useState(0);
  const weekPagerRefs = useRef<Record<string, ScrollView | null>>({});
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [accountabilityPartner, setAccountabilityPartner] = useState<AccountabilityPartner | null>(null);

  // Load accountability partner from storage on mount
  useEffect(() => {
    async function fetchPartner() {
      try {
        // Dynamically import to avoid circular dependency if any
        const { loadAccountabilityPartner } = await import('@/utils/storage');
        const partner = await loadAccountabilityPartner();
        setAccountabilityPartner(partner);
      } catch (error) {
        console.error('Failed to load accountability partner:', error);
      }
    }
    fetchPartner();
  }, []);

  const monthMeta = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const days = getDaysInMonth(year, month);
    // Weeks start on Sunday: 0=Sun ... 6=Sat
    const firstWeekday = new Date(year, month, 1).getDay();
    const monthLabel = visibleMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    // Build complete weeks array: each week has 7 slots (0 = blank, >0 = day number)
    const total = firstWeekday + days;
    const totalSlots = total + ((7 - (total % 7)) % 7);
    const weeks: number[][] = [];
    for (let i = 0; i < totalSlots; i += 7) {
      const week = Array.from({ length: 7 }, (_, j) => {
        const day = i + j - firstWeekday + 1;
        return day >= 1 && day <= days ? day : 0;
      });
      weeks.push(week);
    }
    return { year, month, days, firstWeekday, monthLabel, weeks };
  }, [visibleMonth]);

  const goMonth = (delta: number) => {
    setVisibleMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const toggleDay = async (habitId: string, year: number, monthZero: number, day: number) => {
    const iso = formatISODate(new Date(year, monthZero, day));
    const todayKey = formatISODate(new Date());
  let sendMessageHabit: Habit | null = null;
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      const completions = { ...h.completionsByDate };
      const wasCompleted = completions[iso];
      completions[iso] = !completions[iso];
      const newCompleted = !!completions[todayKey];
      const newStreak = calculateStreak(completions);
      // Track if we should send message after update
      if (iso === todayKey && !wasCompleted && completions[iso]) {
        sendMessageHabit = { ...h, completionsByDate: completions, completed: newCompleted, streak: newStreak };
      }
      return { ...h, completionsByDate: completions, completed: newCompleted, streak: newStreak };
    });
    onHabitsChange?.(updated);

    // Persist server-side when marking today complete (false -> true)
    try {
      if (iso === todayKey) {
        const changed = habits.find(h => h.id === habitId)?.completionsByDate?.[iso] !== true;
        const nowCompleted = updated.find(h => h.id === habitId)?.completionsByDate?.[iso] === true;
        if (changed && nowCompleted) {
          const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8100';
          const res = await fetch(`${baseUrl}/habits/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: habitId, date: iso }),
          });
          if (res.ok) {
            const data = await res.json();
            const serverStreak = typeof data?.streak === 'number' ? data.streak : undefined;
            if (serverStreak !== undefined) {
              const reconciled = updated.map(h => h.id === habitId ? { ...h, streak: serverStreak, completed: true } : h);
              onHabitsChange?.(reconciled);
            }
          }
        }
      }
    } catch (e) {
      // Non-fatal: keep local optimistic state
      console.warn('Failed to persist habit completion:', e);
    }
    // After updating habits, send WhatsApp message if needed
    if (sendMessageHabit) {
      try {
        const { loadAccountabilityPartner } = await import('@/utils/storage');
        const latestPartner = await loadAccountabilityPartner();
        if (latestPartner && latestPartner.enabled === true) {
          const totalHabits = updated.length > 0 ? updated.length : 1;
          const completedCount = updated.filter(h => h.completed).length;
          const percent = Math.min(100, Math.max(0, Math.round((completedCount / totalHabits) * 100)));
          sendAccountabilityMessage(latestPartner, (sendMessageHabit as Habit).name, percent).catch(console.error);
        }
      } catch (error) {
        console.error('Failed to fetch latest accountability partner:', error);
      }
    }
  };

  const scrollToCurrentWeek = () => {
    if (gridWidth === 0) return;
    const today = new Date();
    if (today.getFullYear() !== monthMeta.year || today.getMonth() !== monthMeta.month) return;
    const day = today.getDate();
    const weekIndex = monthMeta.weeks.findIndex(week => week.includes(day));
    const targetIndex = Math.max(0, weekIndex);
    const x = targetIndex * gridWidth;
    Object.values(weekPagerRefs.current).forEach(ref => ref?.scrollTo({ x, animated: true }));
  };

  const goToToday = () => {
    const today = new Date();
    const isSameMonth = today.getFullYear() === monthMeta.year && today.getMonth() === monthMeta.month;
    if (!isSameMonth) {
      setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
      // useEffect on month change will snap automatically
    } else {
      scrollToCurrentWeek();
    }
  };

  const toggleHabitToday = async (habitId: string) => {
    const now = new Date();
    await toggleDay(habitId, now.getFullYear(), now.getMonth(), now.getDate());
  };

  const scheduleNotification = async (habitId: string, habitName: string, time: string) => {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please enable notifications in your device settings.');
        return;
      }

      // Parse time (HH:MM format)
      const [hours, minutes] = time.split(':').map(Number);
      
      // Create trigger for daily at specified time
      const trigger = {
        hour: hours,
        minute: minutes,
        repeats: true,
      } as any; // Type assertion for now to fix the error

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Habit Reminder',
          body: `Time to complete: ${habitName}`,
          data: { habitId },
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      Alert.alert('Error', 'Failed to schedule notification. Please try again.');
      return null;
    }
  };

  const showTimePicker = (baseHabit: Habit) => {
    Alert.prompt(
      'Set reminder time',
      'Enter time in 24-hour format (e.g., 09:30 for 9:30 AM)',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Set',
          onPress: async (time) => {
            if (!time || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
              Alert.alert('Invalid time', 'Please enter time in HH:MM format (e.g., 09:30)');
              return;
            }
            
            const notificationId = await scheduleNotification(baseHabit.id, baseHabit.name, time);
            if (notificationId) {
              const withNotification: Habit = { 
                ...baseHabit, 
                notify: true, 
                notifyTime: time,
                notificationId 
              };
              onHabitsChange?.([...habits, withNotification]);
              setNewHabitName('');
              setShowAddForm(false);
              Alert.alert('Success', `Reminder set for ${time} daily!`);
            }
          },
        },
      ],
      'plain-text',
      '09:00'
    );
  };

  const addHabit = () => {
    if (newHabitName.trim()) {
      const now = new Date();
      const baseHabit: Habit = {
        id: Date.now().toString(),
        name: newHabitName.trim(),
        completed: false,
        streak: 0,
        createdAt: now,
        completionsByDate: {},
        notify: false,
      };
      // Ask user if they want notifications
      Alert.alert(
        'Enable notifications?',
        `Would you like to be notified to complete "${baseHabit.name}"?`,
        [
          {
            text: 'Not now',
            style: 'cancel',
            onPress: () => {
              onHabitsChange?.([...habits, baseHabit]);
              setNewHabitName('');
              setShowAddForm(false);
            },
          },
          {
            text: 'Yes',
            onPress: () => showTimePicker(baseHabit),
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Please enter a habit name.');
    }
  };

  const deleteHabit = (habitId: string) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            const updatedHabits = habits.filter(habit => habit.id !== habitId);
            onHabitsChange?.(updatedHabits);
          }
        }
      ]
    );
  };

  const startEditHabit = (habitId: string, currentName: string) => {
    setEditingHabitId(habitId);
    setEditingName(currentName);
  };

  const saveEditHabit = () => {
    if (!editingHabitId) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a habit name.');
      return;
    }
    const updated = habits.map(h => h.id === editingHabitId ? { ...h, name: trimmed } : h);
    onHabitsChange?.(updated);
    setEditingHabitId(null);
    setEditingName('');
  };

  const cancelEditHabit = () => {
    setEditingHabitId(null);
    setEditingName('');
  };


  const openHabitActions = (habit: Habit) => {
    Alert.alert(
      'Habit options',
      habit.name,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Rename', onPress: () => startEditHabit(habit.id, habit.name) },
        { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(habit.id) },
      ]
    );
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '⚡';
    if (streak >= 1) return '✨';
    return '💪';
  };

  const cellSize = gridWidth > 0 ? Math.floor(gridWidth / 7) : 0;
  const onGridLayout = (e: LayoutChangeEvent) => {
    setGridWidth(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    if (gridWidth === 0) return;
    const today = new Date();
    const isThisMonth = today.getFullYear() === monthMeta.year && today.getMonth() === monthMeta.month;
    const targetOffset = (() => {
      if (!isThisMonth) return 0;
      const day = today.getDate();
      const weekIndex = monthMeta.weeks.findIndex(week => week.includes(day));
      return Math.max(0, weekIndex) * gridWidth;
    })();
    Object.values(weekPagerRefs.current).forEach(ref => {
      ref?.scrollTo({ x: targetOffset, animated: false });
    });
  }, [gridWidth, monthMeta.year, monthMeta.month]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Daily Habits</ThemedText>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <IconSymbol 
            name={showAddForm ? "minus" : "plus"} 
            size={24} 
            color='black' 
          />
        </TouchableOpacity>
      </ThemedView>

      {showAddForm && (
        <ThemedView style={styles.addForm}>
          <TextInput
            style={[
              styles.input,
              { 
                color: colors.text,
                borderColor: colors.tabIconDefault,
                backgroundColor: colors.background
              }
            ]}
            placeholder="Enter a new habit..."
            placeholderTextColor={colors.tabIconDefault}
            value={newHabitName}
            onChangeText={setNewHabitName}
            onSubmitEditing={addHabit}
          />
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.tint }]} 
            onPress={addHabit}
          >
            <ThemedText style={styles.buttonText}>Add Habit</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      {/* Month selector */}
      <ThemedView style={styles.monthBar}>
        <TouchableOpacity onPress={() => goMonth(-1)} style={styles.monthNav}>
          <IconSymbol name="chevron.left" size={20} color={colors.icon} />
        </TouchableOpacity>
        <ThemedText type="subtitle">{monthMeta.monthLabel}</ThemedText>
        <TouchableOpacity onPress={() => goMonth(1)} style={styles.monthNav}>
          <IconSymbol name="chevron.right" size={20} color={colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday} style={styles.monthNav}>
          <ThemedText type="link" style={{ color: 'black', backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, fontStyle: 'italic'}}>Today</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.habitsList} showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="checkmark.circle" size={48} color={colors.tabIconDefault} />
            <ThemedText type="subtitle" style={styles.emptyText}>
              No habits yet
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Add your first habit to start tracking your daily progress!
            </ThemedText>
          </ThemedView>
        ) : (
          habits.map(habit => (
            <ThemedView key={habit.id} style={styles.habitItem}>
              <TouchableOpacity 
                style={styles.habitContent}
                onPress={() => toggleHabitToday(habit.id)}
                onLongPress={() => openHabitActions(habit)}
                delayLongPress={300}
              >
                <TouchableOpacity 
                  style={[
                    styles.checkbox,
                    habit.completed && { backgroundColor: colors.tint, borderColor: colors.tint }
                  ]}
                  onPress={() => toggleHabitToday(habit.id)}
                >
                  {habit.completed && (
                    <IconSymbol
                    name="checkmark"
                    size={16}
                    color={currentTheme === 'dark' ? 'black' : 'white'}
                  />
                  )}
                </TouchableOpacity>
                
                <ThemedView style={styles.habitInfo}>
                  {editingHabitId === habit.id ? (
                    <ThemedView style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={editingName}
                        onChangeText={setEditingName}
                        placeholder="Edit habit name"
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={saveEditHabit}
                      />
                      <TouchableOpacity style={[styles.button, { backgroundColor: colors.tint }]} onPress={saveEditHabit}>
                        <ThemedText style={styles.buttonText}>Save</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button, { backgroundColor: '#F5F5F5' }]} onPress={cancelEditHabit}>
                        <ThemedText>Cancel</ThemedText>
                      </TouchableOpacity>
                    </ThemedView>
                  ) : (
                    <>
                      <ThemedText 
                        style={[
                          styles.habitName,
                          habit.completed && styles.completedHabit
                        ]}
                      >
                        {habit.name}
                      </ThemedText>
                      <ThemedView style={styles.streakContainer}>
                        <ThemedText style={styles.streakEmoji}>
                          {getStreakEmoji(habit.streak)}
                        </ThemedText>
                        <ThemedText style={styles.streakText}>
                          {habit.streak} day{habit.streak !== 1 ? 's' : ''} streak
                        </ThemedText>
                      </ThemedView>
                    </>
                  )}
                </ThemedView>
              </TouchableOpacity>

              {/* Diary-style weekly pager */}
              <View style={styles.gridContainer} onLayout={onGridLayout}>
                <View style={styles.gridHeader}>
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((label, i) => (
                    <ThemedText key={`wd-${i}`} style={[styles.gridHeaderText, cellSize ? { width: cellSize } : null]}>{label.charAt(0)}</ThemedText>
                  ))}
                </View>
                <ScrollView ref={(ref) => { weekPagerRefs.current[habit.id] = ref; }} horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.weekPager}>
                  {monthMeta.weeks.map((week, wi) => (
                    <View key={`week-${wi}`} style={[styles.weekPage, gridWidth ? { width: gridWidth } : null]}>
                      {week.map((day, di) => {
                        if (day === 0) {
                          return <View key={`blank-${wi}-${di}`} style={[styles.dayCellBlank, cellSize ? { width: cellSize } : null]} />;
                        }
                        const isTodayCell = (() => {
                          const today = new Date();
                          return day === today.getDate() && monthMeta.month === today.getMonth() && monthMeta.year === today.getFullYear();
                        })();
                        const iso = formatISODate(new Date(monthMeta.year, monthMeta.month, day));
                        const checked = !!habit.completionsByDate[iso];
                        return (
                          <TouchableOpacity
                            key={`day-${wi}-${day}`}
                            onPress={() => toggleDay(habit.id, monthMeta.year, monthMeta.month, day)}
                            style={[
                              styles.dayCell,
                              cellSize ? { width: cellSize } : null,
                              checked && { backgroundColor: colors.tint, borderColor: colors.tint },
                              isTodayCell && styles.todayCell,
                            ]}
                          >
                            {checked ? (
                              <IconSymbol name="checkmark" size={14} color="black" />
                            ) : (
                              <ThemedText style={[styles.dayNumber, isTodayCell && styles.todayNumber]}>{day}</ThemedText>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>
              </View>

            </ThemedView>
          ))
        )}
      </ScrollView>

      {habits.length > 0 && (
        <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <ThemedView style={styles.stats}>
          <ThemedText type="subtitle">Today's Progress</ThemedText>
          <ThemedText style={styles.progressText}>
            {habits.filter(h => h.completed).length} of {habits.length} completed
          </ThemedText>
          <ThemedView style={styles.progressBar}>
            <ThemedView 
              style={[
                styles.progressFill, 
                { 
                  width: `${(habits.filter(h => h.completed).length / habits.length) * 100}%`,
                  backgroundColor: colors.tint
                }
              ]} 
            />
          </ThemedView>
        </ThemedView>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
  },
  addForm: {
    marginBottom: 20,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthNav: {
    padding: 8,
  },
  habitsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.7,
  },
  habitItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  habitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  completedHabit: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 12,
    opacity: 0.7,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 6,
    padding: 8,
  },
  gridContainer: {
    marginTop: 12,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 6,
  },
  gridHeaderText: {
    width: '14.2857%',
    textAlign: 'center',
    opacity: 0.6,
  },
  weekPager: {
    width: '100%',
  },
  weekPage: {
    width: '100%',
    flexDirection: 'row',
  },
  dayCellBlank: {
    width: '14.2857%',
    height: 28,
  },
  gridBody: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    backgroundColor:'#9BA1A6',
    borderColor: '#9BA1A6',
    borderWidth: 2,
  },
  stats: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  progressText: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 14,
    opacity: 0.8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#454141ff',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    color: 'black',
    height: '100%',
    borderRadius: 4,
  },
  dayNumber: {
    fontSize: 12,
    opacity: 0.8,
  },
  todayNumber: {
    fontWeight: '700',
    opacity: 1,
  },
  checkedGridBox: {
    backgroundColor:'white',
    fontWeight: '700',
    opacity: 1,
  },
}); 