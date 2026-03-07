import { useTheme } from '../../contexts/ThemeContext';
/**
 * FlashcardMode.tsx — A tap-to-reveal flashcard study mode.
 *
 * How it works:
 * 1. Shows a Stoney word face-up on a card
 * 2. Player taps the card to reveal the English translation
 * 3. Player chooses "Study Again" (keeps it in the deck) or "Got It" (marks mastered)
 * 4. A progress bar tracks how many words have been mastered
 *
 * Props:
 * - items: Array of vocabulary items to study from
 */

import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { playFlipSound, playClickSound, playCompleteSound } from './SoundEffects';

type VocabItem = { id: string; stoney: string; english: string; audioUrl?: string };

interface FlashcardModeProps {
    items: VocabItem[];
}

export default function FlashcardMode({ items }: FlashcardModeProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { width } = useWindowDimensions();
    const isMobile = width < 600;

    // State
    const [index, setIndex] = useState(0); // Current card index
    const [revealed, setRevealed] = useState(false); // Is the translation shown?
    const [mastered, setMastered] = useState<Set<string>>(new Set()); // IDs of mastered words

    const word = items[index];

    // Show message if no items
    if (!word) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>No flashcards available.</Text>
            </View>
        );
    }

    // Move to the next card and hide the translation
    const next = () => {
        playClickSound();
        setRevealed(false);
        setIndex((p) => (p + 1) % items.length); // Loop back to start
    };

    // Mark current word as mastered and move on
    const markMastered = () => {
        const newMastered = new Set(mastered).add(word.id);
        setMastered(newMastered);
        if (newMastered.size === items.length)
            playCompleteSound(); // All mastered!
        else playClickSound();
        next();
    };

    // Calculate mastery percentage for the progress bar
    const progress = items.length > 0 ? (mastered.size / items.length) * 100 : 0;

    return (
        <View style={styles.container}>
            {/* Mastery progress bar */}
            <View style={styles.progressRow}>
                <Text style={styles.progressText}>
                    Mastered: {mastered.size} / {items.length}
                </Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
            </View>

            {/* The flashcard — tap to reveal */}
            <Pressable
                style={({ pressed }) => [styles.card, pressed && !revealed && styles.cardPressed]}
                onPress={() => setRevealed(true)}
            >
                {/* Stoney word (always visible) */}
                <Text style={styles.cardLabel}>Stoney Nakoda</Text>
                <Text style={styles.cardWord}>{word.stoney}</Text>

                {/* English translation (only visible after tap) */}
                {revealed ? (
                    <>
                        <View style={styles.cardDivider} />
                        <Text style={styles.cardLabelEng}>English</Text>
                        <Text style={styles.cardTranslation}>{word.english}</Text>
                    </>
                ) : (
                    <Text style={styles.tapHint}>Tap to reveal translation</Text>
                )}
            </Pressable>

            {/* Study Again / Got It buttons — appear after revealing */}
            {revealed && (
                <View style={[styles.actions, isMobile && styles.actionsMobile]}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.actionBtn,
                            styles.studyBtn,
                            pressed && styles.btnPressed,
                        ]}
                        onPress={next}
                    >
                        <Text style={styles.studyText}>Study Again</Text>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [
                            styles.actionBtn,
                            styles.masteredBtn,
                            pressed && styles.btnPressed,
                        ]}
                        onPress={markMastered}
                    >
                        <Text style={styles.masteredText}>Got It ✓</Text>
                    </Pressable>
                </View>
            )}

            {/* Card counter */}
            <Text style={styles.counter}>
                {index + 1} of {items.length}
            </Text>
        </View>
    );
}

/* ──────────────────────────────────────────────
 * STYLES
 * ────────────────────────────────────────────── */
const createStyles = (colors: any) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.surface, padding: 24 },
        empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        emptyText: { color: colors.textMuted, fontSize: 15 },

        // Progress bar
        progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
        progressText: {
            color: colors.textMutedDark,
            fontSize: 13,
            fontWeight: '600',
            minWidth: 120,
        },
        progressBar: {
            flex: 1,
            height: 6,
            backgroundColor: colors.surfaceAlt,
            borderRadius: 3,
            overflow: 'hidden',
        },
        progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },

        // The flashcard
        card: {
            flex: 1,
            maxHeight: 340,
            backgroundColor: colors.background, // Light gray card background
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
        },
        cardPressed: { backgroundColor: colors.surfaceAlt },
        cardLabel: {
            fontSize: 12,
            fontWeight: '700',
            color: colors.primary,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginBottom: 8,
        },
        cardWord: {
            fontSize: 32,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 8,
        },
        tapHint: { marginTop: 24, fontSize: 13, color: colors.textMuted },
        cardDivider: {
            width: 48,
            height: 2,
            backgroundColor: colors.border,
            marginVertical: 20,
            borderRadius: 1,
        },
        cardLabelEng: {
            fontSize: 12,
            fontWeight: '700',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginBottom: 8,
        },
        cardTranslation: {
            fontSize: 22,
            color: colors.textSubtle,
            fontWeight: '500',
            textAlign: 'center',
        },

        // Action buttons
        actions: { flexDirection: 'row', gap: 12, marginTop: 20, justifyContent: 'center' },
        actionsMobile: { flexDirection: 'column' }, // Stack on small screens
        actionBtn: {
            flex: 1,
            maxWidth: 180,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
        },
        btnPressed: { opacity: 0.8 },
        studyBtn: {
            backgroundColor: colors.surfaceAlt,
            borderWidth: 1,
            borderColor: colors.border,
        },
        masteredBtn: { backgroundColor: colors.primary }, // Teal primary
        studyText: { fontSize: 15, fontWeight: '600', color: colors.textSubtle },
        masteredText: { fontSize: 15, fontWeight: '700', color: colors.surface },

        // Card counter
        counter: { textAlign: 'center', marginTop: 16, fontSize: 13, color: colors.borderDark },
    });
