import React, { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
/**
 * ActionButtons.tsx — Listen button shown below the learning card.
 *
 * The "Listen" button (teal) plays the audio pronunciation.
 *
 * Props:
 * - onPlayPress: Called when the Listen button is tapped
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';

interface ActionButtonsProps {
    onPlayPress?: () => void;
}

export default function ActionButtons({ onPlayPress }: ActionButtonsProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <View style={styles.container}>
            {/* Listen button — plays audio pronunciation */}
            <Pressable
                style={({ pressed }) => [styles.btn, styles.listenBtn, pressed && styles.btnPressed]}
                onPress={onPlayPress}
            >
                <Text style={styles.btnIcon}>▶</Text>
                <Text style={styles.btnLabel}>Listen</Text>
            </Pressable>
        </View>
    );
}

/* ──────────────────────────────────────────────
 * STYLES
 * ────────────────────────────────────────────── */
const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        minWidth: 140,
        justifyContent: 'center',
    },
    btnPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.97 }],
    },
    listenBtn: {
        backgroundColor: colors.primary,
    },
    btnIcon: {
        fontSize: 16,
    },
    btnLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.surface,
    },
});
