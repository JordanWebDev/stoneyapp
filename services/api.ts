import { supabase } from '../lib/supabase';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
/**
 * Represents a learning category (e.g., "Animals", "Colors").
 */
export type Category = {
    id: string;
    name: string;
};

/**
 * Represents a single vocabulary entry.
 * 'stoney' is the native word, 'english' is the translation.
 */
export type PhraseItem = {
    id: string;
    stoney: string;
    english: string;
    audioUrl?: string;
    category_id?: string;
};

/**
 * Represents user feedback submitted via the Feedback page.
 */
export type FeedbackItem = {
    id: string;
    user_name: string;
    category: string;
    message: string;
    created_at: string;
};

// ----------------------------------------------------------------------------
// API Services
// ----------------------------------------------------------------------------

/**
 * Fetches all lesson categories from the database.
 * We order by name to ensure consistent UI display.
 */
export async function getCategories(): Promise<Category[]> {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('id, name')
            .order('name');

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching categories:', err);
        return [];
    }
}

/**
 * Fetches vocabulary from Supabase with support for large datasets.
 * 
 * JUNIOR DEV NOTE: Supabase (and many APIs) has a limit on how many rows 
 * it returns in one go (usually 1000). To get all 8,000+ words, we use 
 * a 'Pagination' loop. We fetch rows in batches (0-999, 1000-1999, etc.) 
 * until the database says there are no more.
 * 
 * @param categoryId Optional category ID to filter results.
 */
export async function getVocabulary(categoryId: string | null = null): Promise<PhraseItem[]> {
    try {
        const PAGE_SIZE = 1000;
        let allData: any[] = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
            // Calculate the range for this batch
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = supabase
                .from('vocabulary')
                .select('*')
                .order('id', { ascending: true })
                .range(from, to);

            // Apply filter if a category is selected
            if (categoryId) {
                query = query.eq('category_id', categoryId);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (data && data.length > 0) {
                allData = [...allData, ...data];
                // If we got exactly PAGE_SIZE, there's likely more data to fetch
                hasMore = data.length === PAGE_SIZE;
                page++;
            } else {
                hasMore = false;
            }
        }

        /**
         * DATA MAPPING:
         * We convert the database column names (snake_case) to our 
         * UI-friendly property names (camelCase) here. This keeps the 
         * rest of our app code clean and decoupled from DB naming.
         */
        return allData.map((row: any) => ({
            id: row.id,
            stoney: row.native_word,
            english: row.translation,
            audioUrl: row.audio_url,
            category_id: row.category_id,
        }));
    } catch (err) {
        console.error('Error fetching vocabulary:', err);
        return [];
    }
}

/**
 * Fetches all user feedback, showing the newest first.
 */
export async function getFeedback(): Promise<FeedbackItem[]> {
    try {
        const { data, error } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching feedback:', err);
        return [];
    }
}

/**
 * Adds a new vocabulary item.
 * 
 * JUNIOR DEV NOTE: This function handles two steps:
 * 1. If an audio file is picked, we upload it to Supabase 'Storage' first.
 * 2. We then save the record to the 'Database' table, including the URL 
 *    of the uploaded audio file.
 */
export async function addVocabulary(
    nativeWord: string,
    translation: string,
    categoryId: string | null = null,
    audioFile: any = null
): Promise<void> {
    let audioUrl = null;

    // 1. Upload audio file if provided
    if (audioFile && !audioFile.canceled && audioFile.assets?.[0]) {
        const asset = audioFile.assets[0];

        // Convert the local file URI to a binary 'Blob' that Supabase can upload
        const res = await fetch(asset.uri);
        const blob = await res.blob();

        // Create a unique filename to prevent overwriting existing files
        const fileName = `admin_${Date.now()}_${asset.name}`;

        const { error: uploadError } = await supabase.storage.from('audio').upload(fileName, blob, {
            contentType: asset.mimeType || 'audio/wav',
        });

        if (uploadError) throw uploadError;

        // Get the public URL so users can stream the audio back later
        const { data: publicUrlData } = supabase.storage.from('audio').getPublicUrl(fileName);
        audioUrl = publicUrlData.publicUrl;
    }

    // 2. Insert the final record into the 'vocabulary' table
    const { error: insertError } = await supabase.from('vocabulary').insert([
        {
            native_word: nativeWord,
            translation,
            category_id: categoryId,
            audio_url: audioUrl,
        },
    ]);

    if (insertError) throw insertError;
}

/**
 * Deletes a vocabulary item.
 * @param id The ID of the database row to delete.
 */
export async function deleteVocabulary(id: string): Promise<void> {
    const { error } = await supabase.from('vocabulary').delete().eq('id', id);
    if (error) throw error;
}
