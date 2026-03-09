# Expo SSR and Web Deployment

This skill outlines strategies for deploying Expo apps to the web, specifically
focusing on GitHub Pages and Static Site Generation (SSG).

## Key Considerations

- **Hydration**: Avoid using `window` or `document` during the initial render.
- **Supabase**: Use the appropriate polyfills for URL and fetch in an SSR
  environment.
- **Base URL**: When deploying to `username.github.io/repo/`, set the `baseUrl`
  in `app.json`.

## Deployment Flow

1. Export the project: `npx expo export --platform web`.
2. Configure the GitHub Actions workflow for static site hosting.
3. Ensure all links use `expo-router` for SPA navigation.
