import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function HomeScreen() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);

    useEffect(() => {
    const setWelcomeMessage = async () => {
        const hasVisited = await AsyncStorage.getItem('hasVisitedHome');
        if (hasVisited) {
        setMessages([{ role: 'ai', text: "Welcome back 👋! Ready to build habits, reflect, or express gratitude?" }]);
        } else {
        setMessages([{ role: 'ai', text: "Hey there 👋,\nI am your assistant!\nI can help you with:\n* Creating new habits\n* Logging Habits, Journal Entries or Gratitude Entries\n* Understand your habit statistics \n* Get more productive" }]);
        await AsyncStorage.setItem('hasVisitedHome', 'true');
        }
    };

  setWelcomeMessage();
}, []);

  const [showLetsGo, setShowLetsGo] = useState(false);

  // Check if first launch
  useEffect(() => {
    const checkFirstLoad = async () => {
      const hasVisited = await AsyncStorage.getItem('hasVisitedHome');
      if (!hasVisited) {
        setShowLetsGo(true);
        await AsyncStorage.setItem('hasVisitedHome', 'true');
      }
    };
    checkFirstLoad();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
  
    const userMessage = { role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
  
    let aiResponseText = '';
  
    // try {
    //   // Detect user command
    //   if (input.toLowerCase().startsWith('add habit')) {
    //     const habitName = input.replace(/add habit/i, '').trim();
    //     const result = await callMcpTool('add_habits', { name: habitName });
    //     aiResponseText = `✅ Added new habit: "${result.name}"`;
    //   } else if (input.toLowerCase().startsWith('add')) {
    //     // Example: "add 5 and 6"
    //     const numbers = input.match(/\d+/g);
    //     if (numbers && numbers.length === 2) {
    //       const [a, b] = numbers.map(Number);
    //       const result = await callMcpTool('add', { a, b });
    //       aiResponseText = `🤖 ${a} + ${b} = ${result}`;
    //     } else {
    //       aiResponseText = '⚠️ Please enter numbers like "add 2 and 3".';
    //     }
    //   } else {
    //     aiResponseText = "🤔 I'm not sure what to do with that yet!";
    //   }
    // } catch (err: any) {
    //   aiResponseText = `⚠️ Error: ${err.message}`;
    // }
  
    // setMessages(prev => [...prev, { role: 'ai', text: aiResponseText }]);
  
    // setTimeout(() => {
    //   scrollViewRef.current?.scrollToEnd({ animated: true });
    // }, 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">My Journal Assistant</ThemedText>
          <HelloWave />
        </ThemedView>

        {/* Chat Section (fixed height, scrollable) */}
        <ThemedView style={[styles.chatContainer, { backgroundColor: colors.icon }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScroll}
            contentContainerStyle={{ paddingBottom: 12 }}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.messageBubble,
                  msg.role === 'user'
                    ? { alignSelf: 'flex-end', backgroundColor: colors.text }
                    : { alignSelf: 'flex-start', backgroundColor: colors.background },
                ]}
              >
                <ThemedText
                  style={{
                    color: msg.role === 'user' ? colors.background : colors.text,
                  }}
                >
                  {msg.text}
                </ThemedText>
              </View>
            ))}
          </ScrollView>
        </ThemedView>

        {/* Input Box (fixed at bottom) */}
        <View
          style={[
            styles.inputContainer,
            { borderColor: colors.tint, backgroundColor: colors.background },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor={colors.text + '80'}
            style={[styles.input, { color: colors.text }]}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, { backgroundColor: colors.tint }]}
          >
            <ThemedText style={{ color: colors.background }}>Send</ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  chatContainer: {
    flex: 0.9,
    borderRadius: 12,
    marginHorizontal: 12,
    padding: 10,
  },
  chatScroll: {
    flex: 1,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: '80%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    margin: 15,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 50,
  },
  sendButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 6,
  },
  button: {
    alignSelf: 'center',
    marginBottom: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
