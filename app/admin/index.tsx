import { useTheme, AppBackground } from '../../contexts/ThemeContext';
/**
 * admin/index.tsx — Admin Dashboard with Vocabulary Upload + Feedback Viewer.
 *
 * This page is protected by the login gate in admin/_layout.tsx.
 * It has two sections:
 *   1. Add New Vocabulary — upload Stoney words with audio
 *   2. User Feedback — view and manage submitted feedback
 *
 * To access: click Admin in the header, then login with admin/admin.
 */

import { useMemo, useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
    getCategories,
    getFeedback,
    addVocabulary,
    Category,
    FeedbackItem,
} from '../../services/api';

export default function AdminDashboard() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    // --------------------------------------------------
    // Vocabulary Upload State
    // --------------------------------------------------
    const [nativeWord, setNativeWord] = useState('');
    const [translation, setTranslation] = useState('');
    const [audioFile, setAudioFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // --------------------------------------------------
    // Feedback Viewer State
    // --------------------------------------------------
    const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
    const [feedbackLoading, setFeedbackLoading] = useState(true);

    // --------------------------------------------------
    // Data Fetching
    // --------------------------------------------------
    useEffect(() => {
        fetchCategories();
        fetchFeedback();
    }, []);

    const fetchCategories = async () => {
        const data = await getCategories();
        setCategories(data);
    };

    /** Fetch all user feedback from the database */
    const fetchFeedback = async () => {
        setFeedbackLoading(true);
        try {
            const data = await getFeedback();
            setFeedbackItems(data);
        } catch (err) {
            console.error('Error fetching feedback:', err);
        } finally {
            setFeedbackLoading(false);
        }
    };

    // Note: Feedback is read-only. Admins can view but not edit/delete.

    // --------------------------------------------------
    // Audio File Picker
    // --------------------------------------------------
    /**
     * @function pickAudio
     * @description Opens the device's native file picker so the admin can select an audio file
     * (.mp3, .wav, etc) to accompany the new Stoney phrase.
     */
    const pickAudio = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true,
            });
            if (!result.canceled) {
                setAudioFile(result);
            }
        } catch (err) {
            console.log('Error picking document', err);
        }
    };

    // --------------------------------------------------
    // Vocabulary Upload
    // --------------------------------------------------
    /**
     * @function handleUpload
     * @description Validates the form inputs, then calls the `addVocabulary` service API
     * to insert the new phrase into Supabase and upload the audio to Supabase Storage.
     */
    const handleUpload = async () => {
        if (!nativeWord || !translation) {
            alert('Please enter both the Stoney word and translation.');
            return;
        }

        setLoading(true);
        try {
            await addVocabulary(nativeWord, translation, selectedCategory || null, audioFile);

            alert('New vocabulary added!');
            setNativeWord('');
            setTranslation('');
            setAudioFile(null);
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Upload failed.');
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------------------
    // Helper: format date string for display
    // --------------------------------------------------
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // --------------------------------------------------
    // Category color mapping for feedback pills
    // --------------------------------------------------
    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Bug Report':
                return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
            case 'Feature Request':
                return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
            case 'Content Suggestion':
                return { bg: colors.successBg, text: '#16a34a', border: colors.successBorder };
            default:
                return { bg: colors.background, text: colors.textSubtle, border: colors.border };
        }
    };

    // --------------------------------------------------
    // Render
    // --------------------------------------------------
    return (
        <AppBackground style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* ── Section 1: Add New Vocabulary ── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📝 Add New Vocabulary</Text>

                    <Text style={styles.label}>Stoney Phrase</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., achâksîch"
                        value={nativeWord}
                        onChangeText={setNativeWord}
                    />

                    <Text style={styles.label}>English Translation</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., to step over"
                        value={translation}
                        onChangeText={setTranslation}
                    />

                    {/* Category selector — scrollable pills */}
                    <Text style={styles.label}>Category</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 12 }}
                        contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
                    >
                        <Pressable
                            style={[styles.catPill, !selectedCategory && styles.catPillActive]}
                            onPress={() => setSelectedCategory('')}
                        >
                            <Text
                                style={[
                                    styles.catPillText,
                                    !selectedCategory && styles.catPillTextActive,
                                ]}
                            >
                                None
                            </Text>
                        </Pressable>
                        {categories.map((cat) => (
                            <Pressable
                                key={cat.id}
                                style={[
                                    styles.catPill,
                                    selectedCategory === cat.id && styles.catPillActive,
                                ]}
                                onPress={() => setSelectedCategory(cat.id)}
                            >
                                <Text
                                    style={[
                                        styles.catPillText,
                                        selectedCategory === cat.id && styles.catPillTextActive,
                                    ]}
                                >
                                    {cat.name}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    <Text style={styles.label}>Audio File (Optional)</Text>
                    <View style={styles.row}>
                        <Pressable style={styles.secondaryButton} onPress={pickAudio}>
                            <Text style={styles.secondaryButtonText}>Select Audio</Text>
                        </Pressable>
                        <Text style={styles.fileName}>
                            {audioFile && !audioFile.canceled
                                ? audioFile.assets[0].name
                                : 'No file selected'}
                        </Text>
                    </View>

                    <Pressable
                        style={[styles.primaryButton, loading && styles.disabledButton]}
                        onPress={handleUpload}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Upload & Save</Text>
                        )}
                    </Pressable>
                </View>

                {/* ── Section 2: User Feedback ── */}
                <View style={styles.card}>
                    <View style={styles.feedbackHeader}>
                        <Text style={styles.cardTitle}>💬 User Feedback</Text>
                        <Pressable style={styles.refreshBtn} onPress={fetchFeedback}>
                            <Text style={styles.refreshText}>🔄 Refresh</Text>
                        </Pressable>
                    </View>

                    {feedbackLoading ? (
                        <ActivityIndicator size="small" color="#ea580c" style={{ marginTop: 20 }} />
                    ) : feedbackItems.length === 0 ? (
                        <Text style={styles.emptyText}>No feedback submitted yet.</Text>
                    ) : (
                        feedbackItems.map((item) => {
                            const catColor = getCategoryColor(item.category);
                            return (
                                <View key={item.id} style={styles.feedbackCard}>
                                    {/* Top row: category + date */}
                                    <View style={styles.feedbackTopRow}>
                                        <View
                                            style={[
                                                styles.feedbackCatPill,
                                                {
                                                    backgroundColor: catColor.bg,
                                                    borderColor: catColor.border,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.feedbackCatText,
                                                    { color: catColor.text },
                                                ]}
                                            >
                                                {item.category}
                                            </Text>
                                        </View>
                                        <Text style={styles.feedbackDate}>
                                            {formatDate(item.created_at)}
                                        </Text>
                                    </View>

                                    {/* User name */}
                                    <Text style={styles.feedbackName}>From: {item.user_name}</Text>

                                    {/* Message */}
                                    <Text style={styles.feedbackMessage}>{item.message}</Text>
                                </View>
                            );
                        })
                    )}
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
            padding: 20,
            alignItems: 'center',
            gap: 24, // Space between cards
            paddingBottom: 40,
        },
        card: {
            width: '100%',
            maxWidth: 700,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 3,
        },
        cardTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 16,
            color: '#1f2937',
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: '#4b5563',
            marginBottom: 8,
            marginTop: 16,
        },
        input: {
            borderWidth: 1,
            borderColor: '#d1d5db',
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            backgroundColor: '#f9fafb',
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        fileName: {
            fontSize: 14,
            color: '#6b7280',
            flex: 1,
        },
        secondaryButton: {
            backgroundColor: colors.border,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
        },
        secondaryButtonText: {
            color: '#374151',
            fontWeight: '600',
        },
        primaryButton: {
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 32,
        },
        disabledButton: {
            opacity: 0.7,
        },
        primaryButtonText: {
            color: colors.surface,
            fontSize: 16,
            fontWeight: 'bold',
        },

        // ── Feedback Section ──
        feedbackHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
        },
        refreshBtn: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 6,
            backgroundColor: colors.surfaceAlt,
        },
        refreshText: {
            fontSize: 13,
            color: colors.textSubtle,
            fontWeight: '500',
        },
        emptyText: {
            textAlign: 'center',
            color: colors.textMuted,
            fontSize: 14,
            marginTop: 20,
            marginBottom: 8,
        },

        // Individual feedback card
        feedbackCard: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 16,
            marginBottom: 12,
            backgroundColor: '#fafafa',
        },
        feedbackTopRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
        },
        feedbackCatPill: {
            paddingVertical: 3,
            paddingHorizontal: 10,
            borderRadius: 12,
            borderWidth: 1,
        },
        feedbackCatText: {
            fontSize: 11,
            fontWeight: '700',
        },
        feedbackDate: {
            fontSize: 12,
            color: colors.textMuted,
            flex: 1,
        },
        feedbackName: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.textSubtle,
            marginBottom: 4,
        },
        feedbackMessage: {
            fontSize: 14,
            color: '#1f2937',
            lineHeight: 20,
        },
        deleteBtn: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: '#fef2f2',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#fecaca',
        },
        deleteText: {
            color: '#dc2626',
            fontSize: 14,
            fontWeight: '700',
        },

        // Category pill styles for vocabulary upload form
        catPill: {
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 20,
            backgroundColor: colors.surfaceAlt,
            borderWidth: 1,
            borderColor: colors.border,
        },
        catPillActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        catPillText: {
            fontSize: 13,
            fontWeight: '500',
            color: colors.textSubtle,
        },
        catPillTextActive: {
            color: colors.surface,
        },
    });
