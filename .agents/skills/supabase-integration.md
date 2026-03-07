---
name: Stoney Supabase Data Guide
description: Documentation on how the Stoney App interacts with Supabase, its schema, and how to query vocabulary.
---

# Supabase Integration Rules

The Stoney application relies on a Supabase backend to fetch dictionaries and categories. When writing data-fetching logic or expanding backend capabilities for the app, you **must use** the existing `lib/supabase.ts` client.

## Core Schema Structure

Based on `services/api.ts`, the database relies on two main tables:

1. **`categories`**
   - `id`: string (uuid)
   - `name`: string (e.g. "Animals", "Greetings")
   - `icon`: string (emoji icon corresponding to category)

2. **`vocabulary`**
   - `id`: string (uuid)
   - `stoney`: string (The Stoney Nakoda word)
   - `english`: string (The English translation)
   - `category_id`: string (Foreign key referring to `categories.id`)
   - `audio_url`: string (nullable, remote URL to the pronunciation track)
   - `stoney_alt`: string (nullable, alternate spellings)
   - `notes`: string (nullable, extra context)

## Guidelines for Fetching Data

- Utilize async/await patterns and gracefully handle loading states in the React UI.
- Use the typed interfaces `Category` and `PhraseItem` from `services/api.ts` when processing raw responses.
- Always include `.select()` for your specific queries to save bandwidth.

*Example query pattern:*

```ts
const { data, error } = await supabase
  .from('vocabulary')
  .select('id, stoney, english, audio_url')
  .eq('category_id', selectedCategoryId);
```
