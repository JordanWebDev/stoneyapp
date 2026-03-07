import { useTheme } from '../../contexts/ThemeContext';
/**
 * CrosswordGame.tsx — A randomized, infinitely replayable crossword puzzle for Stoney Nakoda.
 *
 * Adheres to the Stoney Word Games Engineering Skill:
 * - Robust text normalization for diacritics
 * - Positive, enlightening English hints (dynamic generation)
 * - Custom on-screen keyboard with tactile feedback
 * - Responsive grid interface
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    useWindowDimensions,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { playClickSound, playCompleteSound } from './SoundEffects';

/**
 *
 * @param str
 */
export const normalizeStoney = (str: string) => {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'], // No Enter key needed for crossword (auto-advances)
];

type WordleGameProps = {
    items: { id: string; stoney: string; english: string; category_id?: string | null }[];
};

/**
 * Represents a word successfully placed on the crossword grid.
 */
type PlacedWord = {
    id: string;
    stoneyClean: string; // Normalized string (no accents) used for matching logic
    stoneyDisplay: string; // Original string with Stoney accents for displaying answers
    english: string;
    hint: string; // The dynamically generated positive English hint
    row: number; // The starting row index
    col: number; // The starting column index
    isHorizontal: boolean; // Orientation of the word
    number: number; // The clue number displayed on the board (e.g. "1 Across")
};

/**
 * Represents a single square cell on the crossword board.
 */
type GridCell = {
    letter: string; // The correct normalized letter required for this cell
    wordIds: string[]; // IDs of all words that intersect at this cell (max 2)
    userLetter: string; // The letter currently typed by the user
    isLocked: boolean; // Whether the cell is locked (currently unused, for future feature)
    number?: number; // Clue number to display in upper-left corner of the cell
    row: number;
    col: number;
};

// Helper to create positive hints dynamically
/**
 *
 * @param english
 */
const createPositiveHint = (english: string) => {
    const templates = [
        'To find your path, think about [word].',
        'The elders say that [word] brings clarity.',
        'Embrace the spirit of [word] today.',
        'A peaceful mind understands [word].',
        'Your journey is guided by [word].',
        'Appreciate the beauty in [word].',
        'Strength comes from knowing [word].',
        'The sky reflects the truth of [word].',
        'Wisdom grows when you reflect on [word].',
        'Joy can be found in [word].',
    ];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const cleanEnglish = english
        .replace(/^to be /, 'being ')
        .replace(/^to /, 'the act of ')
        .toLowerCase();
    return template.replace('[word]', `"${cleanEnglish}"`);
};

/**
 *
 * @param root0
 * @param root0.items
 */
