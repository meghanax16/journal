import React, { createContext, useContext, useState, ReactNode } from 'react';

export type JournalType = 'gratitude' | 'highlight' | 'detailed';

interface JournalSettings {
  gratitude: boolean;
  highlight: boolean;
  detailed: boolean;
}

interface JournalSettingsContextType {
  journalSettings: JournalSettings;
  toggleJournalType: (type: JournalType) => void;
  isJournalTypeEnabled: (type: JournalType) => boolean;
}

const JournalSettingsContext = createContext<JournalSettingsContextType | undefined>(undefined);

interface JournalSettingsProviderProps {
  children: ReactNode;
}

export function JournalSettingsProvider({ children }: JournalSettingsProviderProps) {
  const [journalSettings, setJournalSettings] = useState<JournalSettings>({
    gratitude: true,
    highlight: false,
    detailed: false,
  });

  const toggleJournalType = (type: JournalType) => {
    setJournalSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const isJournalTypeEnabled = (type: JournalType) => {
    return journalSettings[type];
  };

  return (
    <JournalSettingsContext.Provider value={{ 
      journalSettings, 
      toggleJournalType, 
      isJournalTypeEnabled 
    }}>
      {children}
    </JournalSettingsContext.Provider>
  );
}

export function useJournalSettings() {
  const context = useContext(JournalSettingsContext);
  if (context === undefined) {
    throw new Error('useJournalSettings must be used within a JournalSettingsProvider');
  }
  return context;
}
