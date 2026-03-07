import { useTheme } from '../../contexts/ThemeContext';
/**
 * MatchingGame.tsx — A memory card matching game.
 *
 * How it works:
 * 1. A grid of face-down cards is shown (each card has a "?" on it)
 * 2. Player flips two cards at a time by tapping them
 * 3. If the two flipped cards are a Stoney-English pair (same word), they stay face-up
 * 4. If they don't match, they flip back face-down after a short delay
 * 5. Game ends when all pairs are matched
 *
 * The game randomly selects 6 words (or 4 on mobile) from the vocabulary list
 * and creates 12 cards (or 8) — one Stoney and one English for each word.
 *
 * Props:
 * - items: Array of vocabulary items (needs at least 4)
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { playClickSound, playMatchSound, playWrongSound, playCompleteSound } from './SoundEffects';

type VocabItem = { id: string; stoney: string; english: string; audioUrl?: string };

interface MatchingGameProps {
    items: VocabItem[];
}

// Type for each card in the game grid
type Card = {
    id: string; // Unique card identifier (e.g., "s-123" or "e-123")
    text: string; // The word shown when flipped
    type: 'stoney' | 'english'; // Which language this card shows
    vocabId: string; // Links Stoney and English cards for the same word
};

/**
 *
 * @param root0
 * @param root0.items
 */
