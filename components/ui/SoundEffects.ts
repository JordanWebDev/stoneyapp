/**
 * SoundEffects.ts — Web-based sound effects for the app.
 *
 * Generates short audio tones using the Web Audio API.
 * These provide instant feedback for quiz answers, card flips, etc.
 * No external audio files needed — all sounds are synthesized.
 *
 * Usage:
 *   import { playCorrectSound, playWrongSound } from './SoundEffects';
 *   playCorrectSound();  // Plays a happy ascending tone
 */

import { Platform } from 'react-native';

// Only use Web Audio API on web platform
// IMPORTANT: We cache the AudioContext — browsers limit to ~6 instances
let _audioContext: AudioContext | null = null;

/**
 *
 */
const getAudioContext = (): AudioContext | null => {
    if (Platform.OS !== 'web') return null;
    if (_audioContext) return _audioContext;
    try {
        _audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        return _audioContext;
    } catch {
        return null;
    }
};

/**
 * Play a short tone with the given frequency and duration.
 * Uses Web Audio API oscillator for instant, lightweight sounds.
 * @param frequency
 * @param duration
 * @param type
 * @param volume
 */
const playTone = (
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.15
) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Fade out to avoid clicks
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
};

/** Happy ascending two-note chime — for correct answers */
export const playCorrectSound = () => {
    playTone(523, 0.15, 'sine', 0.12); // C5
    setTimeout(() => {
        playTone(659, 0.25, 'sine', 0.12); // E5
    }, 120);
};

/** Sad descending buzz — for wrong answers */
export const playWrongSound = () => {
    playTone(330, 0.12, 'square', 0.08); // E4
    setTimeout(() => {
        playTone(262, 0.3, 'square', 0.08); // C4
    }, 100);
};

/** Soft click — for navigation, card selection */
export const playClickSound = () => {
    playTone(880, 0.06, 'sine', 0.06); // A5 — short and subtle
};

/** Card flip whoosh — for flashcard reveal */
export const playFlipSound = () => {
    playTone(440, 0.08, 'triangle', 0.08); // A4
    setTimeout(() => {
        playTone(660, 0.1, 'triangle', 0.06); // E5
    }, 50);
};

/** Match found — celebratory triple chime */
export const playMatchSound = () => {
    playTone(523, 0.1, 'sine', 0.1); // C5
    setTimeout(() => playTone(659, 0.1, 'sine', 0.1), 80); // E5
    setTimeout(() => playTone(784, 0.2, 'sine', 0.1), 160); // G5
};

/** Level complete — triumphant fanfare */
export const playCompleteSound = () => {
    playTone(523, 0.12, 'sine', 0.12); // C5
    setTimeout(() => playTone(659, 0.12, 'sine', 0.12), 100); // E5
    setTimeout(() => playTone(784, 0.12, 'sine', 0.12), 200); // G5
    setTimeout(() => playTone(1047, 0.3, 'sine', 0.12), 300); // C6
};
