import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { AccountabilityPartner, loadAccountabilityPartner, saveAccountabilityPartner } from '@/utils/storage';
import { validatePhoneNumber } from '@/utils/whatsapp';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';

export function GlobalAccountabilityPartner() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const [partner, setPartner] = useState<AccountabilityPartner | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    loadPartnerData();
  }, []);

  const loadPartnerData = async () => {
    try {
      const loadedPartner = await loadAccountabilityPartner();
      setPartner(loadedPartner);
    } catch (error) {
      console.error('Error loading accountability partner:', error);
    }
  };

  const savePartner = async () => {
    if (!partnerName.trim()) {
      Alert.alert('Error', 'Please enter your partner\'s name.');
      return;
    }

    if (!partnerPhone.trim()) {
      Alert.alert('Error', 'Please enter your partner\'s phone number.');
      return;
    }

    if (!validatePhoneNumber(partnerPhone)) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return;
    }

    const newPartner: AccountabilityPartner = {
      name: partnerName.trim(),
      phoneNumber: partnerPhone.trim(),
      enabled: true,
    };

    try {
      await saveAccountabilityPartner(newPartner);
      setPartner(newPartner);
      setIsEditing(false);
      Alert.alert('Success', `${partnerName} will now receive updates when you complete habits!`);
    } catch (error) {
      console.error('Error saving accountability partner:', error);
      Alert.alert('Error', 'Failed to save accountability partner. Please try again.');
    }
  };

  const removePartner = () => {
    Alert.alert(
      'Remove Accountability Partner',
      `Remove ${partner?.name} as your accountability partner?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await saveAccountabilityPartner({ name: '', phoneNumber: '', enabled: false });
              setPartner(null);
            } catch (error) {
              console.error('Error removing accountability partner:', error);
            }
          },
        },
      ]
    );
  };

  const togglePartnerEnabled = async () => {
    if (!partner) return;

    const updatedPartner: AccountabilityPartner = {
      ...partner,
      enabled: !partner.enabled,
    };

    try {
      await saveAccountabilityPartner(updatedPartner);
      setPartner(updatedPartner);
    } catch (error) {
      console.error('Error updating accountability partner:', error);
    }
  };

  const startEditing = () => {
    setPartnerName(partner?.name || '');
    setPartnerPhone(partner?.phoneNumber || '');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setPartnerName(partner?.name || '');
    setPartnerPhone(partner?.phoneNumber || '');
    setIsEditing(false);
  };

  const hasPartner = partner && partner.name;

  return (
    <ThemedView style={[styles.container, { borderColor: colors.tabIconDefault }]}> 
      <TouchableOpacity style={styles.header} onPress={() => setIsCollapsed(!isCollapsed)}> 
        <IconSymbol name="person.2" size={24} color={colors.icon} /> 
        <ThemedText style={styles.title}>Accountability Partner</ThemedText> 
        <IconSymbol name={isCollapsed ? "chevron.down" : "chevron.up"} size={20} color={colors.icon} /> 
      </TouchableOpacity>

      {!isCollapsed && ( 
        !hasPartner && !isEditing ? ( 
          <ThemedView style={styles.emptyState}> 
            <ThemedText style={[styles.emptyText, { color: colors.text }]}> 
              Add an accountability partner to receive WhatsApp updates when you complete any habit 
            </ThemedText> 
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.tint }]} 
              onPress={() => setIsEditing(true)} 
            > 
              <IconSymbol name="plus" size={16} color={colors.background} /> 
              <ThemedText style={[styles.buttonText, {color: colors.background}]}>Add Partner</ThemedText> 
            </TouchableOpacity> 
          </ThemedView> 
        ) : isEditing ? ( 
          <ThemedView style={styles.form}> 
            <TextInput 
              style={[ 
                styles.input, 
                { 
                  color: colors.text, 
                  borderColor: colors.tabIconDefault, 
                  backgroundColor: colors.background, 
                }, 
              ]} 
              placeholder="Partner's name" 
              placeholderTextColor={colors.tabIconDefault} 
              value={partnerName} 
              onChangeText={setPartnerName} 
            /> 
            <TextInput 
              style={[ 
                styles.input, 
                { 
                  color: colors.text, 
                  borderColor: colors.tabIconDefault, 
                  backgroundColor: colors.background, 
                }, 
              ]} 
              placeholder="Phone number" 
              placeholderTextColor={colors.tabIconDefault} 
              value={partnerPhone} 
              onChangeText={setPartnerPhone} 
              keyboardType="phone-pad" 
            /> 
            <ThemedView style={styles.buttonRow}> 
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: colors.tint, flex: 1 }]} 
                onPress={savePartner} 
              > 
                <ThemedText style={[styles.buttonText, {color: colors.background}]}>Save</ThemedText> 
              </TouchableOpacity> 
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#f31313ff', flex: 1 }]} 
                onPress={cancelEditing} 
              > 
                <ThemedText style={[styles.buttonText, { color: colors.background }]}>Cancel</ThemedText> 
              </TouchableOpacity> 
            </ThemedView> 
          </ThemedView> 
        ) : ( 
          <ThemedView style={styles.partnerInfo}> 
            <ThemedView style={styles.partnerDetails}> 
              <ThemedText style={[styles.partnerName, { color: colors.text }]}>{partner?.name}</ThemedText> 
              <ThemedText style={[styles.partnerPhone, { color: colors.text }]}>{partner?.phoneNumber}</ThemedText> 
              <ThemedView style={styles.statusRow}> 
                <Switch
                  value={partner?.enabled}
                  onValueChange={(newValue) => {
                    togglePartnerEnabled();
                    setTimeout(() => {
                      Alert.alert(
                         newValue ? 'Enabled' : 'Disabled','',
                        [{ text: 'OK' }]
                      );
                    }, 0);
                  }}
                  trackColor={{ false: colors.background, true: colors.tint }}
                  thumbColor={partner?.enabled ? colors.background : colors.tint}
                />

              </ThemedView> 
            </ThemedView> 
            <ThemedView style={styles.actions}> 
              <TouchableOpacity style={styles.actionButton} onPress={startEditing}> 
                <IconSymbol name="pencil" size={16} color={colors.icon} /> 
              </TouchableOpacity> 
              <TouchableOpacity style={styles.actionButton} onPress={removePartner}> 
                <IconSymbol name="trash" size={16} color="#FF6B6B" /> 
              </TouchableOpacity> 
            </ThemedView> 
          </ThemedView> 
        )
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  partnerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerDetails: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  partnerPhone: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
});
