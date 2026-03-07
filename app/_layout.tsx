import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../contexts/ThemeContext';

/**
 *
 */
export default function RootLayout() {
    return (
        <ThemeProvider>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    headerShown: false, // We'll build our own Loecsen style header
                    contentStyle: { backgroundColor: 'transparent' }, // Let theme handle background
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="admin/index" />
                <Stack.Screen name="feedback" />
            </Stack>
        </ThemeProvider>
    );
}
