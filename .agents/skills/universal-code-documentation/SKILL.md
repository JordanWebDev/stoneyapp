---
name: universal-code-documentation
description: "Core guidelines for consistent, junior-friendly code documentation across HTML, CSS, JavaScript, TypeScript, and Node.js."
---

# Universal Code Documentation Standards

When asked to write, refactor, or review code in ANY language (HTML, CSS, JavaScript, TypeScript, Node.js, SQL), you MUST adhere to the following strict documentation standards. The goal is to make the codebase accessible, readable, and perfectly understandable for junior developers, thereby preventing errors during future development.

## 1. File-Level Documentation (Every File)

Every source file must begin with a high-level block comment explaining its purpose, features, and how it fits into the broader architecture.

**Example (TypeScript/JS/Node):**

```ts
/**
 * filename.ts — A brief description of the file.
 *
 * extended description of the file's primary responsibilities,
 * what it connects to, and how a junior dev should think about it.
 */
```

## 2. JSDoc for Functions and Classes (JS/TS/Node)

Every exported function, class, or React component must use JSDoc tags. Do not rely solely on TypeScript interfaces for documentation.

- `@param {Type} paramName` - Description of the parameter.
- `@returns {Type}` - Description of what the function returns.
- `@description` - A plain-English explanation of exactly what the function does.

## 3. React State and Hooks Documentation

React state (`useState`), refs (`useRef`), and side-effects (`useEffect`) must be explicitly documented so junior developers understand *why* state changes and *when* effects trigger.

- `@state propertyName` - Explain what the piece of state controls.
- `@hook useEffect` - Explain the dependency array and what triggers it.

## 4. HTML & UI Structure Documentation

When writing HTML or JSX/TSX, use layout-level comments to divide the visual hierarchy into clear sections.

**Example:**

```tsx
{/* ── HEADER NAVIGATION ── */}
<nav>...</nav>

{/* ── MAIN CONTENT GRID ── */}
<main>...</main>
```

## 5. CSS / Stylesheet Grouping

When writing CSS or React Native `StyleSheet` objects, group styling properties logically with clear headers. Do not dump styles randomly. Group by: `Layout`, `Typography`, `Colors`, `Interactions`.

## 6. Meaningful Variable Names over "Clever" Comments

Do not write code that requires a comment to understand. Name variables descriptively (`isUserLoggedIn` instead of `loggedIn`, `fetchCategories` instead of `getData`). Comments should explain the *why*, not the *what*.

## 7. SQL Documentation

All SQL schemas and complex queries must have block comments explaining table relationships, foreign key constraints, and the purpose of complex `JOIN` operations.
