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
    console.log('DEBUG saveHabits: Saving habits to Mongo via REST:', habits.length);
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8100';
    const res = await fetch(`${baseUrl}/habits/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habitsData),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Mongo save failed: ${res.status} ${text}`);
    }
    console.log('DEBUG saveHabits: Successfully saved to Mongo');
  } catch (error) {
    console.error('Error saving habits to Mongo:', error);
    throw error;
  }
};

// Load habits from storage
export const loadHabits = async (): Promise<Habit[]> => {
  try {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8100';
    const res = await fetch(`${baseUrl}/habits`);
    if (!res.ok) {
      throw new Error(`Failed to fetch habits: ${res.status}`);
    }
    const habitsData = await res.json();
    const processedHabits: Habit[] = (habitsData || []).map((habit: any) => ({
      id: habit.id,
      name: habit.name,
      completed: Boolean(habit.completed),
      streak: Number(habit.streak || 0),
      createdAt: new Date(habit.createdAt),
      completionsByDate: habit.completionsByDate || {},
      notify: habit.notify,
      notifyTime: habit.notifyTime,
      notificationId: habit.notificationId,
      accountabilityPartner: habit.accountabilityPartner,
    }));
    console.log('DEBUG loadHabits (Mongo):', processedHabits.length);
    return processedHabits;
  } catch (error) {
    console.error('Error loading habits from Mongo, falling back to AsyncStorage:', error);
    try {
      const habitsJson = await AsyncStorage.getItem('@journal_habits');
      if (!habitsJson) return [];
      const habitsData = JSON.parse(habitsJson);
      return habitsData.map((habit: any) => ({
        ...habit,
        createdAt: new Date(habit.createdAt),
      }));
    } catch (e) {
      console.error('Fallback loadHabits failed:', e);
      return [];
    }
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
