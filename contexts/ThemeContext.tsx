import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, View, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// Enhanced Modern Palettes (Inspired by Tailwind Zinc + Orange / Shadcn UI)
export const lightColors = {
    surface: '#ffffff', // White card
    background: '#fafafa', // zinc-50 (Clean, modern app background)
    backgroundGradient: ['#f97316', '#ec4899'], // Orange to Pink

    surfaceAlt: '#f4f4f5', // zinc-100 (Hover/Alt state)
    border: '#e4e4e7', // zinc-200 (Subtle borders)
    borderDark: '#d4d4d8', // zinc-300 (Stronger borders)

    textMuted: '#a1a1aa', // zinc-400 (Weak text)
    textMutedDark: '#71717a', // zinc-500 (Medium text)
    textSubtle: '#52525b', // zinc-600 (Strong secondary)
    textSecondary: '#3f3f46', // zinc-700
    textDark: '#27272a', // zinc-800
    text: '#09090b', // zinc-950 (Crisp main text)

    primary: '#f97316', // orange-500 (Vibrant modern orange)
    primaryBg: '#ffedd5', // orange-100 (Soft background)
    primaryBorder: '#fdba74', // orange-300
    primaryLight: '#fb923c', // orange-400

    success: '#10b981', // emerald-500
    warning: '#f59e0b', // amber-500
    successBg: '#d1fae5', // emerald-100
    successBorder: '#6ee7b7', // emerald-300
    successTextDark: '#064e3b', // emerald-900
    successText: '#047857', // emerald-700

    overlay: 'rgba(9, 9, 11, 0.5)', // zinc-950 with 50% opacity
    white60: 'rgba(255,255,255,0.6)',
    white70: 'rgba(255,255,255,0.7)',
    white85: 'rgba(255,255,255,0.85)',
    white20: 'rgba(255,255,255,0.2)',
};

export const darkColors = {
    surface: '#18181b', // zinc-900 (Card background)
    background: '#09090b', // zinc-950 (Deep dark app background)
    backgroundGradient: ['#000000', '#27272a', '#ec4899', '#f97316'], // Black to Grey to Pink to Orange

    surfaceAlt: '#27272a', // zinc-800 (Hover/Alt state)
    border: '#3f3f46', // zinc-700
    borderDark: '#52525b', // zinc-600

    textMuted: '#52525b', // zinc-600
    textMutedDark: '#71717a', // zinc-500
    textSubtle: '#a1a1aa', // zinc-400
    textSecondary: '#d4d4d8', // zinc-300
    textDark: '#f4f4f5', // zinc-100
    text: '#fafafa', // zinc-50 (Crisp light text)

    primary: '#ea580c', // orange-600 (Rich vibrant orange for dark mode)
    primaryBg: '#431407', // orange-950
    primaryBorder: '#9a3412', // orange-800
    primaryLight: '#f97316', // orange-500

    success: '#34d399', // emerald-400
    warning: '#fbbf24', // amber-400
    successBg: '#022c22', // emerald-950
    successBorder: '#064e3b', // emerald-900
    successTextDark: '#a7f3d0', // emerald-200
    successText: '#6ee7b7', // emerald-300

    overlay: 'rgba(0, 0, 0, 0.8)',
    white60: 'rgba(255,255,255,0.4)', // Dimmer for dark mode
    white70: 'rgba(255,255,255,0.5)',
    white85: 'rgba(255,255,255,0.7)',
    white20: 'rgba(255,255,255,0.1)',
};

export type ThemeColors = typeof lightColors;

type ThemeContextType = {
    isDarkMode: boolean;
    colors: ThemeColors;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        // Load saved theme preference
        AsyncStorage.getItem('app-theme').then((savedTheme) => {
            if (savedTheme) {
                setIsDarkMode(savedTheme === 'dark');
            } else {
                setIsDarkMode(systemColorScheme === 'dark');
            }
            setHasLoaded(true);
        });
    }, [systemColorScheme]);

    const toggleTheme = () => {
        setIsDarkMode((prev) => {
            const next = !prev;
            AsyncStorage.setItem('app-theme', next ? 'dark' : 'light');
            return next;
        });
    };

    // Apply background color directly to document body on Web to prevent white overshoot
    useEffect(() => {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            document.body.style.backgroundColor = isDarkMode
                ? darkColors.background
                : lightColors.background;
        }
    }, [isDarkMode]);

    if (!hasLoaded) return null; // Prevent flash of wrong theme

    const colors = isDarkMode ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDarkMode, colors, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export function AppBackground({ children, style }: { children: React.ReactNode; style?: any }) {
    const { colors } = useTheme();
    // Default to the solid background if gradient is unavailable (fallback)
    const gradientColors = (colors.backgroundGradient || [
        colors.background,
        colors.background,
    ]) as unknown as readonly [string, string, ...string[]];

    return (
        <LinearGradient
            colors={gradientColors}
            style={[{ flex: 1 }, style]}
            // Create a nice diagonal fade for the gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {children}
        </LinearGradient>
    );
}
