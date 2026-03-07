import React, { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
/**
 * LearningCard.tsx — The main content card that displays a vocabulary word.
 *
 * Shows the Stoney word prominently at the top,
 * a divider line, then the English translation below.
 * At the bottom, it includes Listen and Speak action buttons.
 *
 * Props:
 * - nativeWord:  The Stoney word to display
 * - translation: The English meaning
 * - onPlayPress: Callback when the Listen button is pressed (plays audio)
 */

import { View, Text, StyleSheet } from 'react-native';
import ActionButtons from './ActionButtons';

interface LearningCardProps {
    nativeWord: string;
    translation: string;
    onPlayPress?: () => void;
}

export default function LearningCard({ nativeWord, translation, onPlayPress }: LearningCardProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <View style={styles.container}>

            {/* Main content area — centered word display */}
            <View style={styles.content}>

                {/* Stoney word section */}
                <View style={styles.wordSection}>
                    <Text style={styles.label}>Stoney Nakoda</Text>
                    <Text style={styles.nativeWord}>{nativeWord}</Text>
                </View>

                {/* Horizontal divider line */}
                <View style={styles.divider} />

                {/* English translation section */}
                <View style={styles.wordSection}>
                    <Text style={styles.labelEnglish}>English</Text>
                    <Text style={styles.translation}>{translation}</Text>
                </View>

            </View>

            {/* Listen and Speak buttons at the bottom */}
            <ActionButtons onPlayPress={onPlayPress} />

        </View>
    );
}

/* ──────────────────────────────────────────────
 * STYLES
 * ────────────────────────────────────────────── */
const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',  // Push buttons to the bottom
        backgroundColor: colors.surface,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',         // Center the word vertically
        padding: 40,
        gap: 32,                          // Space between word sections
    },
    wordSection: {
        alignItems: 'center',
        gap: 8,
    },

    // "STONEY NAKODA" label above the word
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,                 // Teal accent color
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },

    // The Stoney word itself — large and bold
    nativeWord: {
        fontSize: 36,
        fontWeight: '700',
        color: colors.text,                 // Near-black for emphasis
        textAlign: 'center',
        lineHeight: 44,
    },

    // Thin horizontal line between the two languages
    divider: {
        width: 48,
        height: 2,
        backgroundColor: colors.border,       // Light gray
        borderRadius: 1,
    },

    // "ENGLISH" label
    labelEnglish: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMuted,                 // Muted gray
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },

    // The English translation — smaller than the Stoney word
    translation: {
        fontSize: 22,
        color: colors.textMutedDark,                 // Medium gray
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 30,
    },
});
