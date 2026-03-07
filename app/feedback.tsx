import { useTheme, AppBackground } from '../contexts/ThemeContext';
/**
 * feedback.tsx — User feedback form page.
 *
 * Accessible from the main app via a "Feedback" button in the header.
 * Users can submit feedback with:
 * - Their name (optional)
 * - A category (Bug, Feature Request, Content, Other)
 * - A message
 *
 * Feedback is saved to the `feedback` table in Supabase.
 *
 * Route: /feedback
 */

import { useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../lib/supabase';

// Feedback categories — users pick one when submitting
const CATEGORIES = ['Bug Report', 'Feature Request', 'Content Suggestion', 'Other'];

export default function FeedbackPage() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    // Form fields
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Other');
    const [message, setMessage] = useState('');

    // UI state
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    // Handle feedback submission
    const handleSubmit = async () => {
        // Validate — message is required
        if (!message.trim()) {
            setError('Please enter your feedback message.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error: insertError } = await supabase.from('feedback').insert([
                {
                    user_name: name.trim() || 'Anonymous',
                    category,
                    message: message.trim(),
                },
            ]);

            if (insertError) throw insertError;

            // Success — show thank you message
            setSubmitted(true);
        } catch (err: any) {
            console.error('Error submitting feedback:', err);
            setError(err.message || 'Failed to submit feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ──────────────────────────────────────────────
    // SUCCESS STATE — shown after submitting
    // ──────────────────────────────────────────────
    if (submitted) {
        return (
            <AppBackground style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.successIcon}>✅</Text>
                    <Text style={styles.successTitle}>Thank You!</Text>
                    <Text style={styles.successText}>
                        Your feedback has been submitted successfully.{'\n'}
                        We appreciate your input!
                    </Text>
                    <Link href="/" asChild>
                        <Pressable style={styles.backBtn}>
                            <Text style={styles.backBtnText}>← Back to Learning</Text>
                        </Pressable>
                    </Link>
                </View>
            </AppBackground>
        );
    }

    // ──────────────────────────────────────────────
    // FEEDBACK FORM
    // ──────────────────────────────────────────────
    return (
        <AppBackground style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Back link */}
                <Link href="/" asChild>
                    <Pressable style={styles.backLink}>
                        <Text style={styles.backLinkText}>← Back to App</Text>
                    </Pressable>
                </Link>

                <View style={styles.card}>
                    <Text style={styles.formTitle}>Send Feedback</Text>
                    <Text style={styles.formSubtitle}>Help us improve the Stoney Language app</Text>

                    {/* Error message */}
                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Name field (optional) */}
                    <Text style={styles.label}>Your Name (optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Anonymous"
                        placeholderTextColor="#a8a29e"
                        value={name}
                        onChangeText={setName}
                    />

                    {/* Category picker */}
                    <Text style={styles.label}>Category</Text>
                    <View style={styles.categoryRow}>
                        {CATEGORIES.map((cat) => (
                            <Pressable
                                key={cat}
                                style={[
                                    styles.categoryBtn,
                                    category === cat && styles.categoryBtnActive,
                                ]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text
                                    style={[
                                        styles.categoryText,
                                        category === cat && styles.categoryTextActive,
                                    ]}
                                >
                                    {cat}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Message field */}
                    <Text style={styles.label}>Your Feedback *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Tell us what you think, report a bug, or suggest a feature..."
                        placeholderTextColor="#a8a29e"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                    />

                    {/* Submit button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.submitBtn,
                            pressed && styles.submitBtnPressed,
                            loading && styles.submitBtnDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>Submit Feedback</Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </AppBackground>
    );
}

/* ──────────────────────────────────────────────
 * STYLES
 * ────────────────────────────────────────────── */
const createStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            flexGrow: 1,
            backgroundColor: colors.background,
            padding: 24,
            alignItems: 'center',
        },

        // Back link
        backLink: {
            alignSelf: 'flex-start',
            marginBottom: 16,
            maxWidth: 560,
        },
        backLinkText: {
            fontSize: 14,
            color: colors.primary,
            fontWeight: '600',
        },

        // Form card
        card: {
            width: '100%',
            maxWidth: 560,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 32,
            borderWidth: 1,
            borderColor: colors.border,
        },
        formTitle: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
        },
        formSubtitle: {
            fontSize: 14,
            color: colors.textMuted,
            marginBottom: 24,
        },

        // Labels and inputs
        label: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.textSubtle,
            marginBottom: 6,
            marginTop: 16,
        },
        input: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 12,
            fontSize: 15,
            backgroundColor: colors.background,
            color: colors.text,
        },
        textArea: {
            minHeight: 120,
            paddingTop: 12,
        },

        // Category picker
        categoryRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        categoryBtn: {
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
        },
        categoryBtnActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        categoryText: {
            fontSize: 13,
            fontWeight: '500',
            color: colors.textSubtle,
        },
        categoryTextActive: {
            color: colors.surface,
            fontWeight: '600',
        },

        // Submit button
        submitBtn: {
            marginTop: 28,
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: 'center',
        },
        submitBtnPressed: { opacity: 0.9 },
        submitBtnDisabled: { opacity: 0.7 },
        submitBtnText: {
            color: colors.surface,
            fontSize: 16,
            fontWeight: '700',
        },

        // Error message
        errorBox: {
            backgroundColor: '#fef2f2',
            borderWidth: 1,
            borderColor: '#fecaca',
            borderRadius: 8,
            padding: 10,
            marginBottom: 8,
        },
        errorText: {
            color: '#dc2626',
            fontSize: 13,
            fontWeight: '500',
        },

        // Success state
        successIcon: {
            fontSize: 48,
            textAlign: 'center',
            marginBottom: 12,
        },
        successTitle: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 8,
        },
        successText: {
            fontSize: 15,
            color: colors.textMutedDark,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 24,
        },
        backBtn: {
            backgroundColor: colors.primary,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 10,
            alignSelf: 'center',
        },
        backBtnText: {
            color: colors.surface,
            fontSize: 15,
            fontWeight: '600',
        },
    });
