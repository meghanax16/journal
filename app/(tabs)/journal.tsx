import { GratitudeJournal } from '@/components/GratitudeJournal';
import { HighlightJournal } from '@/components/HighlightJournal';
import { JournalEntry } from '@/components/JournalEntry';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useJournalSettings } from '@/contexts/JournalSettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  loadDetailedEntries,
  loadGratitudeEntries,
  loadHighlightEntries,
  saveDetailedEntries,
  saveGratitudeEntries,
  saveHighlightEntries
} from '@/utils/storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface JournalEntryData {
  id: string;
  content: string;
  timestamp: Date;
  mood?: string;
}

interface GratitudeEntryData {
  id: string;
  gratitude1: string;
  gratitude2: string;
  gratitude3: string;
  timestamp: Date;
  mood?: string;
}

interface HighlightEntryData {
  id: string;
  highlight: string;
  reason: string;
  timestamp: Date;
  mood?: string;
}

export default function JournalScreen() {
  const { isJournalTypeEnabled } = useJournalSettings();
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const tabBarHeight = useBottomTabBarHeight();
  const [entries, setEntries] = useState<JournalEntryData[]>([]);
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntryData[]>([]);
  const [highlightEntries, setHighlightEntries] = useState<HighlightEntryData[]>([]);
  const [showPreviousEntries, setShowPreviousEntries] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    gratitude: false,
    highlight: false,
    detailed: false
  });

  // Load entries from storage on component mount
  useEffect(() => {
    const loadAllEntries = async () => {
      try {
        const [loadedDetailedEntries, loadedGratitudeEntries, loadedHighlightEntries] = await Promise.all([
          loadDetailedEntries(),
          loadGratitudeEntries(),
          loadHighlightEntries(),
        ]);
        
        setEntries(loadedDetailedEntries);
        setGratitudeEntries(loadedGratitudeEntries);
        setHighlightEntries(loadedHighlightEntries);
      } catch (error) {
        console.error('Error loading journal entries:', error);
      }
    };

    loadAllEntries();
  }, []);

  // Detailed Journal handlers
  const handleSaveEntry = async (content: string, mood?: string) => {
    const newEntry: JournalEntryData = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      mood
    };
    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    await saveDetailedEntries(updatedEntries);
  };

  const handleUpdateEntry = async (entryId: string, content: string, mood?: string) => {
    const updatedEntries = entries.map(entry => 
      entry.id === entryId 
        ? { ...entry, content, mood, timestamp: new Date() }
        : entry
    );
    setEntries(updatedEntries);
    await saveDetailedEntries(updatedEntries);
  };

  const handleDeleteEntry = async (entryId: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    setEntries(updatedEntries);
    await saveDetailedEntries(updatedEntries);
  };

  const handleSave = (content: string, mood?: string) => {
    handleSaveEntry(content, mood);
  };

  // Gratitude Journal handlers
  const handleSaveGratitude = async (gratitude1: string, gratitude2: string, gratitude3: string, mood?: string) => {
    const newEntry: GratitudeEntryData = {
      id: Date.now().toString(),
      gratitude1,
      gratitude2,
      gratitude3,
      timestamp: new Date(),
      mood
    };
    const updatedEntries = [newEntry, ...gratitudeEntries];
    setGratitudeEntries(updatedEntries);
    await saveGratitudeEntries(updatedEntries);
  };

  const handleUpdateGratitude = async (entryId: string, gratitude1: string, gratitude2: string, gratitude3: string, mood?: string) => {
    const updatedEntries = gratitudeEntries.map(entry => 
      entry.id === entryId 
        ? { ...entry, gratitude1, gratitude2, gratitude3, mood, timestamp: new Date() }
        : entry
    );
    setGratitudeEntries(updatedEntries);
    await saveGratitudeEntries(updatedEntries);
  };

  const handleDeleteGratitude = async (entryId: string) => {
    const updatedEntries = gratitudeEntries.filter(entry => entry.id !== entryId);
    setGratitudeEntries(updatedEntries);
    await saveGratitudeEntries(updatedEntries);
  };

  // Highlight Journal handlers
  const handleSaveHighlight = async (highlight: string, reason: string, mood?: string) => {
    const newEntry: HighlightEntryData = {
      id: Date.now().toString(),
      highlight,
      reason,
      timestamp: new Date(),
      mood
    };
    const updatedEntries = [newEntry, ...highlightEntries];
    setHighlightEntries(updatedEntries);
    await saveHighlightEntries(updatedEntries);
  };

  const handleUpdateHighlight = async (entryId: string, highlight: string, reason: string, mood?: string) => {
    const updatedEntries = highlightEntries.map(entry => 
      entry.id === entryId 
        ? { ...entry, highlight, reason, mood, timestamp: new Date() }
        : entry
    );
    setHighlightEntries(updatedEntries);
    await saveHighlightEntries(updatedEntries);
  };

  const handleDeleteHighlight = async (entryId: string) => {
    const updatedEntries = highlightEntries.filter(entry => entry.id !== entryId);
    setHighlightEntries(updatedEntries);
    await saveHighlightEntries(updatedEntries);
  };

  const getJournalTitle = () => {
    const enabledTypes = [];
    if (isJournalTypeEnabled('gratitude')) enabledTypes.push('Gratitude');
    if (isJournalTypeEnabled('highlight')) enabledTypes.push('Highlights');
    if (isJournalTypeEnabled('detailed')) enabledTypes.push('Journal');
    
    if (enabledTypes.length === 0) return 'My Journal';
    if (enabledTypes.length === 1) return `${enabledTypes[0]} Journal`;
    return `My ${enabledTypes.join(' & ')}`;
  };

  const getJournalSubtitle = () => {
    const enabledCount = [
      isJournalTypeEnabled('gratitude'),
      isJournalTypeEnabled('highlight'),
      isJournalTypeEnabled('detailed')
    ].filter(Boolean).length;
    
    if (enabledCount === 0) return 'Enable journal types in Settings';
    if (enabledCount === 1) {
      if (isJournalTypeEnabled('gratitude')) return 'Reflect on what you\'re grateful for today';
      if (isJournalTypeEnabled('highlight')) return 'Capture the best moments of your day';
      if (isJournalTypeEnabled('detailed')) return 'Write about your day and track your mood';
    }
    return 'Capture your thoughts in multiple ways';
  };

  const getTotalEntriesCount = () => {
    return entries.length + gratitudeEntries.length + highlightEntries.length;
  };

  const toggleSection = (sectionType: 'gratitude' | 'highlight' | 'detailed') => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionType]: !prev[sectionType]
    }));
  };

  const renderPreviousEntries = () => {
    if (!showPreviousEntries) return null;

    const renderSection = (title: string, sectionEntries: any[], type: string, icon: string) => {
      if (sectionEntries.length === 0) return null;

      const sortedEntries = sectionEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      const isExpanded = expandedSections[type as keyof typeof expandedSections];

      return (
        <ThemedView key={type} style={styles.entriesSubsection}>
          <TouchableOpacity 
            style={[styles.subsectionHeader,{backgroundColor:colors.tint}]}
            onPress={() => toggleSection(type as 'gratitude' | 'highlight' | 'detailed')}
          >
            <IconSymbol name={icon as any} size={18} color={colors.background} />
            <ThemedText type="subtitle" style={[styles.subsectionTitle,{color:colors.background}]}>
              {title} ({sectionEntries.length})
            </ThemedText>
            <IconSymbol 
              name={isExpanded ? "chevron.up" : "chevron.down"} 
              size={16} 
              color={colors.tabIconDefault} 
            />
          </TouchableOpacity>
          {isExpanded && sortedEntries.map(entry => {
            if (type === 'gratitude') {
              return (
                <GratitudeJournal
                  key={`gratitude-${entry.id}`}
                  entry={entry}
                  onSave={(gratitude1, gratitude2, gratitude3, mood) => 
                    handleUpdateGratitude(entry.id, gratitude1, gratitude2, gratitude3, mood)
                  }
                  onDelete={handleDeleteGratitude}
                />
              );
            } else if (type === 'highlight') {
              return (
                <HighlightJournal
                  key={`highlight-${entry.id}`}
                  entry={entry}
                  onSave={(highlight, reason, mood) => 
                    handleUpdateHighlight(entry.id, highlight, reason, mood)
                  }
                  onDelete={handleDeleteHighlight}
                />
              );
            } else {
              return (
                <JournalEntry
                  key={`detailed-${entry.id}`}
                  entry={entry}
                  onSave={(content, mood) => handleUpdateEntry(entry.id, content, mood || '')}
                  onDelete={handleDeleteEntry}
                />
              );
            }
          })}
        </ThemedView>
      );
    };

    return (
      <ThemedView style={styles.previousEntriesSection}>
        {renderSection('Gratitude Entries', gratitudeEntries, 'gratitude', 'sun.max')}
        {renderSection('Daily Highlights', highlightEntries, 'highlight', 'star')}
        {renderSection('Detailed Entries', entries, 'detailed', 'doc.text')}
      </ThemedView>
    );
  };

  const renderJournalContent = () => {
    const enabledCount = [
      isJournalTypeEnabled('gratitude'),
      isJournalTypeEnabled('highlight'),
      isJournalTypeEnabled('detailed')
    ].filter(Boolean).length;

    if (enabledCount === 0) {
      return (
        <ThemedView style={styles.emptyState}>
          <ThemedText type="subtitle" style={styles.emptyTitle}>No Journal Types Enabled</ThemedText>
          <ThemedText style={styles.emptyText}>
            Go to Settings to enable one or more journal types to start writing.
          </ThemedText>
        </ThemedView>
      );
    }

    return (
      <>
        {/* Current Journal Inputs */}
        {isJournalTypeEnabled('gratitude') && (
          <ThemedView style={styles.journalSection}>
            <GratitudeJournal onSave={handleSaveGratitude} />
          </ThemedView>
        )}

        {isJournalTypeEnabled('highlight') && (
          <ThemedView style={styles.journalSection}>
            <HighlightJournal onSave={handleSaveHighlight} />
          </ThemedView>
        )}

        {isJournalTypeEnabled('detailed') && (
          <ThemedView style={styles.journalSection}>
            <JournalEntry onSave={handleSave} />
          </ThemedView>
        )}

        {/* Previous Entries Toggle */}
        {getTotalEntriesCount() > 0 && (
          <ThemedView style={styles.previousEntriesToggle}>
            <TouchableOpacity 
              style={[styles.toggleButton, 
                { 
                  borderColor: colors.tint,
                  backgroundColor: showPreviousEntries ? colors.background : colors.tint,
                },]}
              onPress={() => setShowPreviousEntries(!showPreviousEntries)}
            >
              <IconSymbol 
                name={showPreviousEntries ? "chevron.up" : "chevron.down"} 
                size={16} 
                color={showPreviousEntries ? colors.tint : colors.background} 
              />
              <ThemedText style={[styles.toggleText, 
                { color: showPreviousEntries ? colors.tint : colors.background }]}>
                {showPreviousEntries ? 'Hide' : 'Show'} Previous Entries ({getTotalEntriesCount()})
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Previous Entries */}
        {renderPreviousEntries()}
      </>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">{getJournalTitle()}</ThemedText>
        <ThemedText style={styles.subtitle}>
          {getJournalSubtitle()}
        </ThemedText>
      </ThemedView>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: tabBarHeight }}
        >
          {renderJournalContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
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
  entriesSection: {
    marginTop: 20,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  journalSection: {
    marginBottom: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  previousEntriesToggle: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
  },
  previousEntriesSection: {
    marginTop: 10,
  },
  entriesSubsection: {
    marginBottom: 24,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
}); 