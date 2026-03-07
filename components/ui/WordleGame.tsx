import { useTheme } from '../../contexts/ThemeContext';
/**
 * WordleGame.tsx — A daily deterministic word-guessing game for Stoney Nakoda.
 *
 * Adheres to the Stoney Word Games Engineering Skill:
 * - Robust text normalization for diacritics
 * - Positive, enlightening daily hints
 * - Custom on-screen keyboard with color feedback
 * - AsyncStorage state persistence (daily streak & completion)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    useWindowDimensions,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playClickSound, playCompleteSound } from './SoundEffects';

/**
 * Normalizes Stoney Nakoda text for game comparison.
 * Converts to lowercase, decomposes diacritics (NFD), and strips combining marks.
 * e.g., "achâksîch" -> "achaksich"
 */
export const normalizeStoney = (str: string) => {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

const POSITIVE_HINTS = [
    'Like a river finding its way, perseverance is key.',
    'A single spark can start a great fire.',
    'Roots grow deep before the tree grows tall.',
    'Every step forward is a victory in itself.',
    'Patience is the calm before the dawn.',
    "Strength isn't just power, it's resilience.",
    'To learn is to honoring the ancestors.',
    'Your voice carries the spirit of the language.',
    'Knowledge is a light that never goes out.',
    'Small seeds grow into mighty cedars.',
];

const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

/**
 * Props for the WordleGame component.
 */
type WordleGameProps = {
    /**
     * Array of all possible vocabulary words.
     * The game will filter this list to find valid 4-8 letter words.
     */
    items: { id: string; stoney: string; english: string; category_id?: string | null }[];
    /**
     * Array of available lesson categories.
     * Used to provide the player with a category hint for the daily word.
     */
    categories: { id: string; name: string }[];
};

/**
 * WordleGame Component
 *
 * Renders the daily Stoney word-guessing game.
 * Features a dynamic grid, a custom on-screen keyboard, and daily streak tracking.
 */
export default function WordleGame({ items, categories }: WordleGameProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { width } = useWindowDimensions();
    const isMobile = width < 600;

    // Filter valid words (single word, 4-8 letters, only letters, categorized)
    const validWords = useMemo(() => {
        return items
            .filter((item) => {
                // Must have a valid category
                if (!item.category_id) return false;

                // Cast to string for comparison in case one is an int and the other is a string
                const cat = categories.find((c) => String(c.id) === String(item.category_id));
                if (!cat || cat.name.toLowerCase() === 'uncategorized') return false;

                if (!item.stoney) return false;
                const word = item.stoney.trim();
                // No spaces or hyphens, just letters and diacritics
                if (word.includes(' ') || word.includes('-')) return false;
                if (word.length < 4 || word.length > 8) return false;
                // Clean word must only contain letters
                const clean = normalizeStoney(word);
                return /^[a-z]+$/.test(clean);
            })
            .sort((a, b) => a.stoney.localeCompare(b.stoney));
    }, [items, categories]);

    // Deterministic Selection based on current local date
    const dailyData = useMemo(() => {
        if (validWords.length === 0) return null;

        const now = new Date();
        // Use local date string as seed, e.g., "2023-10-27"
        const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

        // Simple hash of date string
        let hash = 0;
        for (let i = 0; i < dateStr.length; i++) {
            hash = (hash << 5) - hash + dateStr.charCodeAt(i);
            hash |= 0;
        }

        // Use hash to pick a word
        const index = Math.abs(hash) % validWords.length;
        const targetObj = validWords[index];
        const targetClean = normalizeStoney(targetObj.stoney);

        // Pick a hint based on hash as well
        const hintIndex = Math.abs(hash) % POSITIVE_HINTS.length;

        const categoryName = targetObj.category_id
            ? categories.find((c) => c.id === targetObj.category_id)?.name || 'Uncategorized'
            : 'Uncategorized';

        return {
            dateStr,
            targetDisplay: targetObj.stoney,
            targetClean,
            english: targetObj.english,
            categoryName,
            hint: POSITIVE_HINTS[hintIndex],
        };
    }, [validWords, categories]);

    // State
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [streak, setStreak] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load state on mount
    useEffect(() => {
        const loadState = async () => {
            if (!dailyData) return;
            try {
                const savedStreak = await AsyncStorage.getItem('wordle_streak');
                if (savedStreak) setStreak(parseInt(savedStreak, 10));

                const stateJson = await AsyncStorage.getItem('wordle_state');
                if (stateJson) {
                    const state = JSON.parse(stateJson);
                    if (state.dateStr === dailyData.dateStr) {
                        setGuesses(state.guesses);
                        setGameState(state.gameState);
                    }
                }
            } catch (e) {
                console.error('Error loading wordle state:', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadState();
    }, [dailyData]);

    // Save state when it changes
    useEffect(() => {
        if (!isLoaded || !dailyData) return;
        AsyncStorage.setItem(
            'wordle_state',
            JSON.stringify({
                dateStr: dailyData.dateStr,
                guesses,
                gameState,
            })
        );
    }, [guesses, gameState, isLoaded, dailyData]);

    const handleKeyPress = useCallback(
        (key: string) => {
            if (gameState !== 'playing' || !dailyData) return;
            playClickSound();

            if (key === 'ENTER') {
                if (currentGuess.length !== dailyData.targetClean.length) {
                    // Not enough letters
                    return;
                }
                const newGuesses = [...guesses, currentGuess];
                setGuesses(newGuesses);

                if (currentGuess === dailyData.targetClean) {
                    setGameState('won');
                    playCompleteSound();
                    const newStreak = streak + 1;
                    setStreak(newStreak);
                    AsyncStorage.setItem('wordle_streak', newStreak.toString());
                } else if (newGuesses.length >= 6) {
                    setGameState('lost');
                    setStreak(0);
                    AsyncStorage.setItem('wordle_streak', '0');
                }
                setCurrentGuess('');
            } else if (key === '⌫') {
                setCurrentGuess((prev) => prev.slice(0, -1));
            } else {
                if (currentGuess.length < dailyData.targetClean.length) {
                    setCurrentGuess((prev) => prev + key.toLowerCase());
                }
            }
        },
        [currentGuess, guesses, gameState, dailyData, streak]
    );

    if (!dailyData) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#ea580c" />
                <Text style={{ marginTop: 12, color: colors.textMutedDark }}>
                    Preparing game...
                </Text>
            </View>
        );
    }

    const { targetClean, targetDisplay, english, hint, categoryName } = dailyData;
    const wordLength = targetClean.length;

    /**
     * Evaluates the color status (Green, Yellow, Gray) of a specific letter in a guess.
     * Handles duplicate letters correctly (e.g., guessing "APPLE" when the target is "PAPER").
     *
     * @param guessString The full string the user guessed
     * @param index The index of the letter currently being evaluated
     * @returns 'correct' (Green), 'present' (Yellow), or 'absent' (Gray)
     */
    const getLetterStatus = (
        guessString: string,
        index: number
    ): 'correct' | 'present' | 'absent' | 'empty' => {
        if (!guessString) return 'empty';
        const letter = guessString[index];

        // 1. Exact match (Green)
        if (targetClean[index] === letter) return 'correct';

        // 2. Letter exists in the target word, but might be Yellow or Gray
        if (targetClean.includes(letter)) {
            // How many times does this letter appear in the actual target word?
            let targetCount = targetClean.split('').filter((l) => l === letter).length;

            // How many times have we already awarded a 'Green' for this letter in the current guess?
            let correctCount = guessString
                .split('')
                .filter((l, i) => l === letter && targetClean[i] === letter).length;

            // How many 'Yellows' have we awarded to this letter *so far* scanning left-to-right?
            let currentYellowCount = 0;
            for (let i = 0; i <= index; i++) {
                if (guessString[i] === letter && targetClean[i] !== letter) {
                    currentYellowCount++;
                }
            }

            // Only award yellow if we haven't exceeded the total available letters in the target
            if (currentYellowCount <= targetCount - correctCount) {
                return 'present';
            }
        }

        // 3. Not in word, or remaining duplicate (Gray)
        return 'absent';
    };

    // Evaluate keyboard colors
    const keyColors: Record<string, 'correct' | 'present' | 'absent'> = {};
    guesses.forEach((guess) => {
        for (let i = 0; i < wordLength; i++) {
            const letter = guess[i].toUpperCase();
            const status = getLetterStatus(guess, i);
            const existing = keyColors[letter];
            if (status === 'correct') {
                keyColors[letter] = 'correct';
            } else if (status === 'present' && existing !== 'correct') {
                keyColors[letter] = 'present';
            } else if (status === 'absent' && !existing) {
                keyColors[letter] = 'absent';
            }
        }
    });

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Daily Stoney Word</Text>
                <Text style={styles.streak}>🔥 Streak: {streak}</Text>
            </View>

            <View style={styles.hintBox}>
                <Text style={styles.hintMessage}>"{hint}"</Text>
                <Text style={styles.hintCategory}>Category hint: {categoryName}</Text>
            </View>

            {/* Game Grid */}
            <View style={styles.grid}>
                {Array.from({ length: 6 }).map((_, rowIndex) => {
                    const guess =
                        guesses[rowIndex] || (rowIndex === guesses.length ? currentGuess : '');
                    const isCompleted = rowIndex < guesses.length;

                    // Dynamic box size for mobile
                    const availableWidth = Math.min(width - 32, 600);
                    const maxBoxWidth = Math.floor(
                        (availableWidth - (wordLength - 1) * 8) / wordLength
                    );
                    const finalBoxSize = Math.min(48, maxBoxWidth);

                    return (
                        <View key={rowIndex} style={styles.row}>
                            {Array.from({ length: wordLength }).map((_, colIndex) => {
                                const letter = guess[colIndex] || '';
                                let boxStyle: any = {
                                    ...styles.box,
                                    width: finalBoxSize,
                                    height: finalBoxSize,
                                };
                                let textStyle: any = {
                                    ...styles.boxText,
                                    fontSize: finalBoxSize * 0.5,
                                };

                                if (isCompleted) {
                                    const status = getLetterStatus(guess, colIndex);
                                    if (status === 'correct') {
                                        boxStyle = {
                                            ...boxStyle,
                                            backgroundColor: colors.success,
                                            borderColor: colors.success,
                                        } as any;
                                        textStyle = { ...textStyle, color: colors.surface } as any;
                                    } else if (status === 'present') {
                                        boxStyle = {
                                            ...boxStyle,
                                            backgroundColor: colors.warning,
                                            borderColor: colors.warning,
                                        } as any;
                                        textStyle = { ...textStyle, color: colors.surface } as any;
                                    } else {
                                        boxStyle = {
                                            ...boxStyle,
                                            backgroundColor: colors.textMutedDark,
                                            borderColor: colors.textMutedDark,
                                        } as any;
                                        textStyle = { ...textStyle, color: colors.surface } as any;
                                    }
                                } else if (letter) {
                                    boxStyle = {
                                        ...boxStyle,
                                        borderColor: colors.textMuted,
                                    } as any;
                                }

                                return (
                                    <View key={colIndex} style={boxStyle}>
                                        <Text style={textStyle}>{letter.toUpperCase()}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    );
                })}
            </View>

            {/* Game Over Screen */}
            {gameState !== 'playing' && (
                <View style={styles.gameOver}>
                    <Text style={styles.gameOverTitle}>
                        {gameState === 'won' ? 'Brilliant! 🎉' : 'Keep Trying! 💪'}
                    </Text>
                    <Text style={styles.answerLabel}>Today's word was:</Text>
                    <Text style={styles.answerWord}>{targetDisplay}</Text>
                    <Text style={styles.answerEnglish}>{english}</Text>
                    <Text style={styles.comeBack}>Come back tomorrow for a new word!</Text>
                </View>
            )}

            {/* Keyboard */}
            <View style={styles.keyboard}>
                {KEYBOARD_ROWS.map((row, rIdx) => (
                    <View key={rIdx} style={styles.keyRow}>
                        {row.map((key) => {
                            let keyStyle: any = styles.key;
                            let keyText: any = styles.keyText;

                            if (key.length > 1) {
                                keyStyle = { ...keyStyle, paddingHorizontal: 12, minWidth: 60 };
                            }

                            const kColor = keyColors[key];
                            if (kColor === 'correct') {
                                keyStyle = { ...keyStyle, backgroundColor: colors.success };
                                keyText = { ...keyText, color: colors.surface };
                            } else if (kColor === 'present') {
                                keyStyle = { ...keyStyle, backgroundColor: colors.warning };
                                keyText = { ...keyText, color: colors.surface };
                            } else if (kColor === 'absent') {
                                keyStyle = { ...keyStyle, backgroundColor: colors.textMutedDark };
                                keyText = { ...keyText, color: colors.surface };
                            }

                            return (
                                <Pressable
                                    key={key}
                                    style={({ pressed }) => [keyStyle, pressed && { opacity: 0.7 }]}
                                    onPress={() => handleKeyPress(key)}
                                >
                                    <Text style={keyText}>{key}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const createStyles = (colors: any) =>
    StyleSheet.create({
        center: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        scrollContent: {
            paddingBottom: 40,
            alignItems: 'center',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingVertical: 16,
            paddingHorizontal: 20,
        },
        title: {
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.primary,
        },
        streak: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.warning,
        },
        hintBox: {
            backgroundColor: colors.successBg,
            padding: 16,
            borderRadius: 12,
            marginBottom: 24,
            width: '90%',
            maxWidth: 500,
            borderWidth: 1,
            borderColor: colors.successBorder,
            alignItems: 'center',
        },
        hintMessage: {
            fontSize: 16,
            fontStyle: 'italic',
            color: colors.successTextDark,
            textAlign: 'center',
            marginBottom: 6,
        },
        hintCategory: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.successText,
        },
        grid: {
            gap: 8,
            marginBottom: 32,
        },
        row: {
            flexDirection: 'row',
            gap: 8,
        },
        box: {
            borderWidth: 2,
            borderColor: colors.borderDark,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface,
        },
        boxText: {
            fontWeight: 'bold',
            color: colors.textDark,
        },
        keyboard: {
            width: '100%',
            maxWidth: 600,
            gap: 8,
            alignItems: 'center',
        },
        keyRow: {
            flexDirection: 'row',
            gap: 6,
        },
        key: {
            backgroundColor: colors.border,
            paddingVertical: 14,
            paddingHorizontal: 12,
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
        },
        keyText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.textSecondary,
        },
        gameOver: {
            backgroundColor: colors.background,
            padding: 24,
            borderRadius: 16,
            alignItems: 'center',
            marginBottom: 24,
            width: '90%',
            maxWidth: 400,
            borderWidth: 1,
            borderColor: colors.border,
        },
        gameOverTitle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.primary,
            marginBottom: 16,
        },
        answerLabel: {
            fontSize: 14,
            color: colors.textMutedDark,
            marginBottom: 4,
        },
        answerWord: {
            fontSize: 28,
            fontWeight: 'bold',
            color: colors.textDark,
            marginBottom: 4,
        },
        answerEnglish: {
            fontSize: 16,
            color: colors.textSubtle,
            fontStyle: 'italic',
            marginBottom: 16,
        },
        comeBack: {
            fontSize: 15,
            fontWeight: '500',
            color: colors.primary,
        },
    });
