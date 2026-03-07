import { useTheme } from '../../contexts/ThemeContext';
/**
 * QuizMode.tsx — A multiple-choice translation quiz game.
 *
 * How it works:
 * 1. A random Stoney word is shown
 * 2. Four English options are displayed (1 correct, 3 random wrong answers)
 * 3. Player taps an option to answer
 * 4. Correct answers turn green, wrong answers turn red
 * 5. A "Next" button appears to move to the next question
 * 6. A progress bar tracks the score
 *
 * Props:
 * - items: Array of vocabulary items to quiz from (needs at least 4)
 */

import { useMemo,  useState, useEffect  } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { playCorrectSound, playWrongSound } from './SoundEffects';

type VocabItem = { id: string; stoney: string; english: string; audioUrl?: string };

interface QuizModeProps {
    items: VocabItem[];
}

export default function QuizMode({ items }: QuizModeProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    // Check screen width for responsive layout
    const { width } = useWindowDimensions();
    const isMobile = width < 600;

    // Quiz state
    const [currentIndex, setCurrentIndex] = useState(0);   // Index of current word
    const [options, setOptions] = useState<string[]>([]);   // The 4 answer options
    const [selected, setSelected] = useState<string | null>(null); // What the player chose
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null); // Was the answer right?
    const [score, setScore] = useState(0);   // Number of correct answers
    const [total, setTotal] = useState(0);   // Total questions answered

    // Generate a new question when items load
    useEffect(() => {
        if (items.length >= 4) generateQuestion();
    }, [items]);

    /**
     * Generate a new quiz question:
     * - Pick a random word
     * - Get 3 wrong answers from other words
     * - Shuffle all 4 options together
     */
    const generateQuestion = () => {
        const idx = Math.floor(Math.random() * items.length);
        setCurrentIndex(idx);
        setSelected(null);     // Reset selection
        setIsCorrect(null);    // Reset correctness

        const correct = items[idx].english;
        const wrong = items
            .filter((_, i) => i !== idx)              // Exclude the correct answer
            .sort(() => Math.random() - 0.5)          // Shuffle
            .slice(0, 3)                              // Take 3 wrong answers
            .map((i) => i.english);
        setOptions([...wrong, correct].sort(() => Math.random() - 0.5)); // Shuffle all 4
    };

    /**
     * Handle when the player taps an answer option
     */
    const handleAnswer = (answer: string) => {
        if (selected) return;  // Don't allow changing answer
        setSelected(answer);
        setTotal((p) => p + 1);
        const correct = items[currentIndex].english;
        const wasCorrect = answer === correct;
        setIsCorrect(wasCorrect);
        if (wasCorrect) {
            setScore((p) => p + 1);
            playCorrectSound();  // Play happy chime
        } else {
            playWrongSound();    // Play sad buzz
        }
    };

    // Current word being quizzed
    const word = items[currentIndex];

    // Show message if not enough words
    if (!word || items.length < 4) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>Need at least 4 words for quiz mode.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Score progress bar */}
            <View style={styles.progressRow}>
                <Text style={styles.progressText}>{score} correct of {total}</Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, {
                        width: total > 0 ? `${(score / total) * 100}%` : '0%'
                    }]} />
                </View>
            </View>

            {/* Feedback banner — shows after answering */}
            {selected && (
                <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
                    <Text style={styles.feedbackText}>
                        {isCorrect ? '✓ Correct!' : `✗ The answer was: "${word.english}"`}
                    </Text>
                </View>
            )}

            {/* Question — the Stoney word to translate */}
            <View style={styles.questionArea}>
                <Text style={styles.questionLabel}>Translate this Stoney word</Text>
                <Text style={styles.questionWord}>{word.stoney}</Text>
            </View>

            {/* Answer options — 4 buttons in a 2x2 grid (or stacked on mobile) */}
            <View style={[styles.options, isMobile && styles.optionsMobile]}>
                {options.map((opt, i) => {
                    const isThis = selected === opt;           // Did player pick this one?
                    const isAnswer = opt === word.english;     // Is this the correct answer?

                    // Determine the styling based on state
                    let style = styles.optDefault;
                    if (selected) {
                        if (isAnswer) style = styles.optCorrect;       // Green for correct
                        else if (isThis) style = styles.optWrong;      // Red if player picked wrong
                    }

                    return (
                        <Pressable
                            key={i}
                            style={({ pressed }) => [
                                styles.optBtn,
                                style,
                                pressed && !selected && styles.optPressed,
                            ]}
                            onPress={() => handleAnswer(opt)}
                        >
                            <Text style={[
                                styles.optText,
                                selected && isAnswer && styles.optTextCorrect,
                            ]}>
                                {opt}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Next button — appears after answering */}
            {selected && (
                <Pressable
                    style={({ pressed }) => [styles.nextBtn, pressed && styles.nextPressed]}
                    onPress={generateQuestion}
                >
                    <Text style={styles.nextText}>Next →</Text>
                </Pressable>
            )}

        </View>
    );
}

/* ──────────────────────────────────────────────
 * STYLES
 * ────────────────────────────────────────────── */
const createStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface, padding: 24 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: colors.textMuted, fontSize: 15 },

    // Score progress
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    progressText: { color: colors.textMutedDark, fontSize: 13, fontWeight: '600', minWidth: 110 },
    progressBar: { flex: 1, height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },

    // Feedback banner
    feedback: { padding: 12, borderRadius: 10, marginBottom: 20 },
    feedbackCorrect: { backgroundColor: colors.successBg },  // Light green
    feedbackWrong: { backgroundColor: '#fef2f2' },    // Light red
    feedbackText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },

    // Question area
    questionArea: { alignItems: 'center', paddingVertical: 32 },
    questionLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    questionWord: { fontSize: 34, fontWeight: '700', color: colors.text, textAlign: 'center' },

    // Answer options grid
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    optionsMobile: { flexDirection: 'column' },          // Stack on small screens
    optBtn: { flex: 1, minWidth: '40%', padding: 16, borderRadius: 12, borderWidth: 1.5 },
    optDefault: { backgroundColor: colors.background, borderColor: colors.border },
    optCorrect: { backgroundColor: colors.successBg, borderColor: '#22c55e' },    // Green
    optWrong: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },      // Red
    optPressed: { backgroundColor: colors.surfaceAlt },
    optText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500', textAlign: 'center' },
    optTextCorrect: { color: colors.successText, fontWeight: '700' },

    // Next button
    nextBtn: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 32, backgroundColor: colors.primary, borderRadius: 12 },
    nextPressed: { opacity: 0.9 },
    nextText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
});
