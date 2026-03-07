---
description: How to run and develop the Stoney Language Learning App
---

# Stoney Language App Development Workflow

## Prerequisites

- Node.js 18+ installed
- npm installed
- Supabase project with vocabulary data ingested

## Environment Setup

1. Ensure `.env` file exists in `stoney-app/` with:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://rohyoxuszxrnylocolqu.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

## Running the Dev Server

// turbo

1. Navigate to the app directory and start the Expo dev server:

   ```bash
   cd "c:/Users/bigon/Desktop/New folder/stoney-app" && npx expo start --web
   ```

2. Open <http://localhost:8081> in a browser

## Data Ingestion

1. To re-ingest vocabulary from the Excel file:

   ```bash
   cd "c:/Users/bigon/Desktop/New folder" && node import_excel.js
   ```

   - Requires `SUPABASE_KEY` set to the `service_role` key in `.env`

## Project Structure

```
stoney-app/
├── app/
│   ├── _layout.tsx          # Root layout (Expo Router)
│   ├── index.tsx            # Main screen with tab navigation
│   └── admin/
│       ├── _layout.tsx      # Admin layout
│       └── index.tsx        # Admin dashboard (CRUD)
├── components/ui/
│   ├── Header.tsx           # App header bar
│   ├── ProgressNodes.tsx    # Level selection nodes
│   ├── SidebarList.tsx      # Vocabulary list sidebar
│   ├── LearningCard.tsx     # Main word display card
│   ├── ActionButtons.tsx    # Play/Record buttons
│   ├── SpriteMascot.tsx     # Animated character sprite
│   ├── QuizMode.tsx         # Translation quiz game
│   ├── FlashcardMode.tsx    # Flashcard study mode
│   ├── MatchingGame.tsx     # Memory matching game
│   └── CRTOverlay.tsx       # Retro TV scanline effects
├── lib/
│   └── supabase.ts          # Supabase client config
└── assets/
    ├── sprite_neutral.png   # Mascot - neutral face
    ├── sprite_happy.png     # Mascot - correct answer
    ├── sprite_sad.png       # Mascot - wrong answer
    └── sprite_thinking.png  # Mascot - thinking/quiz
```

## Adding New Features

1. Create new component in `components/ui/`
2. Import and wire it into `app/index.tsx` tab system
3. Use the cyberpunk theme colors:
   - Background: `#060d0d`, `#0a0f0f`, `#0f1a1a`
   - Teal accent: `#2dd4bf`, `#0d9488`, `#134e4a`
   - Red accent: `#dc2626`, `#7f1d1d`
   - Text: `#e8dcc8` (cream), `#5eead4` (teal)
   - Font: `monospace`

## Deployment

// turbo

1. Build for web: `npx expo export --platform web`
2. Deploy the `dist/` folder to Vercel or Netlify
