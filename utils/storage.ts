import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  DETAILED_ENTRIES: 'journal_detailed_entries',
  GRATITUDE_ENTRIES: 'journal_gratitude_entries',
  HIGHLIGHT_ENTRIES: 'journal_highlight_entries',
  ACCOUNTABILITY_PARTNERS: 'journal_accountability_partners',
};

// Generic storage functions
const saveToStorage = async (key: string, data: any): Promise<void> => {
  try {
    const jsonData = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonData);
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
};

const loadFromStorage = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const jsonData = await AsyncStorage.getItem(key);
    if (jsonData) {
      const parsedData = JSON.parse(jsonData);
      // Convert timestamp strings back to Date objects
      if (Array.isArray(parsedData)) {
        return parsedData.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })) as T;
      }
      return parsedData;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return defaultValue;
  }
};

// Journal-specific storage functions
export const saveDetailedEntries = async (entries: any[]): Promise<void> => {
  await saveToStorage(STORAGE_KEYS.DETAILED_ENTRIES, entries);
};

export const loadDetailedEntries = async (): Promise<any[]> => {
  return await loadFromStorage(STORAGE_KEYS.DETAILED_ENTRIES, []);
};

export const saveGratitudeEntries = async (entries: any[]): Promise<void> => {
  await saveToStorage(STORAGE_KEYS.GRATITUDE_ENTRIES, entries);
};

export const loadGratitudeEntries = async (): Promise<any[]> => {
  return await loadFromStorage(STORAGE_KEYS.GRATITUDE_ENTRIES, []);
};

export const saveHighlightEntries = async (entries: any[]): Promise<void> => {
  await saveToStorage(STORAGE_KEYS.HIGHLIGHT_ENTRIES, entries);
};

export const loadHighlightEntries = async (): Promise<any[]> => {
  return await loadFromStorage(STORAGE_KEYS.HIGHLIGHT_ENTRIES, []);
};

// Clear all journal data (for settings clear function)
export const clearAllJournalData = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.DETAILED_ENTRIES),
      AsyncStorage.removeItem(STORAGE_KEYS.GRATITUDE_ENTRIES),
      AsyncStorage.removeItem(STORAGE_KEYS.HIGHLIGHT_ENTRIES),
      AsyncStorage.removeItem('@journal_habits'),
      AsyncStorage.removeItem(STORAGE_KEYS.ACCOUNTABILITY_PARTNERS),
    ]);
  } catch (error) {
    console.error('Error clearing journal data:', error);
  }
};

// Accountability Partner data types
export interface AccountabilityPartner {
  name: string;
  phoneNumber: string;
  enabled: boolean;
}

// Habit data types
export interface Habit {
  id: string;
  name: string;
  completed: boolean;
  streak: number;
  createdAt: Date;
  completionsByDate: Record<string, boolean>;
  notify?: boolean;
  notifyTime?: string;
  notificationId?: string;
  accountabilityPartner?: AccountabilityPartner;
}

// Save habits to storage
export const saveHabits = async (habits: Habit[]): Promise<void> => {
  try {
    const habitsData = habits.map(habit => ({
      ...habit,
      createdAt: habit.createdAt.toISOString(),
    }));
    console.log('DEBUG saveHabits: Saving habits to storage:', habits.length, habitsData);
    await AsyncStorage.setItem('@journal_habits', JSON.stringify(habitsData));
    console.log('DEBUG saveHabits: Successfully saved to AsyncStorage');
  } catch (error) {
    console.error('Error saving habits:', error);
    throw error;
  }
};

// Load habits from storage
export const loadHabits = async (): Promise<Habit[]> => {
  try {
    const habitsJson = await AsyncStorage.getItem('@journal_habits');
    console.log('DEBUG loadHabits: Raw storage data:', habitsJson);
    if (!habitsJson) return [];
    
    const habitsData = JSON.parse(habitsJson);
    const processedHabits = habitsData.map((habit: any) => ({
      ...habit,
      createdAt: new Date(habit.createdAt),
    }));
    console.log('DEBUG loadHabits: Processed habits:', processedHabits.length, processedHabits);
    return processedHabits;
  } catch (error) {
    console.error('Error loading habits:', error);
    return [];
  }
};

// Clear habits data
export const clearHabitsData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('@journal_habits');
  } catch (error) {
    console.error('Error clearing habits data:', error);
    throw error;
  }
};

// Export all journal data
// Global accountability partner functions
export const saveAccountabilityPartner = async (partner: AccountabilityPartner): Promise<void> => {
  await saveToStorage(STORAGE_KEYS.ACCOUNTABILITY_PARTNERS, partner);
};

export const loadAccountabilityPartner = async (): Promise<AccountabilityPartner | null> => {
  return await loadFromStorage(STORAGE_KEYS.ACCOUNTABILITY_PARTNERS, null);
};

export const clearAccountabilityPartner = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACCOUNTABILITY_PARTNERS);
  } catch (error) {
    console.error('Error clearing accountability partner:', error);
    throw error;
  }
};

export const exportAllJournalData = async () => {
  try {
    const [detailedEntries, gratitudeEntries, highlightEntries, habits, accountabilityPartner] = await Promise.all([
      loadDetailedEntries(),
      loadGratitudeEntries(),
      loadHighlightEntries(),
      loadHabits(),
      loadAccountabilityPartner(),
    ]);

    return {
      exportDate: new Date().toISOString(),
      detailedEntries,
      gratitudeEntries,
      highlightEntries,
      habits,
      accountabilityPartner,
    };
  } catch (error) {
    console.error('Error exporting journal data:', error);
    return null;
  }
};
