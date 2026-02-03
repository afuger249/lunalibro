/**
 * Sound utility for Luna and Friends
 * Uses Web Audio API to generate playful, kid-friendly sounds without external assets
 */

class SoundEffects {
    constructor() {
        this.context = null;
    }

    init() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    /**
     * Positive feedback sound (Success/Correct)
     * A cheerful, rising chime
     */
    playSuccess() {
        this.init();
        const ctx = this.context;
        const now = ctx.currentTime;

        const playNote = (freq, startTime, duration, type = 'sine') => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + duration);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        // Rising major chord (C Major)
        playNote(523.25, now, 0.4, 'sine'); // C5
        playNote(659.25, now + 0.1, 0.4, 'sine'); // E5
        playNote(783.99, now + 0.2, 0.5, 'sine'); // G5
        playNote(1046.50, now + 0.3, 0.6, 'sine'); // C6
    }

    /**
     * Level Up / Milestone sound
     * A more complex, celebratory chord sequence
     */
    playMilestone() {
        this.init();
        const ctx = this.context;
        const now = ctx.currentTime;

        const playCelebration = (freq, startTime) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 1);
        };

        // Harmonic series
        [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
            playCelebration(freq, now + (i * 0.05));
        });
    }

    /**
     * Subtle "click" or "pop" for interface interactions
     */
    playPop() {
        this.init();
        const ctx = this.context;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }
}

export const soundEffects = new SoundEffects();
