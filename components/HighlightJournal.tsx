import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';

interface HighlightEntry {
  id: string;
  highlight: string;
  reason: string;
  timestamp: Date;
  mood?: string;
}

interface HighlightJournalProps {
  entry?: HighlightEntry;
  onSave: (highlight: string, reason: string, mood?: string) => void;
  onDelete?: (id: string) => void;
}

export function HighlightJournal({ entry, onSave, onDelete }: HighlightJournalProps) {
  const [highlight, setHighlight] = useState(entry?.highlight || '');
  const [reason, setReason] = useState(entry?.reason || '');
  const [mood, setMood] = useState(entry?.mood || '');
  const [isEditing, setIsEditing] = useState(!entry);
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  const moods = ['⭐', '🌟', '✨', '💫', '🎉', '🏆', '🎯', '💎'];

  const handleSave = () => {
    if (highlight.trim()) {
      onSave(highlight, reason, mood);
      if (!entry) {
        setHighlight('');
        setReason('');
        setMood('');
      }
      setIsEditing(false);
    } else {
      Alert.alert('Error', 'Please write your highlight of the day.');
    }
  };

  const handleDelete = () => {
    if (entry && onDelete) {
      Alert.alert(
        'Delete Entry',
        'Are you sure you want to delete this highlight entry?',
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
          <ThemedText type="subtitle">
            {entry.timestamp.toLocaleDateString()} at {entry.timestamp.toLocaleTimeString()}
          </ThemedText>
          {entry.mood && <ThemedText style={styles.moodText}>{entry.mood}</ThemedText>}
        </ThemedView>
        
        <ThemedView style={styles.highlightSection}>
          <ThemedView style={styles.highlightHeader}>
            <ThemedText style={styles.highlightIcon}>⭐</ThemedText>
            <ThemedText type="subtitle" style={styles.highlightTitle}>Highlight of the Day</ThemedText>
          </ThemedView>
          <ThemedText style={styles.highlightText}>{entry.highlight}</ThemedText>
        </ThemedView>

        {entry.reason && (
          <ThemedView style={styles.reasonSection}>
            <ThemedText type="defaultSemiBold" style={styles.reasonTitle}>Why this was special:</ThemedText>
            <ThemedText style={styles.reasonText}>{entry.reason}</ThemedText>
          </ThemedView>
        )}

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
      
      <ThemedText type="subtitle" style={styles.label}>What was the highlight of your day?</ThemedText>
      <TextInput
        style={[
          styles.textInput,
          styles.highlightInput,
          { 
            color: colors.text,
            borderColor: colors.tabIconDefault,
            backgroundColor: colors.background
          }
        ]}
        multiline
        placeholder="The best moment, achievement, or experience of your day..."
        placeholderTextColor={colors.tabIconDefault}
        value={highlight}
        onChangeText={setHighlight}
        textAlignVertical="top"
      />
      
      <ThemedText type="subtitle" style={styles.label}>Why was this special? (optional)</ThemedText>
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
        placeholder="What made this moment meaningful to you?"
        placeholderTextColor={colors.tabIconDefault}
        value={reason}
        onChangeText={setReason}
        textAlignVertical="top"
      />
      
      <ThemedView style={styles.buttonContainer}>
        {entry && (
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={() => {
              setIsEditing(false);
              setHighlight(entry.highlight);
              setReason(entry.reason);
              setMood(entry.mood || '');
            }}
          >
            <ThemedText type="defaultSemiBold">Cancel</ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={handleSave}
        >
          <ThemedText type="defaultSemiBold" style={styles.saveButtonText}>
            {entry ? 'Update' : 'Save Highlight'}
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
    borderColor: '#FFC107',
  },
  moodEmoji: {
    fontSize: 24,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  highlightInput: {
    minHeight: 100,
    borderColor: '#FFC107',
    borderWidth: 2,
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
  saveButton: {
    backgroundColor: '#FFC107',
  },
  saveButtonText: {
    color: 'white',
  },
  entryContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
    backgroundColor: '#FFFDE7',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodText: {
    fontSize: 24,
  },
  highlightSection: {
    marginBottom: 16,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  highlightIcon: {
    fontSize: 20,
  },
  highlightTitle: {
    color: '#F57C00',
  },
  highlightText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  reasonSection: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFE082',
  },
  reasonTitle: {
    marginBottom: 8,
    opacity: 0.8,
  },
  reasonText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
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
