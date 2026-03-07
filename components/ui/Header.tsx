import React, { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
/**
 * Header.tsx — The top navigation bar of the app.
 *
 * Displays the "Stoney Language" brand on the left
 * and an "Admin" button on the right that links to the admin dashboard.
 *
 * To customize:
 * - Change the brand name in the <Text> elements below
 * - Change colors in the `styles` object at the bottom
 * - The teal color #ea580c is the app's primary brand color
 */

import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';

export default function Header() {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { width } = useWindowDimensions();
    const isMobile = width < 400;

    return (
        <View style={[styles.header, isMobile && { paddingHorizontal: 12 }]}>
            {/* Logo — links back to the home screen */}
            <Link href="/" asChild>
                <Pressable style={styles.logoArea}>
                    <Text style={[styles.logoText, isMobile && { fontSize: 18 }]}>Stoney</Text>
                    {!isMobile && <Text style={styles.logoSub}>Language</Text>}
                </Pressable>
            </Link>

            {/* Right-side buttons */}
            <View style={[styles.rightButtons, isMobile && { gap: 4 }]}>
                {/* Theme Toggle Button */}
                <Pressable
                    onPress={toggleTheme}
                    style={({ pressed }) => [
                        styles.themeBtn,
                        isMobile && { paddingHorizontal: 8, paddingVertical: 6 },
                        pressed && { opacity: 0.8 },
                    ]}
                >
                    <Text style={[styles.themeText, isMobile && { fontSize: 13 }]}>
                        {isDarkMode ? '☀️ Light' : '🌙 Dark'}
                    </Text>
                </Pressable>

                {/* Feedback button — links to the feedback form */}
                <Link href="/feedback" asChild>
                    <Pressable
                        style={({ pressed }) => [
                            styles.feedbackBtn,
                            isMobile && { paddingHorizontal: 8, paddingVertical: 6 },
                            pressed && styles.adminPressed,
                        ]}
                    >
                        <Text style={[styles.feedbackText, isMobile && { fontSize: 12 }]}>
                            {isMobile ? '💬' : '💬 Feedback'}
                        </Text>
                    </Pressable>
                </Link>

                {/* Admin button — links to the admin dashboard at /admin */}
                <Link href="/admin" asChild>
                    <Pressable
                        style={({ pressed }) => [
                            styles.adminBtn,
                            isMobile && { paddingHorizontal: 10, paddingVertical: 6 },
                            pressed && styles.adminPressed,
                        ]}
                    >
                        <Text style={[styles.adminText, isMobile && { fontSize: 12 }]}>Admin</Text>
                    </Pressable>
                </Link>
            </View>
        </View>
    );
}

/* ──────────────────────────────────────────────
 * STYLES
 * All visual styling is defined here.
 * Change colors, sizes, and spacing below.
 * ────────────────────────────────────────────── */
const createStyles = (colors: any) =>
    StyleSheet.create({
        // The header bar container
        header: {
            height: 60,
            backgroundColor: colors.surface, // White background
            flexDirection: 'row', // Items laid out left-to-right
            justifyContent: 'space-between', // Push logo left, admin right
            alignItems: 'center', // Vertically center items
            paddingHorizontal: 24, // Left/right padding
            borderBottomWidth: 1, // Thin bottom border
            borderBottomColor: colors.border, // Light gray border color
        },

        // Logo area — holds the brand name
        logoArea: {
            flexDirection: 'row',
            alignItems: 'baseline', // Align text baselines
            gap: 6, // Space between "Stoney" and "Language"
        },
        logoText: {
            fontSize: 22,
            fontWeight: '700', // Bold
            color: colors.primary, // Teal — the app's primary color
            letterSpacing: -0.5,
        },
        logoSub: {
            fontSize: 14,
            fontWeight: '400',
            color: colors.textMuted, // Muted gray
        },

        // Group right-side buttons together
        rightButtons: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },

        // Theme toggle button
        themeBtn: {
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: colors.surfaceAlt,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
        },
        themeText: {
            fontSize: 13,
            color: colors.textSecondary,
            fontWeight: '600',
        },

        // Feedback button
        feedbackBtn: {
            paddingVertical: 8,
            paddingHorizontal: 14,
            backgroundColor: colors.primaryBg, // Light teal background
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.primaryBorder,
        },
        feedbackText: {
            fontSize: 13,
            color: colors.primary,
            fontWeight: '600',
        },

        // Admin button
        adminBtn: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: colors.surfaceAlt, // Light gray background
            borderRadius: 8,
        },
        adminPressed: {
            backgroundColor: colors.border, // Slightly darker when pressed
        },
        adminText: {
            fontSize: 14,
            color: colors.textSubtle, // Dark gray text
            fontWeight: '600',
        },
    });
