import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';

interface JournalEntryProps {
  entry?: {
    id: string;
    content: string;
    timestamp: Date;
    mood?: string;
  };
  onSave: (content: string, mood?: string) => void;
  onDelete?: (id: string) => void;
}

export function JournalEntry({ entry, onSave, onDelete }: JournalEntryProps) {
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState(entry?.mood || '');
  const [isEditing, setIsEditing] = useState(!entry);
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  const moods = ['😊', '😐', '😢', '😡', '😴', '🤔', '😌', '😤','🥹','🤯','😎','🫣','😜','🥰'];

  const handleSave = () => {
    if (content.trim()) {
      onSave(content, mood);
      if (!entry) {
        setContent('');
        setMood('');
      }
      setIsEditing(false);
    } else {
      Alert.alert('Error', 'Please write something in your journal entry.');
    }
  };

  const handleDelete = () => {
    if (entry && onDelete) {
      Alert.alert(
        'Delete Entry',
        'Are you sure you want to delete this entry?',
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
        <ThemedText style={[styles.entryContent,{backgroundColor: colors.background}]}>{entry.content}</ThemedText>
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
      
      <ThemedText type="subtitle" style={styles.label}>Write your thoughts...</ThemedText>
      <TextInput
        style={[
          styles.textInput,
          { 
            color: colors.text,
            borderColor: colors.tabIconDefault,
            backgroundColor: colors.background
          }
        ]}
        multiline
        placeholder="What's on your mind today?"
        placeholderTextColor={colors.tabIconDefault}
        value={content}
        onChangeText={setContent}
        textAlignVertical="top"
      />
      
      <ThemedView style={styles.buttonContainer}>
        {entry && (
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={() => {
              setIsEditing(false);
              setContent(entry.content);
              setMood(entry.mood || '');
            }}
          >
            <ThemedText type="defaultSemiBold">Cancel</ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.button,{backgroundColor: colors.tint}]} 
          onPress={handleSave}
        >
          <ThemedText type="defaultSemiBold" style={{color: colors.background}}>
            {entry ? 'Update' : 'Save Entry'}
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
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  moodEmoji: {
    fontSize: 22,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
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
  entryContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodText: {
    fontSize: 20,
  },
  entryContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
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