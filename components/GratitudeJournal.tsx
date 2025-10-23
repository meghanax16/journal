import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';

interface GratitudeEntry {
  id: string;
  gratitude1: string;
  gratitude2: string;
  gratitude3: string;
  timestamp: Date;
  mood?: string;
}

interface GratitudeJournalProps {
  entry?: GratitudeEntry;
  onSave: (gratitude1: string, gratitude2: string, gratitude3: string, mood?: string) => void;
  onDelete?: (id: string) => void;
}

export function GratitudeJournal({ entry, onSave, onDelete }: GratitudeJournalProps) {
  const [gratitude1, setGratitude1] = useState(entry?.gratitude1 || '');
  const [gratitude2, setGratitude2] = useState(entry?.gratitude2 || '');
  const [gratitude3, setGratitude3] = useState(entry?.gratitude3 || '');
  const [mood, setMood] = useState(entry?.mood || '');
  const [isEditing, setIsEditing] = useState(!entry);
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  const moods = ['😌', '🙏', '💖', '✨', '🥹', '🌸','🍀'];

  const handleSave = () => {
    if (gratitude1.trim() || gratitude2.trim() || gratitude3.trim()) {
      onSave(gratitude1, gratitude2, gratitude3, mood);
      if (!entry) {
        setGratitude1('');
        setGratitude2('');
        setGratitude3('');
        setMood('');
      }
      setIsEditing(false);
    } else {
      Alert.alert('Error', 'Please write at least one thing you\'re grateful for.');
    }
  };

  const handleDelete = () => {
    if (entry && onDelete) {
      Alert.alert(
        'Delete Entry',
        'Are you sure you want to delete this gratitude entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry.id) }
        ]
      );
    }
  };

  if (!isEditing && entry) {
    return (
      <ThemedView style={styles.entryContainer}>
        <ThemedView style={styles.entryHeader}>
          <ThemedText>
            {entry.timestamp.toLocaleDateString()} at {entry.timestamp.toLocaleTimeString()}
          </ThemedText>
          {entry.mood && <ThemedText style={styles.moodText}>{entry.mood}</ThemedText>}
        </ThemedView>
        
        <ThemedView style={styles.gratitudeList}>
          {entry.gratitude1 && (
            <ThemedView style={styles.gratitudeItem}>
              <ThemedText style={styles.gratitudeBullet}>🌱</ThemedText>
              <ThemedText style={styles.gratitudeText}>{entry.gratitude1}</ThemedText>
            </ThemedView>
          )}
          {entry.gratitude2 && (
            <ThemedView style={styles.gratitudeItem}>
              <ThemedText style={styles.gratitudeBullet}>🪻</ThemedText>
              <ThemedText style={styles.gratitudeText}>{entry.gratitude2}</ThemedText>
            </ThemedView>
          )}
          {entry.gratitude3 && (
            <ThemedView style={styles.gratitudeItem}>
              <ThemedText style={styles.gratitudeBullet}>🐚</ThemedText>
              <ThemedText style={styles.gratitudeText}>{entry.gratitude3}</ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={styles.entryActions}>
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionButton}>
            <IconSymbol name="pencil" size={20} color={colors.tint} />
            <ThemedText type="link" style={styles.actionText}>Edit</ThemedText>
          </TouchableOpacity>
          {onDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
              <IconSymbol name="trash" size={20} color="#FF3B30" />
              <ThemedText type="link" style={[styles.actionText, { color: '#FF3B30' }]}>Delete</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.label}>How are you feeling today?</ThemedText>
      <ThemedView style={styles.moodContainer}>
        {moods.map((moodEmoji, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.moodButton,
              mood === moodEmoji && styles.selectedMood
            ]}
            onPress={() => setMood(moodEmoji)}
          >
            <ThemedText style={styles.moodEmoji}>{moodEmoji}</ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>
      
      <ThemedText type="subtitle" style={styles.label}>What are you grateful for today?</ThemedText>
      
      <ThemedView style={styles.gratitudeInputs}>
        <ThemedView style={styles.inputGroup}>
          <ThemedText style={styles.inputLabel}>1. I'm grateful for...</ThemedText>
          <TextInput
            style={[
              styles.textInput,
              { 
                color: colors.text,
                borderColor: colors.tabIconDefault,
                backgroundColor: colors.background
              }
            ]}
            placeholder="Something you're grateful for"
            placeholderTextColor={colors.tabIconDefault}
            value={gratitude1}
            onChangeText={setGratitude1}
            multiline
          />
        </ThemedView>

        <ThemedView style={styles.inputGroup}>
          <ThemedText style={styles.inputLabel}>2. I'm grateful for...</ThemedText>
          <TextInput
            style={[
              styles.textInput,
              { 
                color: colors.text,
                borderColor: colors.tabIconDefault,
                backgroundColor: colors.background
              }
            ]}
            placeholder="Another thing you're grateful for"
            placeholderTextColor={colors.tabIconDefault}
            value={gratitude2}
            onChangeText={setGratitude2}
            multiline
          />
        </ThemedView>

        <ThemedView style={styles.inputGroup}>
          <ThemedText style={styles.inputLabel}>3. I'm grateful for...</ThemedText>
          <TextInput
            style={[
              styles.textInput,
              { 
                color: colors.text,
                borderColor: colors.tabIconDefault,
                backgroundColor: colors.background
              }
            ]}
            placeholder="One more thing you're grateful for"
            placeholderTextColor={colors.tabIconDefault}
            value={gratitude3}
            onChangeText={setGratitude3}
            multiline
          />
        </ThemedView>
      </ThemedView>
      
      <ThemedView style={styles.buttonContainer}>
        {entry && (
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={() => {
              setIsEditing(false);
              setGratitude1(entry.gratitude1);
              setGratitude2(entry.gratitude2);
              setGratitude3(entry.gratitude3);
              setMood(entry.mood || '');
            }}
          >
            <ThemedText type="defaultSemiBold">Cancel</ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.button,{backgroundColor:colors.tint}]} 
          onPress={handleSave}
        >
          <ThemedText type="defaultSemiBold" style={styles.saveButtonText}>
            {entry ? 'Update' : 'Save Gratitude'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  label: {
    marginBottom: 8,
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  moodButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedMood: {
    backgroundColor: '#FFF9C4',
    borderColor:'#FFC107',
  },
  moodEmoji: {
    fontSize: 22,
  },
  gratitudeInputs: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButtonText: {
    color: 'white',
  },
  entryContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:'rgb(255, 255, 255)',
    backgroundColor: '#FFFFFF',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodText: {
    fontSize: 20,
  },
  gratitudeList: {
    gap: 12,
    marginBottom: 16,
  },
  gratitudeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  gratitudeBullet: {
    fontSize: 16,
    marginTop: 2,
  },
  gratitudeText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
  },
});
