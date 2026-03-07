---
name: Expo Web Export & SSR Guide
description: Documentation on how to configure Expo Router for static web exports and handle SSR compatibility in React Native.
---

# Expo Web Export & SSR

When deploying an Expo Router application to static hosts like GitHub Pages, we must ensure the application builds statically and runs without browser globals during the Node.js rendering phase.

## 1. Web Output Configuration

In `app.json`, the web bundler must be explicitly set to `static` for GitHub pages to generate individual HTML files per route.

```json
{
  "expo": {
    "web": {
      "bundler": "metro",
      "output": "static"
    }
  }
}
```

## 2. Server-Side Rendering (SSR) Constraints

When `output: "static"` is used, Expo pre-renders the application using a Node.js environment. Node.js DOES NOT have access to browser APIs like:

- `window`
- `document`
- `localStorage`
- Native device modules (like `@react-native-async-storage/async-storage`)

### Critical Rule: Guarding Browser APIs

If you import or initialize any library that references the DOM or native device storage at the top-level of a file, **the production `npx expo export` build will crash.**

You must always guard these calls by checking if `window` is defined, or by wrapping the logic in a `useEffect` hook which only fires on the client.

#### Example: Safe AsyncStorage (Supabase)

```ts
// ❌ WRONG: Will crash SSR build!
import AsyncStorage from '@react-native-async-storage/async-storage';
const authStorage = AsyncStorage;

// ✅ CORRECT: Guarded check verifies we are out of Node.js
import AsyncStorage from '@react-native-async-storage/async-storage';
const authStorage = typeof window !== 'undefined' ? AsyncStorage : undefined;
```

## 3. GitHub Actions Compatibility

When updating dependencies (like upgrading to Expo SDK 55), always ensure `.github/workflows/deploy.yml` specifies a compatible Node version (e.g., `node-version: 20`).
