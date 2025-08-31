import { Alert, Linking } from 'react-native';
import { AccountabilityPartner } from './storage';

// Format phone number for WhatsApp (remove non-digits and ensure proper format)
const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  // Do not add country code, just return digits as entered
  return digits;
};

// Send WhatsApp message to accountability partner
export const sendAccountabilityMessage = async (
  partner: AccountabilityPartner,
  habitName: string,
  userName: string = 'Your partner'
): Promise<boolean> => {
  try {
    if (!partner.enabled) {
      return false;
    }

    const formattedNumber = formatPhoneNumber(partner.phoneNumber);
    const message = `🎉 ${userName} just completed their "${habitName}" habit! Keep up the great work and stay motivated! 💪`;
    
    // Create WhatsApp URL
    const whatsappUrl = `whatsapp://send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`;
    
    // Check if WhatsApp is available
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    console.log('DEBUG: WhatsApp URL:', whatsappUrl, 'Can open:', canOpen);
    
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      return true;
    } else {
      // Fallback to web WhatsApp
      const webWhatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
      await Linking.openURL(webWhatsappUrl);
      return true;
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    Alert.alert(
      'WhatsApp Error',
      'Could not send message to accountability partner. Please check their phone number and try again.'
    );
    return false;
  }
};

// Validate phone number format
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const digits = phoneNumber.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};
