import React, { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
/**
 * LessonHeader.tsx — Teal banner shown above the learning content.
 *
 * Inspired by Loecsen's header section that shows:
 * - The lesson title (e.g., "Essentials", "Greetings")
 * - A friendly tip/instruction for the learner
 * - A progress indicator showing how many words have been studied
 *
 * Props:
 * - lessonTitle:  Name of the current lesson/category
 * - tip:          A helpful instruction message
 * - current:      Number of words studied so far
 * - total:        Total words in this lesson
 */

import { View, Text, StyleSheet } from 'react-native';

interface LessonHeaderProps {
    lessonTitle?: string;
    tip?: string;
    current?: number;
    total?: number;
}

export default function LessonHeader({
    lessonTitle = 'Vocabulary',
    tip = 'Listen to the words one by one. When you feel ready, switch to Quiz mode to practise.',
    current = 0,
    total = 0,
}: LessonHeaderProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            {/* Lesson title */}
            <Text style={styles.subtitle}>LEARN STONEY NAKODA</Text>
            <Text style={styles.title}>{lessonTitle}</Text>

            {/* Tip message */}
            <Text style={styles.tip}>{tip}</Text>

            {/* Segmented progress bar (like Loecsen) */}
            {total > 0 && (
                <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                        {Array.from({ length: Math.min(total, 20) }).map((_, i) => {
                            const filled = i < Math.round((current / total) * Math.min(total, 20));
                            return (
                                <View
                                    key={i}
                                    style={[styles.segment, filled && styles.segmentFilled]}
                                />
                            );
                        })}
                    </View>
                    <Text style={styles.progressLabel}>
                        {current}/{total}
                    </Text>
                </View>
            )}
        </View>
    );
}

/* ──────────────────────────────────────────────
 * STYLES
 * ────────────────────────────────────────────── */
const createStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            backgroundColor: colors.primary, // Teal — matches Loecsen's header
            paddingVertical: 20,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginBottom: 12,
        },
        subtitle: {
            fontSize: 11,
            fontWeight: '700',
            color: colors.white60, // Semi-transparent white
            letterSpacing: 2,
            marginBottom: 4,
        },
        title: {
            fontSize: 22,
            fontWeight: '700',
            color: colors.surface,
            marginBottom: 8,
        },
        tip: {
            fontSize: 14,
            color: colors.white85,
            lineHeight: 20,
            marginBottom: 16,
        },

        // Segmented progress bar
        progressRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },
        progressTrack: {
            flex: 1,
            flexDirection: 'row',
            gap: 3,
            height: 8,
        },
        segment: {
            flex: 1,
            backgroundColor: colors.white20, // Empty segment
            borderRadius: 4,
        },
        segmentFilled: {
            backgroundColor: colors.primaryLight, // Filled segment — light teal
        },
        progressLabel: {
            color: colors.white70,
            fontSize: 12,
            fontWeight: '600',
            minWidth: 36,
        },
    });
