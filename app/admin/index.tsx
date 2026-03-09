import { useTheme, AppBackground } from '../../contexts/ThemeContext';
/**
 * admin/index.tsx — Admin Dashboard with Vocabulary Upload + Feedback Viewer + Manage Vocabulary.
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
    FlatList,
    Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
    getCategories,
    getFeedback,
    addVocabulary,
    getVocabulary,
    deleteVocabulary,
    Category,
    FeedbackItem,
    PhraseItem,
} from '../../services/api';

type AdminTab = 'add' | 'manage' | 'feedback';

export default function AdminDashboard() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [activeTab, setActiveTab] = useState<AdminTab>('add');

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
    // Manage Vocabulary State
    // --------------------------------------------------
    const [vocabItems, setVocabItems] = useState<PhraseItem[]>([]);
    const [vocabLoading, setVocabLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // --------------------------------------------------
    // Feedback Viewer State
    // --------------------------------------------------
    const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
    const [feedbackLoading, setFeedbackLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
        fetchFeedback();
    }, []);

    useEffect(() => {
        if (activeTab === 'manage' && vocabItems.length === 0) {
            fetchVocab();
        }
    }, [activeTab]);

    const fetchCategories = async () => {
        const data = await getCategories();
        setCategories(data);
    };

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

    const fetchVocab = async () => {
        setVocabLoading(true);
        try {
            const data = await getVocabulary();
            setVocabItems(data);
        } catch (err) {
            console.error('Error fetching vocab:', err);
        } finally {
            setVocabLoading(false);
        }
    };

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
            if (activeTab === 'manage') fetchVocab();
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Upload failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVocab = async (id: string, word: string) => {
        if (confirm(`Are you sure you want to delete '${word}'?`)) {
            try {
                await deleteVocabulary(id);
                setVocabItems(prev => prev.filter(item => item.id !== id));
            } catch (err) {
                console.error(err);
                alert('Failed to delete word.');
            }
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

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

    const filteredVocab = useMemo(() => {
        if (!searchQuery.trim()) return vocabItems.slice(0, 300); // Limit initial view to 300 for perf
        const q = searchQuery.toLowerCase();
        return vocabItems.filter(
            (item) =>
                item.stoney.toLowerCase().includes(q) || item.english.toLowerCase().includes(q)
        ).slice(0, 300);
    }, [vocabItems, searchQuery]);

    // --------------------------------------------------
    // Renders
    // --------------------------------------------------

    const renderAddVocab = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>📝 Add New Vocabulary</Text>

                <Text style={styles.label}>Stoney Phrase</Text>
                <TextInput style={styles.input} placeholder="e.g., achâksîch" value={nativeWord} onChangeText={setNativeWord} />

                <Text style={styles.label}>English Translation</Text>
                <TextInput style={styles.input} placeholder="e.g., to step over" value={translation} onChangeText={setTranslation} />

                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                    <Pressable style={[styles.catPill, !selectedCategory && styles.catPillActive]} onPress={() => setSelectedCategory('')}>
                        <Text style={[styles.catPillText, !selectedCategory && styles.catPillTextActive]}>None</Text>
                    </Pressable>
                    {categories.map((cat) => (
                        <Pressable key={cat.id} style={[styles.catPill, selectedCategory === cat.id && styles.catPillActive]} onPress={() => setSelectedCategory(cat.id)}>
                            <Text style={[styles.catPillText, selectedCategory === cat.id && styles.catPillTextActive]}>{cat.name}</Text>
                        </Pressable>
                    ))}
                </ScrollView>

                <Text style={styles.label}>Audio File (Optional)</Text>
                <View style={styles.row}>
                    <Pressable style={styles.secondaryButton} onPress={pickAudio}>
                        <Text style={styles.secondaryButtonText}>Select Audio</Text>
                    </Pressable>
                    <Text style={styles.fileName}>
                        {audioFile && !audioFile.canceled ? audioFile.assets[0].name : 'No file selected'}
                    </Text>
                </View>

                <Pressable style={[styles.primaryButton, loading && styles.disabledButton]} onPress={handleUpload} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Upload & Save</Text>}
                </Pressable>
            </View>
        </ScrollView>
    );

    const renderManageVocab = () => (
        <View style={styles.fullCard}>
            <View style={styles.feedbackHeader}>
                <Text style={styles.cardTitle}>📖 Manage Vocabulary ({vocabItems.length})</Text>
                <Pressable style={styles.refreshBtn} onPress={fetchVocab}>
                    <Text style={styles.refreshText}>🔄 Refresh</Text>
                </Pressable>
            </View>
            <TextInput
                style={[styles.input, { marginBottom: 16 }]}
                placeholder="Search Stoney or English..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#a8a29e"
            />
            {vocabLoading ? (
                <ActivityIndicator size="small" color="#ea580c" style={{ marginTop: 20 }} />
            ) : (
                <View style={{ flex: 1 }}>
                    {searchQuery.trim() === '' && <Text style={styles.limitText}>Showing recent 300 entries. Search to find others.</Text>}
                    <FlatList
                        data={filteredVocab}
                        keyExtractor={(item) => item.id}
                        initialNumToRender={20}
                        maxToRenderPerBatch={20}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        renderItem={({ item }) => (
                            <View style={styles.vocabRow}>
                                <View style={{ flex: 1, marginRight: 12 }}>
                                    <Text style={styles.vocabStoney}>{item.stoney}</Text>
                                    <Text style={styles.vocabEnglish}>{item.english}</Text>
                                </View>
                                <Pressable style={styles.deleteBtn} onPress={() => handleDeleteVocab(item.id, item.stoney)}>
                                    <Text style={styles.deleteBtnText}>Delete</Text>
                                </Pressable>
                            </View>
                        )}
                    />
                </View>
            )}
        </View>
    );

    const renderFeedback = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
                                <View style={styles.feedbackTopRow}>
                                    <View style={[styles.feedbackCatPill, { backgroundColor: catColor.bg, borderColor: catColor.border }]}>
                                        <Text style={[styles.feedbackCatText, { color: catColor.text }]}>{item.category}</Text>
                                    </View>
                                    <Text style={styles.feedbackDate}>{formatDate(item.created_at)}</Text>
                                </View>
                                <Text style={styles.feedbackName}>From: {item.user_name}</Text>
                                <Text style={styles.feedbackMessage}>{item.message}</Text>
                            </View>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );

    return (
        <AppBackground style={{ flex: 1 }}>
            <View style={styles.tabContainer}>
                <Pressable onPress={() => setActiveTab('add')} style={[styles.tab, activeTab === 'add' && styles.tabActive]}>
                    <Text style={[styles.tabText, activeTab === 'add' && styles.tabTextActive]}>Add Word</Text>
                </Pressable>
                <Pressable onPress={() => setActiveTab('manage')} style={[styles.tab, activeTab === 'manage' && styles.tabActive]}>
                    <Text style={[styles.tabText, activeTab === 'manage' && styles.tabTextActive]}>Manage Words</Text>
                </Pressable>
                <Pressable onPress={() => setActiveTab('feedback')} style={[styles.tab, activeTab === 'feedback' && styles.tabActive]}>
                    <Text style={[styles.tabText, activeTab === 'feedback' && styles.tabTextActive]}>Feedback</Text>
                </Pressable>
            </View>
            <View style={{ flex: 1 }}>
                {activeTab === 'add' && renderAddVocab()}
                {activeTab === 'manage' && renderManageVocab()}
                {activeTab === 'feedback' && renderFeedback()}
            </View>
        </AppBackground>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    scrollContent: { padding: 20, alignItems: 'center', paddingBottom: 40 },
    tabContainer: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
    tabActive: { borderColor: colors.primary },
    tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
    tabTextActive: { color: colors.primary },
    card: { width: '100%', maxWidth: 700, backgroundColor: colors.surface, borderRadius: 12, padding: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: colors.border },
    fullCard: { flex: 1, margin: 20, backgroundColor: colors.surface, borderRadius: 12, padding: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: colors.border, maxWidth: 900, alignSelf: 'center', width: '90%' },
    cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: colors.textDark },
    label: { fontSize: 14, fontWeight: '600', color: colors.textSubtle, marginBottom: 8, marginTop: 16 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: colors.background, color: colors.text },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    fileName: { fontSize: 14, color: colors.textMutedDark, flex: 1 },
    secondaryButton: { backgroundColor: colors.border, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
    secondaryButtonText: { color: colors.textDark, fontWeight: '600' },
    primaryButton: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 32 },
    disabledButton: { opacity: 0.7 },
    primaryButtonText: { color: colors.surface, fontSize: 16, fontWeight: 'bold' },
    feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    refreshBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: colors.surfaceAlt },
    refreshText: { fontSize: 13, color: colors.textSubtle, fontWeight: '500' },
    emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 14, marginTop: 20 },
    limitText: { fontSize: 13, color: colors.textMuted, marginBottom: 12, fontStyle: 'italic' },
    feedbackCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 16, marginBottom: 12, backgroundColor: colors.background },
    feedbackTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    feedbackCatPill: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1 },
    feedbackCatText: { fontSize: 11, fontWeight: '700' },
    feedbackDate: { fontSize: 12, color: colors.textMuted, flex: 1 },
    feedbackName: { fontSize: 13, fontWeight: '600', color: colors.textSubtle, marginBottom: 4 },
    feedbackMessage: { fontSize: 14, color: colors.textDark, lineHeight: 20 },
    catPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
    catPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catPillText: { fontSize: 13, fontWeight: '500', color: colors.textSubtle },
    catPillTextActive: { color: colors.surface },
    vocabRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.surfaceAlt },
    vocabStoney: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, marginBottom: 4 },
    vocabEnglish: { fontSize: 14, color: colors.textMutedDark },
    deleteBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fef2f2', borderRadius: 8, borderWidth: 1, borderColor: '#fecaca' },
    deleteBtnText: { fontSize: 13, color: '#dc2626', fontWeight: 'bold' },
});
