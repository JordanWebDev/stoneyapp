import { supabase } from '../lib/supabase';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
/**
 *
 */
export type Category = {
    id: string;
    name: string;
};

/**
 *
 */
export type PhraseItem = {
    id: string;
    stoney: string;
    english: string;
    audioUrl?: string;
    category_id?: string;
};

/**
 *
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
 * Fetches all lesson categories from the database, ordered alphabetically by name.
 */
export async function getCategories(): Promise<Category[]> {
    try {
        const { data, error } = await supabase.from('categories').select('id, name').order('name');
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching categories:', err);
        return [];
    }
}

/**
 * Fetches ALL vocabulary from Supabase using pagination.
 * Supabase returns a max of 1000 rows per request, so this loops
 * in batches of 1000 until all records are loaded (~9,904 total records).
 * @param categoryId Optional category ID to filter the vocabulary by.
 */
export async function getVocabulary(categoryId: string | null = null): Promise<PhraseItem[]> {
    try {
        const PAGE_SIZE = 1000;
        let allData: any[] = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = supabase
                .from('vocabulary')
                .select('*')
                .order('id', { ascending: true })
                .range(from, to);

            if (categoryId) {
                query = query.eq('category_id', categoryId);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (data && data.length > 0) {
                allData = [...allData, ...data];
                hasMore = data.length === PAGE_SIZE;
                page++;
            } else {
                hasMore = false;
            }
        }

        // Format raw database records into the UI PhraseItem structure
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
 * Fetches all user feedback from the database.
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
 * Uploads a new vocabulary item to the database, optionally uploading an audio file to storage.
 * @param nativeWord The Stoney phrase
 * @param translation The English translation
 * @param categoryId Optional category ID
 * @param audioFile Optional audio file (from DocumentPicker)
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
        const res = await fetch(asset.uri);
        const blob = await res.blob();
        const fileName = `admin_${Date.now()}_${asset.name}`;

        const { error: uploadError } = await supabase.storage.from('audio').upload(fileName, blob, {
            contentType: asset.mimeType || 'audio/wav',
        });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('audio').getPublicUrl(fileName);
        audioUrl = publicUrlData.publicUrl;
    }

    // 2. Insert record into database
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
