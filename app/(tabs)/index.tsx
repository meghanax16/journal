import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">My Journal App</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">📝 Journal Your Thoughts</ThemedText>
        <ThemedText>
          Tap the <ThemedText type="defaultSemiBold">Journal</ThemedText> tab to write about your day, 
          track your mood, and reflect on your experiences.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">✅ Track Your Habits</ThemedText>
        <ThemedText>
          Visit the <ThemedText type="defaultSemiBold">Habits</ThemedText> tab to create daily habits, 
          check them off as you complete them, and build streaks to stay motivated.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">🎯 Build Better Habits</ThemedText>
        <ThemedText>
          Start with simple habits like "Drink water" or "Read 10 minutes" and watch your streaks grow. 
          Every day is a new opportunity to improve!
        </ThemedText>
    </ThemedView>
    <TouchableOpacity 
          style={[styles.button,{backgroundColor: colors.tint}]} 
          onPress={() => router.push('/(tabs)/habits')}
        >
          <ThemedText type="defaultSemiBold" style={[{color: colors.background}]}>
            Let's Go!
          </ThemedText>
        </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 150,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
});
