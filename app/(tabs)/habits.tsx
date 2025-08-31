import { HabitTracker } from '@/components/HabitTracker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { loadHabits, saveHabits, Habit } from '@/utils/storage';

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const { currentTheme } = useTheme();

  // Load habits from storage on component mount
  useEffect(() => {
    const loadHabitsData = async () => {
      try {
        const loadedHabits = await loadHabits();
        console.log('DEBUG: Loaded habits from storage:', loadedHabits.length, loadedHabits);
        setHabits(loadedHabits);
      } catch (error) {
        console.error('Error loading habits:', error);
      }
    };

    loadHabitsData();
  }, []);

  const handleHabitsChange = async (newHabits: Habit[]) => {
    console.log('DEBUG: Saving habits to storage:', newHabits.length, newHabits);
    setHabits(newHabits);
    try {
      await saveHabits(newHabits);
      console.log('DEBUG: Habits saved successfully');
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Habit Tracker</ThemedText>
        <ThemedText style={styles.subtitle}>
          Build positive habits and track your progress
        </ThemedText>
      </ThemedView>

      <HabitTracker habits={habits} onHabitsChange={handleHabitsChange} />
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
}); 