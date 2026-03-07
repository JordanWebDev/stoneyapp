import { useTheme, AppBackground } from '../contexts/ThemeContext';
/**
 * index.tsx — The main screen of the Stoney Language Learning App.
 *
 * This is the entry point that loads when users visit the app.
 * It fetches vocabulary data from Supabase and renders 4 different
 * learning modes that users can switch between using tabs:
 *
 * 1. Learn    — Browse vocabulary with sidebar list + detail card + auto-play
 * 2. Quiz     — Multiple choice translation quiz with sound effects
 * 3. Flashcards — Tap-to-reveal study cards with mastery tracking
 * 4. Match    — Memory card matching game with audio feedback
 *
 * Enhanced features (inspired by Loecsen.com):
 * - Lesson categories with teal pill selector
 * - Teal lesson header with segmented progress bar
 * - Auto-play bar with speed control
 * - Sound effects on nav clicks
 * - Animated tab transitions
 * - Studied word tracking with AsyncStorage persistence
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    ActivityIndicator,
    Text,
    Pressable,
    Animated,
    Modal,
    Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCategories, getVocabulary, PhraseItem, Category } from '../services/api';

// Import UI components
import Header from '../components/ui/Header';
import SidebarList from '../components/ui/SidebarList';
import LearningCard from '../components/ui/LearningCard';
import LessonHeader from '../components/ui/LessonHeader';
import AutoPlayBar from '../components/ui/AutoPlayBar';
import QuizMode from '../components/ui/QuizMode';
import FlashcardMode from '../components/ui/FlashcardMode';
import MatchingGame from '../components/ui/MatchingGame';
import WordleGame from '../components/ui/WordleGame';
import CrosswordGame from '../components/ui/CrosswordGame';
import { playClickSound } from '../components/ui/SoundEffects';

// --------------------------------------------------
// Tab Configuration
// --------------------------------------------------
type TabKey = 'learn' | 'quiz' | 'flashcards' | 'match' | 'wordle' | 'crossword';

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'learn', label: 'Learn', icon: '📖' },
    { key: 'quiz', label: 'Quiz', icon: '❓' },
    { key: 'flashcards', label: 'Flashcards', icon: '🃏' },
    { key: 'match', label: 'Match', icon: '🧩' },
    { key: 'wordle', label: 'Wordle', icon: '🟩' },
    { key: 'crossword', label: 'Crossword', icon: '➕' },
];

// --------------------------------------------------
// Main Component
// --------------------------------------------------
export default function HomeScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const params = useLocalSearchParams<{ loggedOut?: string }>();
    const router = useRouter();

    // Logout modal — shown when redirected from admin with ?loggedOut=true
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        if (params.loggedOut === 'true') {
            setShowLogoutModal(true);
        }
    }, [params.loggedOut]);

    const dismissLogoutModal = () => {
        setShowLogoutModal(false);
    };

    // --------------------------------------------------
    // State Variables
    // --------------------------------------------------

    /** 
     * @state items 
     * @description The complete list of vocabulary phrases fetched from the Supabase database. 
     */
    const [items, setItems] = useState<PhraseItem[]>([]);

    /** 
     * @state activeItem 
     * @description The specific phrase currently selected by the user, displayed in the main Learning Card.
     */
    const [activeItem, setActiveItem] = useState<PhraseItem | null>(null);

    /** 
     * @state loading 
     * @description Tracks whether the initial database fetch is still in progress. Controls the loading spinner.
     */
    const [loading, setLoading] = useState(true);

    /** 
     * @state sound 
     * @description Holds the current Expo AV audio object so we can stop or unload it when a new sound plays.
     */
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    /** 
     * @state activeTab 
     * @description Determines which main view is rendered (Learn, Quiz, Flashcards, Match, Wordle, Crossword).
     */
    const [activeTab, setActiveTab] = useState<TabKey>('learn');

    // Category filtering state
    /** 
     * @state categories 
     * @description All available lesson categories (e.g., 'Animals', 'Colors') fetched from the database.
     */
    const [categories, setCategories] = useState<Category[]>([]);

    /** 
     * @state selectedCategory 
     * @description The ID of the currently selected category filter. If null, displays 'All Vocabulary'.
     */
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Auto-play feature state
    /** 
     * @state isAutoPlaying 
     * @description Boolean flag indicating if the app is currently auto-advancing through the vocabulary list.
     */
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);

    /** 
     * @state autoPlaySpeed 
     * @description Controls the delay between auto-play advances. 'normal' = 3s, 'slow' = 5s.
     */
    const [autoPlaySpeed, setAutoPlaySpeed] = useState<'normal' | 'slow'>('normal');

    /** 
     * @ref autoPlayTimer 
     * @description React ref to store the Javascript timeout ID, allowing us to clear it if auto-play is paused.
     */
    const autoPlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Progress tracking — tracks user's studied words
    /** 
     * @state studiedIds 
     * @description A Set of phrase IDs the user has listened to. Used to calculate the lesson progress bar.
     */
    const [studiedIds, setStudiedIds] = useState<Set<string>>(new Set());

    // Fade animation for tab content transitions
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Ref to always access latest handlePlay (avoids stale closures in setTimeout)
    const handlePlayRef = useRef<((item?: PhraseItem) => Promise<void>) | undefined>(undefined);

    // --------------------------------------------------
    // Data Fetching & Initialization
    // --------------------------------------------------
    /**
     * @hook useEffect (on mount)
     * @description Runs exactly once when the app opens. It fetches categories and vocabulary, 
     * and loads any previously saved progress from the device.
     */
    useEffect(() => {
        fetchCategories();
        fetchVocabulary();
        loadProgress();  // Load saved progress from device storage
    }, []);

    // Re-fetch vocabulary when category changes
    useEffect(() => {
        fetchVocabulary();
    }, [selectedCategory]);

    useEffect(() => {
        return sound ? () => { sound.unloadAsync(); } : undefined;
    }, [sound]);

    // Clean up auto-play timer on unmount
    useEffect(() => {
        return () => {
            if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
        };
    }, []);

    // Save progress whenever studiedIds changes
    useEffect(() => {
        if (studiedIds.size > 0) {
            AsyncStorage.setItem('studiedIds', JSON.stringify([...studiedIds]));
        }
    }, [studiedIds]);

    /**
     * @function loadProgress
     * @description Reads the user's progress (which words they have listened to) from device storage.
     * This ensures the progress bar remembers state between app sessions.
     */
    const loadProgress = async () => {
        try {
            const saved = await AsyncStorage.getItem('studiedIds');
            if (saved) setStudiedIds(new Set(JSON.parse(saved)));
        } catch { /* ignore load errors */ }
    };

    /**
     * @function fetchCategories
     * @description Fetches the list of lesson categories (e.g., Animals, Body) from the Supabase API.
     */
    const fetchCategories = async () => {
        const data = await getCategories();
        setCategories(data);
    };

    /**
     * Fetch ALL vocabulary from API.
     */
    const fetchVocabulary = async () => {
        setLoading(true);
        try {
            const data = await getVocabulary(selectedCategory);
            setItems(data);
            if (data.length > 0 && !activeItem) setActiveItem(data[0]);
        } catch (err) {
            console.error('Error fetching vocabulary:', err);
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------------------
    // Tab Switching with Fade Animation
    // --------------------------------------------------
    const switchTab = (tab: TabKey) => {
        if (tab === activeTab) return;
        playClickSound();
        stopAutoPlay();

        // Fade out, switch tab, fade in
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
        }).start(() => {
            setActiveTab(tab);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        });
    };

    // --------------------------------------------------
    // Phrase Selection
    // --------------------------------------------------
    const handleSelect = (id: string) => {
        const item = items.find((i) => i.id === id);
        if (item) {
            playClickSound();
            setActiveItem(item);
        }
    };

    // --------------------------------------------------
    // Audio Playback
    // --------------------------------------------------
    const handlePlay = useCallback(async (item?: PhraseItem) => {
        const target = item || activeItem;
        if (!target?.audioUrl) return;

        // Track this word as "studied"
        setStudiedIds((prev) => new Set(prev).add(target.id));

        try {
            if (sound) await sound.unloadAsync();
            const { sound: s } = await Audio.Sound.createAsync({ uri: target.audioUrl });
            setSound(s);
            await s.playAsync();
        } catch (err) {
            console.error('Error playing audio:', err);
        }
    }, [activeItem, sound]);

    // Keep the ref in sync with the latest handlePlay
    useEffect(() => { handlePlayRef.current = handlePlay; }, [handlePlay]);

    // --------------------------------------------------
    // Auto-Play Logic
    // --------------------------------------------------
    const startAutoPlay = useCallback(() => {
        if (items.length === 0) return;
        setIsAutoPlaying(true);

        const advanceToNext = () => {
            setActiveItem((current) => {
                if (!current) return items[0];
                const idx = items.findIndex((i) => i.id === current.id);
                const nextIdx = (idx + 1) % items.length;
                const nextItem = items[nextIdx];

                // Play the audio for the next word
                handlePlayRef.current?.(nextItem);

                return nextItem;
            });

            // Schedule next advance
            const delay = autoPlaySpeed === 'normal' ? 3000 : 5000;
            autoPlayTimer.current = setTimeout(advanceToNext, delay);
        };

        // Play current word first, then start advancing
        handlePlay();
        const delay = autoPlaySpeed === 'normal' ? 3000 : 5000;
        autoPlayTimer.current = setTimeout(advanceToNext, delay);
    }, [items, autoPlaySpeed, handlePlay]);

    const stopAutoPlay = useCallback(() => {
        setIsAutoPlaying(false);
        if (autoPlayTimer.current) {
            clearTimeout(autoPlayTimer.current);
            autoPlayTimer.current = null;
        }
    }, []);

    const toggleAutoPlay = () => {
        if (isAutoPlaying) stopAutoPlay();
        else startAutoPlay();
    };

    const toggleSpeed = () => {
        setAutoPlaySpeed((s) => (s === 'normal' ? 'slow' : 'normal'));
    };

    // --------------------------------------------------
    // Loading State
    // --------------------------------------------------
    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#ea580c" />
                <Text style={styles.loadingText}>Loading vocabulary...</Text>
            </View>
        );
    }

    // --------------------------------------------------
    // Active item index for auto-play bar
    // --------------------------------------------------
    const currentIndex = activeItem
        ? items.findIndex((i) => i.id === activeItem.id)
        : 0;

    // --------------------------------------------------
    // Main Render
    // --------------------------------------------------
    return (
        <AppBackground style={styles.container}>
            <Header />

            {/* Tab navigation with icons */}
            <View style={styles.tabBarWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={Platform.OS === 'web'}
                    contentContainerStyle={styles.tabBar}
                >
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <Pressable
                                key={tab.key}
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => switchTab(tab.key)}
                            >
                                <Text style={styles.tabIcon}>{tab.icon}</Text>
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                    {tab.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Content area with fade transition */}
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

                {/* ── LEARN TAB ── */}
                {activeTab === 'learn' && (
                    <View style={styles.learnOuter}>
                        {/* Category pills — tap to filter by lesson */}
                        {categories.length > 0 && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={Platform.OS === 'web'}
                                style={styles.categoryScroll}
                                contentContainerStyle={styles.categoryRow}
                            >
                                <Pressable
                                    style={[styles.categoryPill, !selectedCategory && styles.categoryPillActive]}
                                    onPress={() => { setSelectedCategory(null); playClickSound(); }}
                                >
                                    <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>All</Text>
                                </Pressable>
                                {categories.map((cat) => (
                                    <Pressable
                                        key={cat.id}
                                        style={[styles.categoryPill, selectedCategory === cat.id && styles.categoryPillActive]}
                                        onPress={() => { setSelectedCategory(cat.id); playClickSound(); }}
                                    >
                                        <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                                            {cat.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        )}

                        {/* Loecsen-style lesson header with segmented progress */}
                        <LessonHeader
                            lessonTitle={selectedCategory
                                ? categories.find(c => c.id === selectedCategory)?.name || 'Vocabulary'
                                : 'All Vocabulary'
                            }
                            tip="Listen to the words one by one. When you feel ready, switch to Quiz mode to practise."
                            current={studiedIds.size}
                            total={items.length}
                        />

                        {/* Main content — sidebar + card */}
                        <View style={[styles.learnContainer, isDesktop ? styles.learnDesktop : styles.learnMobile]}>
                            <View style={[styles.sidebarWrap, isDesktop ? { flex: 1.2 } : { flex: 1 }]}>
                                <SidebarList items={items} activeId={activeItem?.id} onSelect={handleSelect} />
                            </View>
                            <View style={[styles.mainWrap, isDesktop ? { flex: 2.8 } : { minHeight: 280, borderTopWidth: 1, borderTopColor: colors.border }]}>
                                {activeItem && (
                                    <LearningCard
                                        nativeWord={activeItem.stoney}
                                        translation={activeItem.english}
                                        onPlayPress={() => handlePlay()}
                                    />
                                )}
                            </View>
                        </View>

                        {/* Loecsen-style auto-play control bar */}
                        <View style={styles.autoPlayWrap}>
                            <AutoPlayBar
                                isPlaying={isAutoPlaying}
                                onTogglePlay={toggleAutoPlay}
                                speed={autoPlaySpeed}
                                onSpeedChange={toggleSpeed}
                                currentIndex={currentIndex}
                                totalItems={items.length}
                            />
                        </View>
                    </View>
                )}

                {/* ── QUIZ TAB ── */}
                {activeTab === 'quiz' && (
                    <View style={styles.gameWrap}><QuizMode items={items} /></View>
                )}

                {/* ── FLASHCARDS TAB ── */}
                {activeTab === 'flashcards' && (
                    <View style={styles.gameWrap}><FlashcardMode items={items} /></View>
                )}

                {/* ── MATCH TAB ── */}
                {activeTab === 'match' && (
                    <View style={styles.gameWrap}><MatchingGame items={items} /></View>
                )}

                {/* ── WORDLE TAB ── */}
                {activeTab === 'wordle' && (
                    <View style={styles.gameWrap}><WordleGame items={items} categories={categories} /></View>
                )}

                {/* ── CROSSWORD TAB ── */}
                {activeTab === 'crossword' && (
                    <View style={styles.gameWrap}><CrosswordGame items={items} /></View>
                )}
            </Animated.View>

            {/* Logout success modal — shown when redirected from admin */}
            <Modal
                visible={showLogoutModal}
                transparent
                animationType="fade"
                onRequestClose={dismissLogoutModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalIcon}>✅</Text>
                        <Text style={styles.modalTitle}>Logged Out</Text>
                        <Text style={styles.modalMessage}>
                            You have been successfully logged out.
                        </Text>
                        <Pressable
                            style={({ pressed }) => [
                                styles.modalButton,
                                pressed && { opacity: 0.8 },
                            ]}
                            onPress={dismissLogoutModal}
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </AppBackground>
    );
}

/* ──────────────────────────────────────────────
 * STYLES
 * ────────────────────────────────────────────── */
const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: colors.textMuted,
        fontSize: 15,
    },

    // Tab bar — with icons
    tabBarWrapper: {
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'web' ? 8 : 0, // Prevent scrollbar overlap on web
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: colors.primary,
    },
    tabIcon: {
        fontSize: 16,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
    },
    tabTextActive: {
        color: colors.primary,
    },

    // Content area
    content: {
        flex: 1,
        padding: 12,
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },

    // Learn tab outer container
    learnOuter: {
        flex: 1,
        gap: 0,
    },

    // Learn mode — sidebar + card
    learnContainer: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    learnDesktop: {
        flexDirection: 'row',
    },
    learnMobile: {
        flexDirection: 'column',
    },
    sidebarWrap: {
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    mainWrap: {
        backgroundColor: colors.surface,
    },

    // Auto-play bar wrapper
    autoPlayWrap: {
        marginTop: 12,
    },

    // Game modes container
    gameWrap: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },

    // Category pills
    categoryScroll: {
        maxHeight: Platform.OS === 'web' ? 56 : 44, // Extra height for web scrollbar
        marginBottom: 10,
    },
    categoryRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 4,
        paddingRight: 16,
        paddingBottom: Platform.OS === 'web' ? 8 : 0,
    },
    categoryPill: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryPillActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMutedDark,
    },
    categoryTextActive: {
        color: colors.surface,
    },

    // Logout modal overlay
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 32,
        width: '90%',
        maxWidth: 360,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
    modalIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 14,
        color: colors.textMutedDark,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    modalButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 48,
        borderRadius: 10,
    },
    modalButtonText: {
        color: colors.surface,
        fontSize: 16,
        fontWeight: '700',
    },
});
