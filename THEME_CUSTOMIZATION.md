# Stoney App Theme Customization Guide

This guide explains how to completely customize the colors, gradients, and overall look and feel of the Stoney Language App.

All of the visual styles are centralized in a single file:
`stoney-app/contexts/ThemeContext.tsx`

## Finding the Color Palettes

Open `stoney-app/contexts/ThemeContext.tsx` in your code editor. Near the top of the file, you will find two main configuration objects:

1. `lightColors`: Active when the app is in Light Mode.
2. `darkColors`: Active when the app is in Dark Mode (or if the user manually toggles the switch in the Top Navigation Bar).

## How to Customize the Gradients

We use dynamic, multi-stop linear gradients to provide a modern, creative aesthetic. These are controlled by the `backgroundGradient` array inside each palette.

```tsx
export const darkColors = {
    // ...
    // The background will diagonally blend from Black to Grey to Pink to Orange
    backgroundGradient: ['#000000', '#27272a', '#ec4899', '#f97316'], 
```

To change the background, simply replace these hex codes with your own. You can add as many comma-separated colors as you want to make the gradient more complex! Once you save the file, the background will instantly update in your browser.

## How to Customize UI Elements

Below the `backgroundGradient`, you will find specific hex codes assigned to UI properties. Changing these will instantly update every corresponding component across the entire application.

### Key Properties

- **`primary`**: The main accent color used for primary buttons, active tabs, and highlighted borders. Currently set to a vibrant orange (`#ea580c`).
- **`surface`**: The solid background color of the "floating" UI cards, forms, and dialog popups.
- **`text`**: The color of the main paragraph and heading text. Make sure this contrasts well with your `surface` color!
- **`successBg` / `successBorder`**: The colors used when the user selects a correct answer in Quiz mode, or submits user feedback successfully.
- **`border`**: The subtle line colors dividing sidebar items and cards.

### Example: Making an Ocean Blue Theme

If you wanted to create an ocean-inspired light mode, you could edit the properties like this:

```tsx
export const lightColors = {
    // A soothing blue-to-teal gradient background
    backgroundGradient: ['#0ea5e9', '#14b8a6'],
    
    // A crisp white surface for UI cards
    surface: '#ffffff',
    
    // Changing the primary accent color to Navy Blue
    primary: '#1e3a8a',
    
    // Dark grey text for readability against the white surface
    text: '#1f2937',
    
    // ...
}
```

## Need Help Choosing Colors?

If you are looking for gorgeous, professional, and accessible color palettes to copy/paste into these variables, we highly recommend exploring the Tailwind CSS color system:
<https://tailwindcss.com/docs/customizing-colors>
