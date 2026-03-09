# Development Workflow for Stoney App

This workflow explains how to develop and run the Stoney Language app.

## Project Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

## Mobile Development

- To run on Android: `npx expo run:android`.
- To run on iOS: `npx expo run:ios`.

## Web Development

- To run in web mode: `npm run web`.
- To export for static hosting: `npx expo export --platform web`.

## Code Quality

- Run linting: `npm run lint`.
- Format code: `npm run format`.
- Validate Markdown: `npx markdownlint-cli "**/*.md"`.
