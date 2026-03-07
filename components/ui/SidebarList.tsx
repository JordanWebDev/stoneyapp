import { useTheme } from '../../contexts/ThemeContext';
/**
 * SidebarList.tsx — The scrollable vocabulary list on the left side.
 *
 * Displays all vocabulary items in a numbered list.
 * Each row shows the Stoney word (bold) and English translation (gray).
 * Tapping a row selects it and highlights it in teal.
 * Includes a search bar that filters by Stoney word or English translation.
 *
 * Props:
 * - items:    Array of vocabulary objects (id, stoney, english, audioUrl)
 * - activeId: The currently selected item's ID
 * - onSelect: Callback function called when a row is tapped
 */

import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';

// Type definition for a single vocabulary item
// This same type is used across the app
export type PhraseItem = {
    id: string;        // Unique identifier from the database
    stoney: string;    // The word in Stoney Nakoda language
    english: string;   // The English translation
    audioUrl?: string; // Optional URL to an audio file for pronunciation
};

interface SidebarListProps {
    items: PhraseItem[];
    activeId?: string;
    onSelect: (id: string) => void;
}

export default function SidebarList({ items, activeId, onSelect }: SidebarListProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Search bar state — stores the user's current search text
    const [searchQuery, setSearchQuery] = useState('');

    // Filter items based on search query (searches both Stoney and English)
    // useMemo prevents re-filtering on every render — only runs when items or query change
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items; // No search = show all items
        const q = searchQuery.toLowerCase();
        return items.filter(
            (item) =>
                item.stoney.toLowerCase().includes(q) ||
                item.english.toLowerCase().includes(q)
        );
    }, [items, searchQuery]);

    // This function renders each row in the list
    const renderItem = ({ item, index }: { item: PhraseItem; index: number }) => {
        const isActive = item.id === activeId; // Is this the selected item?

        return (
            <Pressable
                style={({ pressed }) => [
                    styles.row,
                    isActive && styles.rowActive,         // Highlight if selected
                    pressed && !isActive && styles.rowPressed, // Dim when pressed
                ]}
                onPress={() => onSelect(item.id)}       // Tell parent which item was tapped
            >
                {/* Row number (1, 2, 3...) */}
                <Text style={styles.rowIndex}>{index + 1}</Text>

                {/* Word and translation */}
                <View style={styles.rowContent}>
                    <Text style={[styles.rowStoney, isActive && styles.rowTextActive]} numberOfLines={1}>
                        {item.stoney}
                    </Text>
                    <Text style={[styles.rowEnglish, isActive && styles.rowEnglishActive]} numberOfLines={1}>
                        {item.english}
                    </Text>
                </View>

                {/* Arrow indicator */}
                <Text style={styles.rowArrow}>›</Text>
            </Pressable>
        );
    };

    return (
        <View style={styles.sidebar}>
            {/* Section title */}
            <Text style={styles.sidebarTitle}>Vocabulary</Text>

            {/* Search bar */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Stoney or English..."
                    placeholderTextColor="#a8a29e"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {/* Clear button — only shown when there's text */}
                {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                        <Text style={styles.clearText}>✕</Text>
                    </Pressable>
                )}
            </View>

            {/* Results count when searching */}
            {searchQuery.trim().length > 0 && (
                <Text style={styles.resultsCount}>
                    {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
                </Text>
            )}

            {/* Scrollable list — FlatList only renders visible items for performance */}
            {/* Performance optimizations for 9,904+ items: */}
            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                initialNumToRender={20}         // Only render first 20 rows at start
                maxToRenderPerBatch={20}         // Process 20 rows per batch
                windowSize={5}                   // Keep 5 screens of content in memory
                removeClippedSubviews={true}     // Unmount off-screen items
                getItemLayout={(_, index) => ({  // Enable instant scroll jumps
                    length: 57,                  // Approximate row height
                    offset: 57 * index,
                    index,
                })}
            />
        </View>
    );
}

/* ──────────────────────────────────────────────
 * STYLES
 * ────────────────────────────────────────────── */
const createStyles = (colors: any) => StyleSheet.create({
    sidebar: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    sidebarTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMuted,               // Muted gray label
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },

    // Search bar container
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
        marginBottom: 8,
        backgroundColor: colors.background,     // Light gray background
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 10,
        height: 40,
    },
    searchIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: colors.textDark,
        paddingVertical: 0,            // Remove default padding on Android
    } as any,
    clearBtn: {
        padding: 4,
    },
    clearText: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: '600',
    },
    resultsCount: {
        fontSize: 12,
        color: colors.textMuted,
        paddingHorizontal: 16,
        paddingBottom: 4,
    },

    listContent: {
        paddingBottom: 16,
    },

    // Each row in the list
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceAlt,   // Very light separator line
    },
    rowActive: {
        backgroundColor: colors.primaryBg,     // Light teal background when selected
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,     // Teal left border accent
    },
    rowPressed: {
        backgroundColor: colors.background,     // Subtle press feedback
    },

    // Row number (1, 2, 3...)
    rowIndex: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.borderDark,
        width: 20,
        textAlign: 'center',
    },

    // Text area inside the row
    rowContent: {
        flex: 1,                       // Take up remaining space
        gap: 2,
    },
    rowStoney: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textDark,              // Dark text for the Stoney word
    },
    rowTextActive: {
        color: colors.primary,              // Teal when active
    },
    rowEnglish: {
        fontSize: 13,
        color: colors.textMuted,              // Gray for the English translation
    },
    rowEnglishActive: {
        color: colors.primaryLight,              // Lighter teal when active
    },

    // Arrow on the right side
    rowArrow: {
        fontSize: 18,
        color: colors.borderDark,
        fontWeight: '300',
    },
});
