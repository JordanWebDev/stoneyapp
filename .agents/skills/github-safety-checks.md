# GitHub Safety and Security

This skill defines a set of safety checks for GitHub development.

## Core Rules

- **No Secrets**: Never commit `.env` files or hardcoded API keys.
- **Gitignore**: Maintain a high-quality `.gitignore` file including
  `node_modules`, `.expo`, and `dist`.
- **Branch Protection**: Use protected branches for `main` and require code
  reviews.

## Pre-Push Checklist

1. Check for hardcoded credentials.
2. Verify that all temporary work files are excluded.
3. Ensure Prettier and ESLint pass 100%.
4. Validate that all private data is removed.
