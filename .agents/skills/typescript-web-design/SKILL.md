---
name: elegant-typescript-web-design
description: "Guidelines for creating highly polished, modern, and accessible website designs using TypeScript and React."
---

# Elegant Web & UX Design in TypeScript

When building web interfaces, dashboards, or applications, follow these core design and user-experience principles:

## 1. Prioritize Visual Excellence & Typography

- Never use default browser fonts. Rely on robust sans-serif fonts (e.g., Inter, Roboto, SF Pro) with distinct sizing hierarchies.
- Use curated, intentional color palettes based on modern design systems (Tailwind/Material). Avoid generic neon 100% saturation reds, blues, and greens.
- Use extremely subtle shadows (`elevation` or `box-shadow`) to create depth and separate content layers from backgrounds.

## 2. Dynamic, Interactive Responses

- Interactive elements (Buttons, Links, Cards) MUST have hover, focus, and active/pressed states to feel "alive".
- Employ subtle micro-animations (e.g., opacity fades, slight scaling `transform: scale(0.98)`) for state transitions. Do not use jarring snaps.

## 3. Fluid and Responsive Layouts

- Design mobile-first or ensure responsive breakpoints (`useWindowDimensions` in React Native, CSS media queries in web) gracefully flow the content column-by-column as the screen shrinks.
- Avoid horizontal scrolling lock-in. Implement `flexWrap` or natively scrolling horizontal lists to prevent UI elements from being "cut off."
- Rely on Flexbox (`flexDirection`, `gap`, `justifyContent`) for spatial alignment rather than hardcoded margins.

## 4. Accessibility and Ergonomics

- Ensure sufficient contrast ratios between text and background colors.
- Ensure hit-areas (touch targets) for buttons are at least 44x44px for thumb tap ergonomics.
- Ensure clear visual focus outlines for keyboard navigation.

## 5. Intentional White Space

- Use generous, consistent padding (`16px`, `24px`, `32px`) to divide distinct visual elements.
- Avoid cluttering the interface. Give content "room to breathe".
- Group related items with internal `gap` spacing, while separating unrelated sections with much larger external margins.
