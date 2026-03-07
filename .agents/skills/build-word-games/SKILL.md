---
name: Stoney Word Games Engineering
description: Guidelines and requirements for building high-quality, culturally respectful word games (Wordle, Crossword) for the Stoney Language App.
---

# Stoney Word Games Engineering Skill

When building word games for the Stoney Language app, you must adhere to the following quality guidelines to ensure a pristine UI/UX and a respectful, educational experience.

## 1. Cultural & Educational Tone

- **Positive Hints:** Standard hints (like literal English translations) can be dry. Every game must incorporate **positive, empowering, or enlightening messages** based on the word's meaning.
  - *Example:* Instead of just "Water", the hint should be: "Like water that nourishes the earth, you bring life to those around you. (Category: Nature)"
- **Encouragement:** UI messages on win/loss must be encouraging (e.g., "Great job! You're keeping the language alive.").

## 2. Text Normalization (Critical for Stoney)

Stoney Nakoda uses many diacritics (â, î, û, ch). Mobile keyboards make typing these difficult.

- **Requirement:** All input matching must use robust normalization.
- User input of 'a' MUST match 'â', 'i' matches 'î', 'u' matches 'û'.
- **Implementation:** Create a `normalizeStoney(str)` helper that strips accents before comparing a user's guess to the target word.

```javascript
export const normalizeStoney = (str: string) => 
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
```

## 3. Keyboard UI Experience

Do not rely on the native device keyboard.

- **Requirement:** Build a custom on-screen QWERTY keyboard specific to the game (like Wordle).
- **Feedback:** The keyboard keys must change color dynamically based on game state (e.g., Green for correct, Yellow for wrong position, Gray for not in word).
- **Haptics/Sound:** Ensure key presses trigger `playClickSound()` for tactile feedback.

## 4. State Persistence & Performance

- **Local Storage:** Use `AsyncStorage` to save daily progress.
  - Wordle: Save the current day's guesses, win state, and streak.
  - Crossword: Save the current board state so users don't lose progress if they close the app.
- **Randomization:**
  - Wordle requires a *deterministic* daily seed so all users get the same word on the same day (`Math.sin(date)` seed).
  - Crossword requires real-time grid generation. Ensure the intersection algorithm has a timeout/max-retry limit so the UI thread doesn't hang.

## 5. Mobile Responsiveness

- The game grid must scale perfectly. Use `useWindowDimensions` to calculate exact box sizes so 6-8 letter words fit on a 375px wide screen without scrolling horizontally.