export default function CrosswordGame({ items }: WordleGameProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { width } = useWindowDimensions();
    const isMobile = width < 600;

    // Filter valid words (single word, 3-8 letters, only letters)
    const validWords = useMemo(() => {
        return items.filter((item) => {
            const word = item.stoney.trim();
            if (word.includes(' ') || word.includes('-')) return false;
            // Shorter window for crossword to allow more intersections
            if (word.length < 3 || word.length > 8) return false;
            const clean = normalizeStoney(word);
            return /^[a-z]+$/.test(clean);
        });
    }, [items]);

    // Game State
    const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
    const [gridMap, setGridMap] = useState<Map<string, GridCell>>(new Map());
    const [gameState, setGameState] = useState<'loading' | 'playing' | 'won'>('loading');

    // UI State
    const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
    const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');
    const [gridSize, setGridSize] = useState({ minR: 0, maxR: 0, minC: 0, maxC: 0 });

    const generateCrossword = useCallback(() => {
        if (validWords.length < 10) return;
        setGameState('loading');

        // Simple fast generator: pick 1 random word, then try to attach others.
        // For performance on mobile UI thread, limit attempts.
        setTimeout(() => {
            let attempts = 0;
            let success = false;

            while (attempts < 10 && !success) {
                const wordsList = [...validWords].sort(() => 0.5 - Math.random());
                const placed: PlacedWord[] = [];
                const board = new Map<string, string>(); // 'r,c' -> letter

                // Place first word horizontally at 0,0
                const w1 = wordsList.pop()!;
                const w1Clean = normalizeStoney(w1.stoney);
                placed.push({
                    id: w1.id,
                    stoneyClean: w1Clean,
                    stoneyDisplay: w1.stoney,
                    english: w1.english,
                    hint: createPositiveHint(w1.english),
                    row: 0,
                    col: 0,
                    isHorizontal: true,
                    number: 1,
                });
                for (let i = 0; i < w1Clean.length; i++) board.set(`0,${i}`, w1Clean[i]);

                let nextNumber = 2;
                const targetWordCount = Math.floor(Math.random() * 2) + 4; // 4 to 5 words

                for (const w of wordsList) {
                    if (placed.length >= targetWordCount) break;

                    const cleanWord = normalizeStoney(w.stoney);
                    let placedThisWord = false;

                    // Shuffle coordinates to prevent building in only one direction
                    const testCoords = Array.from(board.keys()).sort(() => 0.5 - Math.random());

                    for (const coord of testCoords) {
                        if (placedThisWord) break;
                        const [r, c] = coord.split(',').map(Number);
                        const intersectionLetter = board.get(coord)!;

                        // Find this intersection letter in the new word we want to place
                        const splitIdx = cleanWord.indexOf(intersectionLetter);
                        if (splitIdx !== -1) {
                            // The new word shares the letter!
                            // Try placing it perpendicular to the existing word
                            const isHoriz = placed.some(
                                (p) =>
                                    p.isHorizontal &&
                                    p.row === r &&
                                    c >= p.col &&
                                    c < p.col + p.stoneyClean.length
                            );
                            const tryHorizontal = !isHoriz;

                            // Calculate the starting coordinates for the new word so that
                            // its shared letter lands exactly on the intersection point
                            const startR = tryHorizontal ? r : r - splitIdx;
                            const startC = tryHorizontal ? c - splitIdx : c;

                            // Step 2: Ensure the placement is valid
                            let isValid = true;
                            for (let i = 0; i < cleanWord.length; i++) {
                                const tr = tryHorizontal ? startR : startR + i;
                                const tc = tryHorizontal ? startC + i : startC;
                                const tCoord = `${tr},${tc}`;

                                // Conflict check: If a cell is already occupied, it MUST be the exact same letter
                                if (board.has(tCoord) && board.get(tCoord) !== cleanWord[i])
                                    isValid = false;

                                // Adjacency check: Keep parallel words from accidentally gluing together
                                if (!board.has(tCoord)) {
                                    if (tryHorizontal) {
                                        // Check directly above and below the horizontal word
                                        if (
                                            board.has(`${tr - 1},${tc}`) ||
                                            board.has(`${tr + 1},${tc}`)
                                        )
                                            isValid = false;
                                        // Check one space before the start and after the end
                                        if (i === 0 && board.has(`${tr},${tc - 1}`))
                                            isValid = false;
                                        if (
                                            i === cleanWord.length - 1 &&
                                            board.has(`${tr},${tc + 1}`)
                                        )
                                            isValid = false;
                                    } else {
                                        // Check directly left and right of the vertical word
                                        if (
                                            board.has(`${tr},${tc - 1}`) ||
                                            board.has(`${tr},${tc + 1}`)
                                        )
                                            isValid = false;
                                        // Check one space above the start and below the end
                                        if (i === 0 && board.has(`${tr - 1},${tc}`))
                                            isValid = false;
                                        if (
                                            i === cleanWord.length - 1 &&
                                            board.has(`${tr + 1},${tc}`)
                                        )
                                            isValid = false;
                                    }
                                }
                            }

                            if (isValid) {
                                placed.push({
                                    id: w.id,
                                    stoneyClean: cleanWord,
                                    stoneyDisplay: w.stoney,
                                    english: w.english,
                                    hint: createPositiveHint(w.english),
                                    row: startR,
                                    col: startC,
                                    isHorizontal: tryHorizontal,
                                    number: nextNumber++,
                                });
                                for (let i = 0; i < cleanWord.length; i++) {
                                    const tr = tryHorizontal ? startR : startR + i;
                                    const tc = tryHorizontal ? startC + i : startC;
                                    board.set(`${tr},${tc}`, cleanWord[i]);
                                }
                                placedThisWord = true;
                            }
                        }
                    }
                }

                if (placed.length >= 3) {
                    success = true;
                    const newGridMap = new Map<string, GridCell>();
                    let minR = 0,
                        maxR = 0,
                        minC = 0,
                        maxC = 0;

                    placed.forEach((p) => {
                        for (let i = 0; i < p.stoneyClean.length; i++) {
                            const r = p.isHorizontal ? p.row : p.row + i;
                            const c = p.isHorizontal ? p.col + i : p.col;
                            const coord = `${r},${c}`;

                            if (r < minR) minR = r;
                            if (r > maxR) maxR = r;
                            if (c < minC) minC = c;
                            if (c > maxC) maxC = c;

                            if (!newGridMap.has(coord)) {
                                newGridMap.set(coord, {
                                    letter: p.stoneyClean[i],
                                    wordIds: [p.id],
                                    userLetter: '',
                                    isLocked: false,
                                    row: r,
                                    col: c,
                                });
                            } else {
                                newGridMap.get(coord)!.wordIds.push(p.id);
                            }

                            // add number
                            if (i === 0) {
                                newGridMap.get(coord)!.number = p.number;
                            }
                        }
                    });

                    setPlacedWords(placed);
                    setGridMap(newGridMap);
                    setGridSize({ minR, maxR, minC, maxC });

                    // Auto-select first cell
                    // Find top-left most word
                    const firstWord = placed.find((p) => p.number === 1)!;
                    setSelectedCell({ r: firstWord.row, c: firstWord.col });
                    setDirection(firstWord.isHorizontal ? 'horizontal' : 'vertical');

                    setGameState('playing');
                }
                attempts++;
            }

            // Fallback if gen failed
            if (!success) setGameState('playing'); // handles empty state gracefully
        }, 50); // Small timeout to allow UI update to loading state
    }, [validWords]);

    // Initial Gen
    useEffect(() => {
        if (validWords.length > 0 && placedWords.length === 0 && gameState === 'loading') {
            generateCrossword();
        }
    }, [validWords, placedWords.length, gameState, generateCrossword]);

    // Keyboard Handler
    const handleKeyPress = useCallback(
        (key: string) => {
            if (gameState !== 'playing' || !selectedCell) return;
            playClickSound();

            const coord = `${selectedCell.r},${selectedCell.c}`;
            const cell = gridMap.get(coord);

            if (!cell) return;

            if (key === '⌫') {
                // Backspace logic: clear current, move backward
                if (cell.userLetter === '') {
                    // move backward first, then clear
                    const prevR = direction === 'vertical' ? selectedCell.r - 1 : selectedCell.r;
                    const prevC = direction === 'horizontal' ? selectedCell.c - 1 : selectedCell.c;
                    const prevCoord = `${prevR},${prevC}`;
                    const prevCell = gridMap.get(prevCoord);

                    if (prevCell && prevCell.wordIds.some((wid) => cell.wordIds.includes(wid))) {
                        if (!prevCell.isLocked) {
                            const newMap = new Map(gridMap);
                            newMap.set(prevCoord, { ...prevCell, userLetter: '' });
                            setGridMap(newMap);
                        }
                        setSelectedCell({ r: prevR, c: prevC });
                    }
                } else {
                    // Clear current
                    if (!cell.isLocked) {
                        const newMap = new Map(gridMap);
                        newMap.set(coord, { ...cell, userLetter: '' });
                        setGridMap(newMap);
                    }
                }
            } else {
                // Type letter
                if (!cell.isLocked) {
                    const newMap = new Map(gridMap);
                    newMap.set(coord, { ...cell, userLetter: key.toLowerCase() });

                    // Check if word is complete and correct
                    const updatedMap = newMap;
                    let wonGame = false;

                    // Simple auto-check completion logic deferred to a useEffect,
                    // but we can just do a full scan here.
                    let anyChanges = false;
                    placedWords.forEach((word) => {
                        let wordCorrect = true;
                        const cellsToLock: string[] = [];
                        for (let i = 0; i < word.stoneyClean.length; i++) {
                            const r = word.isHorizontal ? word.row : word.row + i;
                            const c = word.isHorizontal ? word.col + i : word.col;
                            const tCoord = `${r},${c}`;
                            const tCell = newMap.get(tCoord)!;
                            cellsToLock.push(tCoord);
                            if (tCell.userLetter !== tCell.letter) wordCorrect = false;
                        }

                        if (wordCorrect) {
                            cellsToLock.forEach((tc) => {
                                const cCell = newMap.get(tc)!;
                                if (!cCell.isLocked) {
                                    anyChanges = true;
                                    newMap.set(tc, { ...cCell, isLocked: true });
                                }
                            });
                        }
                    });

                    // Win detect
                    let allLocked = true;
                    Array.from(newMap.values()).forEach((c) => {
                        if (!c.isLocked) allLocked = false;
                    });

                    if (allLocked && anyChanges) {
                        // won just now
                        wonGame = true;
                    }

                    setGridMap(newMap);

                    // Auto advance
                    if (!wonGame) {
                        const nextR =
                            direction === 'vertical' ? selectedCell.r + 1 : selectedCell.r;
                        const nextC =
                            direction === 'horizontal' ? selectedCell.c + 1 : selectedCell.c;
                        const nextCoord = `${nextR},${nextC}`;
                        const nextCell = newMap.get(nextCoord);

                        if (
                            nextCell &&
                            nextCell.wordIds.some((wid) => cell.wordIds.includes(wid))
                        ) {
                            setSelectedCell({ r: nextR, c: nextC });
                        }
                    } else {
                        setGameState('won');
                        playCompleteSound();
                    }
                } else {
                    // Cell was locked, skip forward
                    const nextR = direction === 'vertical' ? selectedCell.r + 1 : selectedCell.r;
                    const nextC = direction === 'horizontal' ? selectedCell.c + 1 : selectedCell.c;
                    const nextCoord = `${nextR},${nextC}`;
                    const nextCell = gridMap.get(nextCoord);

                    if (nextCell && nextCell.wordIds.some((wid) => cell.wordIds.includes(wid))) {
                        setSelectedCell({ r: nextR, c: nextC });
                    }
                }
            }
        },
        [gameState, selectedCell, direction, gridMap, placedWords]
    );

    // Cell Click
    /**
     *
     * @param r
     * @param c
     */
    const handleCellClick = (r: number, c: number) => {
        const cell = gridMap.get(`${r},${c}`);
        if (!cell) return;

        playClickSound();

        // If clicking same cell, toggle direction if intersection
        if (selectedCell?.r === r && selectedCell?.c === c) {
            // Check if cell has both horizontal and vertical words
            const isHoriz = placedWords.some((p) => p.isHorizontal && cell.wordIds.includes(p.id));
            const isVert = placedWords.some((p) => !p.isHorizontal && cell.wordIds.includes(p.id));
            if (isHoriz && isVert) {
                setDirection(direction === 'horizontal' ? 'vertical' : 'horizontal');
            }
        } else {
            setSelectedCell({ r, c });
            // Try to set correct direction based on words at this cell
            const isHoriz = placedWords.some((p) => p.isHorizontal && cell.wordIds.includes(p.id));
            const isVert = placedWords.some((p) => !p.isHorizontal && cell.wordIds.includes(p.id));

            if (isHoriz && !isVert) setDirection('horizontal');
            else if (isVert && !isHoriz) setDirection('vertical');
            // if both, keep current direction
        }
    };

    if (gameState === 'loading' || placedWords.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#ea580c" />
                <Text style={{ marginTop: 12, color: colors.textMutedDark }}>
                    Generating puzzle...
                </Text>
            </View>
        );
    }

    // Determine current clue
    let currentWord: PlacedWord | undefined;
    if (selectedCell) {
        const cell = gridMap.get(`${selectedCell.r},${selectedCell.c}`);
        if (cell) {
            currentWord = placedWords.find(
                (p) =>
                    p.isHorizontal === (direction === 'horizontal') && cell.wordIds.includes(p.id)
            );
            if (!currentWord) {
                currentWord = placedWords.find((p) => cell.wordIds.includes(p.id)); // fallback to other direction
            }
        }
    }

    // Grid rendering logic
    const { minR, maxR, minC, maxC } = gridSize;
    const gridCols = maxC - minC + 1;

    // Dynamic cell size based on screen width
    const maxWidth = Math.min(width - 4, 600); // 2px padding each side
    const maxCellSize = 44;
    const minCellSize = 14; // Allow very small cells on long crosswords on mobile
    let cellSize = Math.floor(maxWidth / gridCols);
    if (cellSize > maxCellSize) cellSize = maxCellSize;
    if (cellSize < minCellSize) cellSize = minCellSize;

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Stoney Crossword</Text>

                {gameState === 'won' && (
                    <Pressable style={styles.newGameBtn} onPress={generateCrossword}>
                        <Text style={styles.newGameLabel}>Play Again</Text>
                    </Pressable>
                )}
            </View>

            {/* Hint Box (Dynamic based on selected word) */}
            <View style={[styles.hintBox, gameState === 'won' ? styles.hintBoxWon : {}]}>
                {gameState === 'won' ? (
                    <>
                        <Text style={styles.hintMessage}>You solved the crossword! 🎉</Text>
                        <Text style={styles.hintCategory}>Great job exercising your mind.</Text>
                    </>
                ) : currentWord ? (
                    <>
                        <Text style={styles.clueNumber}>
                            {currentWord.number} {currentWord.isHorizontal ? 'Across' : 'Down'}
                        </Text>
                        <Text style={styles.hintMessage}>{currentWord.hint}</Text>
                        <Text style={styles.hintCategory}>
                            (Needs {currentWord.stoneyClean.length} letters)
                        </Text>
                    </>
                ) : (
                    <Text style={styles.hintMessage}>Tap a square to see the hint.</Text>
                )}
            </View>

            {/* Game Grid */}
            <View style={styles.gridOuter}>
                {Array.from({ length: maxR - minR + 1 }).map((_, rIdx) => {
                    const r = minR + rIdx;
                    return (
                        <View key={`r${r}`} style={styles.row}>
                            {Array.from({ length: maxC - minC + 1 }).map((_, cIdx) => {
                                const c = minC + cIdx;
                                const coord = `${r},${c}`;
                                const cell = gridMap.get(coord);

                                if (!cell) {
                                    return (
                                        <View
                                            key={`c${c}`}
                                            style={[
                                                styles.emptyBox,
                                                { width: cellSize, height: cellSize },
                                            ]}
                                        />
                                    );
                                }

                                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                                const isHighlight =
                                    currentWord && cell.wordIds.includes(currentWord.id);

                                let bg = colors.surface;
                                if (isSelected)
                                    bg = '#ffda00'; // NYT yellow
                                else if (isHighlight) bg = '#a7d8ff'; // NYT light blue

                                return (
                                    <Pressable
                                        key={`c${c}`}
                                        style={[
                                            styles.box,
                                            {
                                                width: cellSize,
                                                height: cellSize,
                                                backgroundColor: bg,
                                            },
                                            cell.isLocked ? styles.boxLocked : {},
                                        ]}
                                        onPress={() => handleCellClick(r, c)}
                                    >
                                        {cell.number && (
                                            <Text style={styles.boxNumber}>{cell.number}</Text>
                                        )}
                                        <Text
                                            style={[
                                                styles.boxText,
                                                cell.isLocked ? styles.boxTextLocked : {},
                                                { fontSize: cellSize * 0.55 },
                                            ]}
                                        >
                                            {(cell.userLetter || '').toUpperCase()}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    );
                })}
            </View>

            {/* All Clues List */}
            {gameState === 'playing' && (
                <View
                    style={[
                        styles.allCluesContainer,
                        isMobile ? { flexDirection: 'column' } : { flexDirection: 'row' },
                    ]}
                >
                    <View style={styles.clueColumn}>
                        <Text style={styles.clueColumnHeader}>Across</Text>
                        {placedWords
                            .filter((p) => p.isHorizontal)
                            .sort((a, b) => a.number - b.number)
                            .map((p) => (
                                <Pressable key={p.id} onPress={() => handleCellClick(p.row, p.col)}>
                                    <Text
                                        style={[
                                            styles.clueItem,
                                            currentWord?.id === p.id && styles.clueItemActive,
                                        ]}
                                    >
                                        <Text style={styles.clueItemNumber}>{p.number}.</Text>{' '}
                                        {p.hint}
                                    </Text>
                                </Pressable>
                            ))}
                    </View>
                    <View style={styles.clueColumn}>
                        <Text style={styles.clueColumnHeader}>Down</Text>
                        {placedWords
                            .filter((p) => !p.isHorizontal)
                            .sort((a, b) => a.number - b.number)
                            .map((p) => (
                                <Pressable key={p.id} onPress={() => handleCellClick(p.row, p.col)}>
                                    <Text
                                        style={[
                                            styles.clueItem,
                                            currentWord?.id === p.id && styles.clueItemActive,
                                        ]}
                                    >
                                        <Text style={styles.clueItemNumber}>{p.number}.</Text>{' '}
                                        {p.hint}
                                    </Text>
                                </Pressable>
                            ))}
                    </View>
                </View>
            )}

            {/* Keyboard */}
            {gameState === 'playing' && (
                <View style={styles.keyboard}>
                    {KEYBOARD_ROWS.map((row, rIdx) => (
                        <View key={rIdx} style={styles.keyRow}>
                            {row.map((key) => {
                                let keyStyle: any = styles.key;
                                if (key === '⌫') {
                                    keyStyle = { ...keyStyle, paddingHorizontal: 16, minWidth: 48 };
                                }
                                return (
                                    <Pressable
                                        key={key}
                                        style={({ pressed }) => [
                                            keyStyle,
                                            pressed && { opacity: 0.7 },
                                        ]}
                                        onPress={() => handleKeyPress(key)}
                                    >
                                        <Text style={styles.keyText}>{key}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    ))}
                </View>
            )}

            {/* Answer Key (dev purposes mostly, could be hidden) */}
            {gameState === 'won' && (
                <View style={styles.answersList}>
                    <Text style={styles.answersHeader}>Answers:</Text>
                    {placedWords
                        .sort((a, b) => a.number - b.number)
                        .map((p) => (
                            <Text key={p.id} style={styles.answerText}>
                                <Text style={{ fontWeight: 'bold' }}>
                                    {p.number} {p.isHorizontal ? 'Across' : 'Down'}:
                                </Text>{' '}
                                {p.stoneyDisplay}{' '}
                                <Text style={{ color: colors.textMutedDark, fontStyle: 'italic' }}>
                                    ({p.english})
                                </Text>
                            </Text>
                        ))}
                </View>
            )}
        </ScrollView>
    );
}

/**
 *
 * @param colors
 */
const createStyles = (colors: any) =>
    StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        scrollContent: {
            paddingBottom: 40,
            alignItems: 'center',
            width: '100%',
            backgroundColor: '#fcfbfa',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingVertical: 12,
            paddingHorizontal: 16,
            maxWidth: 600,
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#000',
            fontFamily: 'Georgia, serif',
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        newGameBtn: {
            backgroundColor: '#000',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 0,
        },
        newGameLabel: {
            color: colors.surface,
            fontWeight: 'bold',
            fontSize: 12,
            fontFamily: 'Courier New, monospace',
            textTransform: 'uppercase',
        },
        hintBox: {
            backgroundColor: colors.surface,
            padding: 16,
            marginBottom: 24,
            width: '90%',
            maxWidth: 600,
            borderWidth: 2,
            borderColor: '#000',
            minHeight: 90,
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
        },
        hintBoxWon: { backgroundColor: '#f8f8f8', borderColor: '#000', alignItems: 'center' },
        clueNumber: {
            fontSize: 14,
            fontWeight: '700',
            color: '#000',
            marginBottom: 6,
            textTransform: 'uppercase',
            fontFamily: '"Courier New", Courier, monospace',
        },
        hintMessage: {
            fontSize: 18,
            fontStyle: 'italic',
            color: '#111',
            marginBottom: 8,
            fontFamily: 'Georgia, serif',
        },
        hintCategory: { fontSize: 13, color: '#444', fontFamily: 'Georgia, serif' },
        gridOuter: {
            marginBottom: 32,
            padding: 2,
            backgroundColor: '#000',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#000',
        },
        row: { flexDirection: 'row' },
        box: {
            borderWidth: 0.5,
            borderColor: '#000',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
        },
        emptyBox: { backgroundColor: '#000' },
        boxLocked: {},
        boxNumber: {
            position: 'absolute',
            top: 2,
            left: 3,
            fontSize: 11,
            fontWeight: 'bold',
            color: '#000',
            fontFamily: 'Arial, sans-serif',
        },
        boxText: { fontWeight: 'bold', color: '#000', fontFamily: 'Arial, sans-serif' },
        boxTextLocked: { color: '#000' },
        keyboard: { width: '100%', maxWidth: 600, gap: 8, alignItems: 'center' },
        keyRow: { flexDirection: 'row', gap: 6 },
        key: {
            backgroundColor: colors.surface,
            paddingVertical: 14,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 0,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 0,
        },
        keyText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#000',
            fontFamily: 'Arial, sans-serif',
        },
        allCluesContainer: {
            width: '90%',
            maxWidth: 800,
            gap: 32,
            marginTop: 16,
            marginBottom: 32,
            paddingHorizontal: 8,
        },
        clueColumn: { flex: 1 },
        clueColumnHeader: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#000',
            marginBottom: 16,
            borderBottomWidth: 3,
            borderBottomColor: '#000',
            paddingBottom: 6,
            fontFamily: 'Georgia, serif',
            textTransform: 'uppercase',
        },
        clueItem: {
            fontSize: 15,
            color: '#111',
            marginBottom: 10,
            lineHeight: 22,
            padding: 4,
            fontFamily: 'Georgia, serif',
        },
        clueItemActive: { fontWeight: 'bold', color: '#000', backgroundColor: '#a7d8ff' },
        clueItemNumber: { fontWeight: 'bold', color: '#000' },
        answersList: {
            width: '90%',
            maxWidth: 600,
            marginTop: 24,
            padding: 16,
            backgroundColor: colors.surface,
            borderWidth: 2,
            borderColor: '#000',
        },
        answersHeader: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 12,
            color: '#000',
            fontFamily: 'Georgia, serif',
        },
        answerText: { fontSize: 15, color: '#000', marginBottom: 6, fontFamily: 'Georgia, serif' },
    });