export default function MatchingGame({ items }: MatchingGameProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { width } = useWindowDimensions();
    const columns = width < 600 ? 2 : 4; // Fewer columns on mobile
    const pairCount = width < 600 ? 4 : 6; // Fewer pairs on mobile

    // Game state
    const [cards, setCards] = useState<Card[]>([]); // All cards in the grid
    const [flipped, setFlipped] = useState<string[]>([]); // Currently flipped card IDs (max 2)
    const [matched, setMatched] = useState<Set<string>>(new Set()); // IDs of successfully matched cards
    const [moves, setMoves] = useState(0); // Move counter
    const [complete, setComplete] = useState(false); // Is the game finished?

    // Start a new game whenever items change
    useEffect(() => {
        startGame();
    }, [items]);

    /**
     * Initialize a new game:
     * 1. Pick random vocabulary words
     * 2. Create two cards for each word (one Stoney, one English)
     * 3. Shuffle all cards randomly
     */
    const startGame = () => {
        const pool = [...items].sort(() => Math.random() - 0.5).slice(0, pairCount);
        const deck: Card[] = [];

        pool.forEach((item) => {
            // Create a Stoney card and an English card for each word
            deck.push({ id: `s-${item.id}`, text: item.stoney, type: 'stoney', vocabId: item.id });
            deck.push({
                id: `e-${item.id}`,
                text: item.english,
                type: 'english',
                vocabId: item.id,
            });
        });

        // Shuffle the deck randomly
        setCards(deck.sort(() => Math.random() - 0.5));
        setFlipped([]);
        setMatched(new Set());
        setMoves(0);
        setComplete(false);
    };

    /**
     * Handle when a card is tapped.
     * - If less than 2 cards are flipped, flip this card
     * - If 2 cards are now flipped, check if they match
     * - If they match, mark them as matched
     * - If they don't match, flip them back after 800ms
     */
    const handleFlip = useCallback(
        (cardId: string) => {
            // Don't allow flipping if 2 cards already up, or card already flipped/matched
            if (flipped.length >= 2 || flipped.includes(cardId) || matched.has(cardId)) return;

            const next = [...flipped, cardId];
            setFlipped(next);

            // Check for a match when 2 cards are flipped
            if (next.length === 2) {
                setMoves((p) => p + 1);
                const [a, b] = next;
                const c1 = cards.find((c) => c.id === a);
                const c2 = cards.find((c) => c.id === b);

                // Match = same vocabId but different type (one Stoney, one English)
                if (c1 && c2 && c1.vocabId === c2.vocabId && c1.type !== c2.type) {
                    // Cards match! Mark both as matched
                    const nm = new Set(matched);
                    nm.add(a);
                    nm.add(b);
                    setMatched(nm);
                    playMatchSound(); // Celebratory chime

                    // Check if all cards are matched (game complete)
                    if (nm.size === cards.length) {
                        setComplete(true);
                        playCompleteSound(); // Triumphant fanfare
                    }
                    setTimeout(() => setFlipped([]), 400);
                } else {
                    // No match — flip cards back after a short delay
                    playWrongSound();
                    setTimeout(() => setFlipped([]), 800);
                }
            }
        },
        [flipped, matched, cards]
    );

    // Need at least 4 items to play
    if (items.length < 4) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>Need at least 4 words for matching.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Game stats — moves and matches */}
            <View style={styles.statsRow}>
                <Text style={styles.stat}>Moves: {moves}</Text>
                <Text style={styles.stat}>
                    Matched: {matched.size / 2} / {cards.length / 2}
                </Text>
            </View>

            {/* Success banner when all pairs are found */}
            {complete && (
                <View style={styles.completeBanner}>
                    <Text style={styles.completeText}>🎉 Complete in {moves} moves!</Text>
                </View>
            )}

            {/* Card grid */}
            <View style={[styles.grid, { maxWidth: columns * 180 }]}>
                {cards.map((card) => {
                    const isUp = flipped.includes(card.id) || matched.has(card.id); // Is this card showing?
                    const isDone = matched.has(card.id); // Is this card matched?

                    return (
                        <Pressable
                            key={card.id}
                            style={({ pressed }) => [
                                styles.tile,
                                { width: `${100 / columns - 3}%` }, // Responsive width
                                isUp &&
                                    (card.type === 'stoney'
                                        ? styles.tileStoney
                                        : styles.tileEnglish),
                                isDone && styles.tileDone,
                                pressed && !isUp && styles.tilePressed,
                            ]}
                            onPress={() => handleFlip(card.id)}
                        >
                            {isUp ? (
                                // Card is face-up — show the word
                                <>
                                    <Text style={styles.tileType}>
                                        {card.type === 'stoney' ? 'STN' : 'ENG'}
                                    </Text>
                                    <Text style={styles.tileText} numberOfLines={3}>
                                        {card.text}
                                    </Text>
                                </>
                            ) : (
                                // Card is face-down — show "?"
                                <Text style={styles.tileFace}>?</Text>
                            )}
                        </Pressable>
                    );
                })}
            </View>

            {/* Play again button */}
            {complete && (
                <Pressable
                    style={({ pressed }) => [styles.restartBtn, pressed && styles.restartPressed]}
                    onPress={startGame}
                >
                    <Text style={styles.restartText}>Play Again</Text>
                </Pressable>
            )}
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
        container: { flex: 1, backgroundColor: colors.surface, padding: 24 },
        empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        emptyText: { color: colors.textMuted, fontSize: 15 },

        // Stats row
        statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
        stat: { color: colors.textMutedDark, fontSize: 13, fontWeight: '600' },

        // Success banner
        completeBanner: {
            backgroundColor: colors.successBg,
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
        },
        completeText: {
            fontSize: 15,
            fontWeight: '700',
            color: colors.successText,
            textAlign: 'center',
        },

        // Card grid
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 10,
            alignSelf: 'center',
        },

        // Individual card tile
        tile: {
            minHeight: 110, // Tall enough to read comfortably
            backgroundColor: colors.surfaceAlt,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
        },
        tileStoney: { backgroundColor: colors.primaryBg, borderColor: colors.primary }, // Teal for Stoney
        tileEnglish: { backgroundColor: '#fefce8', borderColor: '#ca8a04' }, // Amber for English
        tileDone: { opacity: 0.4 }, // Fade matched cards
        tilePressed: { backgroundColor: colors.border },
        tileFace: { fontSize: 32, fontWeight: '700', color: colors.borderDark }, // The "?" symbol
        tileType: {
            fontSize: 10,
            fontWeight: '700',
            color: colors.textMuted,
            letterSpacing: 1,
            marginBottom: 6,
        },
        tileText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
        },

        // Play again button
        restartBtn: {
            alignSelf: 'center',
            marginTop: 20,
            paddingVertical: 12,
            paddingHorizontal: 32,
            backgroundColor: colors.primary,
            borderRadius: 12,
        },
        restartPressed: { opacity: 0.9 },
        restartText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
    });
