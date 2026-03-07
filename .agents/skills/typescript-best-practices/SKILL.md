---
name: typescript-best-practices
description: "Core guidelines for writing high-quality, maintainable TypeScript and JavaScript code."
---

# TypeScript & JavaScript Best Practices

When asked to write, refactor, or review TypeScript or JavaScript code, adhere strictly to the following quality standards:

## 1. Type Safety over Implicit Any

- Always define explicit `type` or `interface` for function arguments, return values, component Props, and API responses.
- Avoid using `any` unless strictly necessary (e.g., heavily dynamic third-party libraries). Use `unknown` with type narrowing instead.

## 2. Functional and Declarative Paradigms

- Prefer immutability. Use `const` over `let`. Avoid mutating arrays/objects directly (use `.map()`, `.filter()`, spread operators).
- Write pure functions when handling utility logic, separated from side-effects (API calls, UI rendering).

## 3. Component Architecture (React/React Native)

- Ensure components are focused on a single responsibility.
- Extract complex UI components into smaller, pure presentational components.
- Separate custom hooks (logic) from UI views (rendering).

## 4. Error Handling and Defensive Coding

- Validate external data inputs (`JSON.parse`, API responses) using Try/Catch or validation libraries (Zod/Yup).
- Provide fallback states and graceful error UI displays rather than crashing the application.

## 5. Comprehensive JSDoc Documentation

- Add standard JSDoc header comments to all major components, exported functions, and complex algorithms.
- Include `@param` and `@returns` tags for clarity.
- Leave highly descriptive inline comments for "clever" or non-obvious mathematical algorithms.

## 6. Performance Optimization

- Prevent unnecessary re-renders in React by properly structuring state.
- Use `useMemo` and `useCallback` when passing functions or complex objects downwards, particularly to `FlatList` or large iterated views.
- Lazy load heavy modules or non-critical paths.
