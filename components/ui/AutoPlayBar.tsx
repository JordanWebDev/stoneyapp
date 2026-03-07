import React, { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
/**
 * AutoPlayBar.tsx — Bottom control bar for auto-playing through vocabulary.
 *
 * Inspired by Loecsen's bottom playback controls. Features:
 * - Play/Pause button to cycle through words automatically
 * - Speed control (Normal / Slow)
 * - Current word counter
 *
 * Props:
 * - isPlaying:    Whether auto-play is currently running
 * - onTogglePlay: Callback to start/stop auto-play
 * - speed:        Current speed setting ('normal' | 'slow')
 * - onSpeedChange: Callback to toggle speed
 * - currentIndex: Index of the current word
 * - totalItems:   Total number of vocabulary items
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';

interface AutoPlayBarProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    speed: 'normal' | 'slow';
    onSpeedChange: () => void;
    currentIndex: number;
    totalItems: number;
}

/**
 *
 * @param root0
 * @param root0.isPlaying
 * @param root0.onTogglePlay
 * @param root0.speed
 * @param root0.onSpeedChange
 * @param root0.currentIndex
 * @param root0.totalItems
 */
export default function AutoPlayBar({
    isPlaying,
    onTogglePlay,
    speed,
    onSpeedChange,
    currentIndex,
    totalItems,
}: AutoPlayBarProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <View style={styles.bar}>
            {/* Play / Pause button */}
            <Pressable
                style={({ pressed }) => [styles.playBtn, pressed && styles.btnPressed]}
                onPress={onTogglePlay}
            >
                <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
                <Text style={styles.playLabel}>{isPlaying ? 'Pause' : 'Auto Play'}</Text>
            </Pressable>

            {/* Speed toggle */}
            <Pressable
                style={({ pressed }) => [styles.speedBtn, pressed && styles.btnPressed]}
                onPress={onSpeedChange}
            >
                <Text style={styles.speedIcon}>⏱️</Text>
                <Text style={styles.speedLabel}>{speed === 'normal' ? '1x' : '0.5x'}</Text>
            </Pressable>

            {/* Word counter */}
            <Text style={styles.counter}>
                {currentIndex + 1} / {totalItems}
            </Text>
        </View>
    );
}

/* ──────────────────────────────────────────────
 * STYLES
 * ────────────────────────────────────────────── */
/**
 *
 * @param colors
 */
const createStyles = (colors: any) =>
    StyleSheet.create({
        bar: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.primary,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 10,
            gap: 12,
        },

        // Play/Pause button
        playBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'rgba(255,255,255,0.15)',
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 8,
        },
        playIcon: { fontSize: 14 },
        playLabel: { color: colors.surface, fontSize: 13, fontWeight: '600' },

        // Speed button
        speedBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: 'rgba(255,255,255,0.1)',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
        },
        speedIcon: { fontSize: 13 },
        speedLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },

        btnPressed: { opacity: 0.7 },

        // Counter
        counter: {
            marginLeft: 'auto', // Push to the right
            color: colors.white60,
            fontSize: 13,
            fontWeight: '600',
        },
    });
