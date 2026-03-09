# Hosting React Native (Expo) on GitHub Pages

This project is a React Native app utilizing `expo-router` for web navigation. To host this successfully on GitHub Pages without encountering blank screens, 404 router errors, or missing assets, follow these exact requirements.

## 1. Configure the Base URL

By default, Expo expects your app to be hosted at the root domain (e.g., `https://example.com/`). When hosting on GitHub Pages, your app often lives under a sub-path matching your repository name (e.g., `https://<username>.github.io/<repo-name>/`).

You **must** configure `app.json` to include the `baseUrl` under the `experiments` object.

```json
{
  "expo": {
    "experiments": {
      "baseUrl": "/stoneyapp"
    }
  }
}
```

> Note: I have already configured this for you!

## 2. Generate the Static Build

To generate the production-ready HTML, CSS, and JS payload, we must use the `expo export` command, *not* `expo build:web`.

Run locally:

```bash
npx expo export
```

This generates a `dist/` folder containing the compiled web assets.

## 3. The `.nojekyll` Bypass (Critical)

GitHub Pages defaults to using Jekyll to process files. Jekyll completely ignores any directories or files that begin with an underscore `_`. Expo bundles modern web assets into a folder named `_expo`.

If you don't bypass Jekyll, GitHub Pages will refuse to serve the `_expo/` Javascript bundles, resulting in a blank white screen.

**Solution**: You must include an empty file named `.nojekyll` in the root of your `dist/` directory before deploying, or use a GitHub Actions step to create it. (The `deploy-pages` action handles this automatically if configured correctly).

## 4. GitHub Actions Automation (Recommended)

Instead of manually building and copying files, the best and most error-free way to host this JavaScript project is to use the dedicated GitHub Action we set up in `.github/workflows/deploy.yml`.

1. Push your code to the `main` branch.
2. In your repository on GitHub, navigate to **Settings > Pages**.
3. Under **Build and deployment**, switch the "Source" dropdown from "Deploy from a branch" -> **GitHub Actions**.

This pipeline runs standard node tools:

- `npm ci`
- `npx expo export`
- Uploads `dist/` natively.
- Deploys securely with zero manual configuration.
