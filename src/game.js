/**
 * Marlow's Lemonade Stand - Main Game
 * A Phaser 3 clicker/idle game for mobile
 * Modern, accessible UI design
 */

console.log('Game script loading...');

// Global error handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global error:', msg, 'at', url, lineNo);
    const loading = document.getElementById('loading');
    if (loading) {
        loading.innerHTML = '<h1>Error</h1><p>' + msg + '</p>';
    }
    return false;
};

// Game configuration - base dimensions (will scale dynamically)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Helper names for the stand
const HELPER_INFO = {
    violetMarketing: { name: 'Violet', texture: 'violet', position: 'right' },
    daddyManager: { name: 'Daddy', texture: 'daddy', position: 'back-left' },
    mommyAccountant: { name: 'Mommy', texture: 'mommy', position: 'back-right' },
    poppyHelper: { name: 'Poppy', texture: 'poppy', position: 'front-left' },
    winnieGuard: { name: 'Winnie', texture: 'winnie', position: 'front-right' },
    amelieFriend: { name: 'Amelie', texture: 'amelie', position: 'left' },
    maddieFriend: { name: 'Maddie', texture: 'maddie', position: 'far-left' }
};

// Modern color palette with good contrast
const COLORS = {
    // Primary
    lemonYellow: 0xFCD34D,
    lemonDark: 0xF59E0B,

    // UI Colors
    primary: 0x2563EB,      // Blue
    primaryDark: 0x1D4ED8,
    success: 0x10B981,      // Green
    successDark: 0x059669,
    warning: 0xF59E0B,      // Amber
    danger: 0xEF4444,       // Red

    // Neutrals
    white: 0xFFFFFF,
    gray50: 0xF9FAFB,
    gray100: 0xF3F4F6,
    gray200: 0xE5E7EB,
    gray300: 0xD1D5DB,
    gray500: 0x6B7280,
    gray700: 0x374151,
    gray900: 0x111827,

    // Fun colors
    pink: 0xEC4899,
    purple: 0x8B5CF6,
    cyan: 0x06B6D4,
    orange: 0xF97316,

    // Sky
    skyTop: 0x7DD3FC,
    skyBottom: 0xBAE6FD,
    grass: 0x86EFAC
};

// Sound Manager
class SoundManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.log('Web Audio not supported');
            this.enabled = false;
        }
    }

    play(type) {
        if (!this.enabled || !this.audioContext) return;
        try {
            switch (type) {
                case 'click':
                    this.playTone(600, 0.08, 'sine', 0.15);
                    break;
                case 'coin':
                    this.playTone(523, 0.08, 'sine', 0.12);
                    setTimeout(() => this.playTone(659, 0.08, 'sine', 0.12), 50);
                    setTimeout(() => this.playTone(784, 0.12, 'sine', 0.12), 100);
                    break;
                case 'upgrade':
                    this.playTone(440, 0.08, 'sine', 0.15);
                    setTimeout(() => this.playTone(554, 0.08, 'sine', 0.15), 60);
                    setTimeout(() => this.playTone(659, 0.08, 'sine', 0.15), 120);
                    setTimeout(() => this.playTone(880, 0.15, 'sine', 0.15), 180);
                    break;
                case 'levelUp':
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => this.playTone(440 + i * 110, 0.1, 'sine', 0.15), i * 70);
                    }
                    break;
                case 'quest':
                    this.playTone(523, 0.12, 'sine', 0.2);
                    setTimeout(() => this.playTone(659, 0.12, 'sine', 0.2), 80);
                    setTimeout(() => this.playTone(784, 0.12, 'sine', 0.2), 160);
                    setTimeout(() => this.playTone(1047, 0.25, 'sine', 0.2), 240);
                    break;
                case 'error':
                    this.playTone(200, 0.15, 'square', 0.15);
                    break;
                case 'combo':
                    // Rising pitch blip based on combo count
                    this.playTone(400 + Math.min(this._comboHint || 0, 20) * 30, 0.06, 'sine', 0.1);
                    break;
                case 'luckyBig':
                    // Enhanced lucky hit fanfare
                    this.playTone(523, 0.1, 'sine', 0.2);
                    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.2), 50);
                    setTimeout(() => this.playTone(784, 0.1, 'sine', 0.2), 100);
                    setTimeout(() => this.playTone(1047, 0.2, 'sine', 0.25), 150);
                    setTimeout(() => this.playTone(1319, 0.25, 'sine', 0.2), 250);
                    break;
            }
        } catch (e) {
            console.log('Sound error:', e);
        }
    }

    playTone(frequency, duration, type, volume) {
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.value = volume;
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.start(now);
        osc.stop(now + duration);
    }
}

const soundManager = new SoundManager();

// Music Manager — procedural background music using Chris Wilson scheduler pattern
class MusicManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.enabled = true;
        this.playing = false;
        this.nextLoopTime = 0;
        this.schedulerInterval = null;
        this.scheduleAheadTime = 0.12; // 120ms lookahead

        // Music timing: C major, 116 BPM, 4-bar loop (I-V-vi-IV)
        this.BPM = 116;
        this.quarterNote = 60 / this.BPM;
        this.sixteenthNote = this.quarterNote / 4;
        // 4 bars × 16 sixteenth notes per bar = 64 sixteenth notes
        this.loopDuration = 64 * this.sixteenthNote;

        // Melody: 64 sixteenth-note pitches in Hz (0 = rest)
        // Bars 1-2: C major / G major phrasing
        // Bars 3-4: A minor / F major phrasing
        this.MELODY = [
            659, 784, 659, 523,   587, 659, 784, 659,   1047, 988, 880, 784,   659, 784, 1047, 0,
            587, 784, 988, 784,   880, 988, 1175, 988,  784, 880, 988, 880,    784, 0,   587, 784,
            880, 1047,1319,1047,  880, 784, 659, 880,   1047,988, 880, 784,    659, 784, 880, 0,
            698, 880, 1047,880,   784, 880,1047, 880,   698, 784, 880, 784,    1047, 0,  784, 659
        ];

        // Bass: 16 quarter-note pitches (4 bars × 4 beats, root+fifth pattern)
        this.BASS = [
            131, 131, 196, 131,   98, 98, 147, 98,   110, 110, 165, 110,   87, 87, 131, 87
        ];

        // Chord pads: 4 chords × 1 bar each [C, G, Am, F]
        this.CHORDS = [
            [262, 330, 392],
            [196, 247, 294],
            [220, 262, 330],
            [175, 220, 262]
        ];
    }

    init(audioContext) {
        if (!audioContext) return;
        this.audioContext = audioContext;
        this.masterGain = audioContext.createGain();
        this.masterGain.gain.value = 0.28;
        this.masterGain.connect(audioContext.destination);
    }

    start() {
        if (!this.audioContext || this.playing || !this.enabled) return;
        this.playing = true;
        this.nextLoopTime = this.audioContext.currentTime + 0.05;
        this.schedulerInterval = setInterval(() => this._scheduleLoop(), 25);
    }

    stop() {
        this.playing = false;
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
        if (this.masterGain && this.audioContext) {
            const now = this.audioContext.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(0.001, now + 0.8);
        }
    }

    setEnabled(val) {
        this.enabled = val;
        if (!val) {
            this.stop();
        } else if (!this.playing && this.audioContext) {
            // Restore gain then start
            if (this.masterGain) {
                const now = this.audioContext.currentTime;
                this.masterGain.gain.cancelScheduledValues(now);
                this.masterGain.gain.setValueAtTime(0.28, now);
            }
            this.start();
        }
    }

    _scheduleLoop() {
        if (!this.audioContext || !this.playing) return;
        const now = this.audioContext.currentTime;
        while (this.nextLoopTime < now + this.scheduleAheadTime) {
            this._scheduleMelody(this.nextLoopTime);
            this._scheduleBass(this.nextLoopTime);
            this._scheduleChords(this.nextLoopTime);
            this.nextLoopTime += this.loopDuration;
        }
    }

    _scheduleMelody(loopStart) {
        this.MELODY.forEach((freq, i) => {
            if (freq === 0) return;
            const t = loopStart + i * this.sixteenthNote;
            this._playNote(freq, t, this.sixteenthNote * 1.75, 'sine', 0.11, 0.008, 0.07);
        });
    }

    _scheduleBass(loopStart) {
        this.BASS.forEach((freq, i) => {
            const t = loopStart + i * this.quarterNote;
            this._playNote(freq, t, this.quarterNote * 0.8, 'square', 0.055, 0.005, 0.08);
        });
    }

    _scheduleChords(loopStart) {
        // 1 bar per chord = 4 quarter notes = 16 sixteenth notes
        const chordDuration = this.quarterNote * 4;
        this.CHORDS.forEach((chord, i) => {
            const chordStart = loopStart + i * chordDuration;
            chord.forEach(freq => {
                this._playNote(freq, chordStart, chordDuration * 0.94, 'triangle', 0.038, 0.2, 0.4);
            });
        });
    }

    _playNote(freq, startTime, duration, type, gainValue, attack, release) {
        if (!this.audioContext || !this.enabled || !this.masterGain) return;
        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(gainValue, startTime + attack);
            gain.gain.setValueAtTime(gainValue, startTime + duration - release);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + duration);
        } catch (e) {
            // Ignore scheduling errors (common when context is suspended)
        }
    }
}

const musicManager = new MusicManager();

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        console.log('BootScene preload...');
    }

    create() {
        console.log('BootScene create...');

        // Hide loading screen
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';

        // Create all textures
        this.createTextures();

        soundManager.init();
        musicManager.init(soundManager.audioContext);
        this.scene.start('MainMenuScene');
    }

    createTextures() {
        const g = this.add.graphics();

        // Helper to create filled circle texture
        const makeCircle = (key, radius, color, strokeColor = null, strokeWidth = 0) => {
            g.clear();
            if (strokeColor !== null) {
                g.lineStyle(strokeWidth, strokeColor);
                g.strokeCircle(radius + strokeWidth, radius + strokeWidth, radius);
            }
            g.fillStyle(color);
            g.fillCircle(radius + strokeWidth, radius + strokeWidth, radius);
            g.generateTexture(key, (radius + strokeWidth) * 2, (radius + strokeWidth) * 2);
        };

        // Helper to create rounded rect texture
        const makeRoundedRect = (key, w, h, radius, color, strokeColor = null, strokeWidth = 0) => {
            g.clear();
            g.fillStyle(color);
            g.fillRoundedRect(strokeWidth, strokeWidth, w, h, radius);
            if (strokeColor !== null) {
                g.lineStyle(strokeWidth, strokeColor);
                g.strokeRoundedRect(strokeWidth, strokeWidth, w, h, radius);
            }
            g.generateTexture(key, w + strokeWidth * 2, h + strokeWidth * 2);
        };

        // Lemon (simple oval)
        g.clear();
        g.fillStyle(COLORS.lemonYellow);
        g.fillEllipse(40, 35, 70, 60);
        g.fillStyle(0xFEF3C7);
        g.fillEllipse(30, 28, 25, 18);
        g.generateTexture('lemon', 80, 70);

        // Coin
        g.clear();
        g.fillStyle(0xFCD34D);
        g.fillCircle(20, 20, 18);
        g.fillStyle(0xFEF3C7);
        g.fillCircle(16, 16, 6);
        g.lineStyle(3, 0xF59E0B);
        g.strokeCircle(20, 20, 16);
        g.generateTexture('coin', 40, 40);

        // Particle
        g.clear();
        g.fillStyle(COLORS.white);
        g.fillCircle(6, 6, 6);
        g.generateTexture('particle', 12, 12);

        // Sparkle (simple diamond)
        g.clear();
        g.fillStyle(COLORS.lemonYellow);
        g.fillTriangle(16, 0, 32, 16, 16, 32);
        g.fillTriangle(16, 0, 0, 16, 16, 32);
        g.generateTexture('sparkle', 32, 32);

        // Star
        g.clear();
        g.fillStyle(0xFCD34D);
        g.fillTriangle(20, 0, 25, 15, 40, 15);
        g.fillTriangle(40, 15, 28, 24, 32, 40);
        g.fillTriangle(32, 40, 20, 30, 8, 40);
        g.fillTriangle(8, 40, 12, 24, 0, 15);
        g.fillTriangle(0, 15, 15, 15, 20, 0);
        g.fillCircle(20, 20, 10);
        g.generateTexture('star', 40, 40);

        // Primary Button
        makeRoundedRect('btnPrimary', 200, 56, 16, COLORS.primary);
        makeRoundedRect('btnPrimaryHover', 200, 56, 16, COLORS.primaryDark);

        // Success Button
        makeRoundedRect('btnSuccess', 100, 48, 12, COLORS.success);
        makeRoundedRect('btnSuccessHover', 100, 48, 12, COLORS.successDark);

        // Danger Button
        makeRoundedRect('btnDanger', 140, 44, 10, COLORS.danger);

        // Card/Panel
        makeRoundedRect('card', 340, 200, 20, COLORS.white, COLORS.gray200, 2);
        makeRoundedRect('cardLarge', 360, 600, 24, COLORS.white, COLORS.gray200, 2);

        // Tab buttons
        makeRoundedRect('tab', 80, 40, 10, COLORS.gray100);
        makeRoundedRect('tabActive', 80, 40, 10, COLORS.primary);

        // Progress bar
        makeRoundedRect('progressBg', 280, 12, 6, COLORS.gray200);
        makeRoundedRect('progressFill', 280, 12, 6, COLORS.success);

        // Stand graphics (simplified, clean versions)
        for (let level = 1; level <= 10; level++) {
            g.clear();

            // Base stand - gets fancier with level
            const baseColor = level < 4 ? 0xD4A574 : (level < 7 ? 0xFEF3C7 : 0xFCD34D);
            const accentColor = level < 4 ? 0xA16207 : (level < 7 ? 0xF59E0B : 0xEAB308);

            // Stand body
            g.fillStyle(baseColor);
            g.fillRoundedRect(10, 60, 180, 90, level < 5 ? 4 : 12);

            // Counter top
            g.fillStyle(0xFFFFFF);
            g.fillRoundedRect(20, 55, 160, 20, 4);

            // Awning for higher levels
            if (level >= 3) {
                g.fillStyle(accentColor);
                g.fillTriangle(100, 20, 0, 60, 200, 60);

                // Stripes on awning
                if (level >= 5) {
                    g.fillStyle(COLORS.white);
                    for (let i = 0; i < 5; i++) {
                        g.fillTriangle(40 + i * 30, 35, 20 + i * 30, 55, 60 + i * 30, 55);
                    }
                }
            }

            // Decorations for higher levels
            if (level >= 6) {
                g.fillStyle(COLORS.lemonYellow);
                g.fillCircle(30, 45, 8);
                g.fillCircle(170, 45, 8);
            }
            if (level >= 8) {
                g.fillStyle(COLORS.pink);
                g.fillCircle(60, 40, 6);
                g.fillCircle(140, 40, 6);
            }
            if (level >= 10) {
                // Crown/star for max level
                g.fillStyle(0xFCD34D);
                g.fillTriangle(100, 5, 90, 20, 110, 20);
            }

            // Border
            g.lineStyle(3, accentColor);
            g.strokeRoundedRect(10, 60, 180, 90, level < 5 ? 4 : 12);

            g.generateTexture('stand' + level, 200, 160);
        }

        // Character - Marlow (simple, cute style)
        g.clear();
        // Body (yellow shirt)
        g.fillStyle(COLORS.lemonYellow);
        g.fillRoundedRect(18, 40, 28, 35, 8);
        // Head
        g.fillStyle(0xFED7AA);
        g.fillCircle(32, 24, 18);
        // Hair
        g.fillStyle(0x78350F);
        g.fillEllipse(32, 14, 18, 10);
        // Eyes
        g.fillStyle(COLORS.gray900);
        g.fillCircle(26, 22, 3);
        g.fillCircle(38, 22, 3);
        // Smile
        g.lineStyle(2, COLORS.gray900);
        g.beginPath();
        g.arc(32, 28, 7, 0.3, Math.PI - 0.3);
        g.strokePath();
        // Arms
        g.fillStyle(0xFED7AA);
        g.fillRoundedRect(8, 45, 12, 20, 4);
        g.fillRoundedRect(44, 45, 12, 20, 4);
        g.generateTexture('marlow', 64, 80);

        // Close button
        g.clear();
        g.fillStyle(COLORS.danger);
        g.fillCircle(18, 18, 18);
        g.lineStyle(3, COLORS.white);
        g.beginPath();
        g.moveTo(10, 10);
        g.lineTo(26, 26);
        g.moveTo(26, 10);
        g.lineTo(10, 26);
        g.strokePath();
        g.generateTexture('closeBtn', 36, 36);

        // Dogs - Poppy
        g.clear();
        g.fillStyle(0xD4A574);
        g.fillEllipse(24, 26, 32, 24);
        g.fillCircle(24, 12, 12);
        g.fillStyle(COLORS.gray900);
        g.fillCircle(20, 12, 2);
        g.fillCircle(28, 12, 2);
        g.fillCircle(24, 16, 3);
        g.generateTexture('poppy', 48, 44);

        // Dogs - Winnie
        g.clear();
        g.fillStyle(0x92400E);
        g.fillEllipse(24, 26, 32, 24);
        g.fillCircle(24, 12, 12);
        g.fillStyle(COLORS.gray900);
        g.fillCircle(20, 12, 2);
        g.fillCircle(28, 12, 2);
        g.fillCircle(24, 16, 3);
        g.generateTexture('winnie', 48, 44);

        // Violet (sister) - purple outfit, long dark hair
        g.clear();
        g.fillStyle(COLORS.purple);
        g.fillRoundedRect(18, 38, 28, 32, 8);
        g.fillStyle(0xFED7AA);
        g.fillCircle(32, 22, 16);
        g.fillStyle(0x581C87);
        g.fillEllipse(32, 12, 16, 10);
        g.fillStyle(COLORS.gray900);
        g.fillCircle(27, 20, 2);
        g.fillCircle(37, 20, 2);
        g.lineStyle(2, COLORS.pink);
        g.beginPath();
        g.arc(32, 26, 5, 0.3, Math.PI - 0.3);
        g.strokePath();
        g.fillStyle(0xFED7AA);
        g.fillRoundedRect(8, 42, 12, 18, 4);
        g.fillRoundedRect(44, 42, 12, 18, 4);
        g.generateTexture('violet', 64, 75);

        // Daddy - blue shirt, short hair
        g.clear();
        g.fillStyle(COLORS.primary);
        g.fillRoundedRect(14, 42, 36, 38, 8);
        g.fillStyle(0xFED7AA);
        g.fillCircle(32, 24, 20);
        g.fillStyle(0x78350F);
        g.fillEllipse(32, 12, 18, 8);
        g.fillStyle(COLORS.gray900);
        g.fillCircle(26, 22, 2);
        g.fillCircle(38, 22, 2);
        g.lineStyle(2, COLORS.gray900);
        g.beginPath();
        g.arc(32, 30, 6, 0.3, Math.PI - 0.3);
        g.strokePath();
        g.fillStyle(0xFED7AA);
        g.fillRoundedRect(4, 48, 14, 22, 4);
        g.fillRoundedRect(46, 48, 14, 22, 4);
        g.generateTexture('daddy', 64, 85);

        // Mommy - pink outfit, styled hair
        g.clear();
        g.fillStyle(COLORS.pink);
        g.fillRoundedRect(16, 40, 32, 36, 8);
        g.fillStyle(0xFED7AA);
        g.fillCircle(32, 22, 18);
        g.fillStyle(0x78350F);
        g.fillEllipse(32, 10, 20, 12);
        g.fillEllipse(22, 18, 8, 10);
        g.fillEllipse(42, 18, 8, 10);
        g.fillStyle(COLORS.gray900);
        g.fillCircle(27, 20, 2);
        g.fillCircle(37, 20, 2);
        g.lineStyle(2, COLORS.pink);
        g.beginPath();
        g.arc(32, 28, 5, 0.3, Math.PI - 0.3);
        g.strokePath();
        g.fillStyle(0xFED7AA);
        g.fillRoundedRect(6, 46, 14, 20, 4);
        g.fillRoundedRect(44, 46, 14, 20, 4);
        g.generateTexture('mommy', 64, 80);

        // Amelie (friend) - teal/cyan outfit, blonde ponytail
        g.clear();
        g.fillStyle(COLORS.cyan);
        g.fillRoundedRect(18, 38, 28, 32, 8);
        g.fillStyle(0xFED7AA);
        g.fillCircle(32, 22, 16);
        g.fillStyle(0xFCD34D);
        g.fillEllipse(32, 12, 16, 10);
        g.fillEllipse(44, 16, 8, 14);
        g.fillStyle(COLORS.gray900);
        g.fillCircle(27, 20, 2);
        g.fillCircle(37, 20, 2);
        g.lineStyle(2, COLORS.cyan);
        g.beginPath();
        g.arc(32, 26, 5, 0.3, Math.PI - 0.3);
        g.strokePath();
        g.fillStyle(0xFED7AA);
        g.fillRoundedRect(8, 42, 12, 18, 4);
        g.fillRoundedRect(44, 42, 12, 18, 4);
        g.generateTexture('amelie', 64, 75);

        // Maddie (friend) - orange outfit, red hair
        g.clear();
        g.fillStyle(COLORS.orange);
        g.fillRoundedRect(18, 38, 28, 32, 8);
        g.fillStyle(0xFED7AA);
        g.fillCircle(32, 22, 16);
        g.fillStyle(0xDC2626);
        g.fillEllipse(32, 12, 16, 10);
        g.fillEllipse(20, 18, 8, 12);
        g.fillEllipse(44, 18, 8, 12);
        g.fillStyle(COLORS.gray900);
        g.fillCircle(27, 20, 2);
        g.fillCircle(37, 20, 2);
        g.lineStyle(2, COLORS.orange);
        g.beginPath();
        g.arc(32, 26, 5, 0.3, Math.PI - 0.3);
        g.strokePath();
        g.fillStyle(0xFED7AA);
        g.fillRoundedRect(8, 42, 12, 18, 4);
        g.fillRoundedRect(44, 42, 12, 18, 4);
        g.generateTexture('maddie', 64, 75);

        // Labubu
        g.clear();
        g.fillStyle(0xFEF3C7);
        g.fillRoundedRect(10, 18, 28, 24, 10);
        g.fillCircle(24, 14, 14);
        g.fillStyle(COLORS.pink);
        g.fillTriangle(14, 4, 18, 14, 10, 14);
        g.fillTriangle(34, 4, 38, 14, 30, 14);
        g.fillStyle(COLORS.gray900);
        g.fillCircle(19, 14, 3);
        g.fillCircle(29, 14, 3);
        g.generateTexture('labubu', 48, 44);

        // Sports balls
        g.clear();
        g.fillStyle(COLORS.white);
        g.fillCircle(18, 18, 16);
        g.lineStyle(2, COLORS.primary);
        g.strokeCircle(18, 18, 14);
        g.generateTexture('volleyball', 36, 36);

        g.clear();
        g.fillStyle(COLORS.orange);
        g.fillCircle(18, 18, 16);
        g.lineStyle(2, COLORS.gray900);
        g.strokeCircle(18, 18, 14);
        g.beginPath();
        g.moveTo(4, 18);
        g.lineTo(32, 18);
        g.moveTo(18, 4);
        g.lineTo(18, 32);
        g.strokePath();
        g.generateTexture('basketball', 36, 36);

        // Steam particle (small soft circle for stand aroma)
        g.clear();
        g.fillStyle(0xFFFFFF);
        g.fillCircle(6, 6, 6);
        g.generateTexture('steamParticle', 12, 12);

        // Leaf particle (small green oval)
        g.clear();
        g.fillStyle(0x4ADE80);
        g.fillEllipse(8, 5, 14, 8);
        g.generateTexture('leaf', 16, 10);

        // Sun ray segment (thin triangle for rotating rays)
        g.clear();
        g.fillStyle(0xFCD34D);
        g.beginPath();
        g.moveTo(0, 4);
        g.lineTo(40, 0);
        g.lineTo(40, 8);
        g.closePath();
        g.fillPath();
        g.generateTexture('sunRay', 40, 8);

        g.destroy();
        console.log('Textures created successfully');
    }
}

// Main Menu Scene
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        this.createScene();

        // Handle resize events
        this.scale.on('resize', this.handleResize, this);
    }

    handleResize(gameSize) {
        // Recreate scene on resize
        this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
        this.scene.restart();
    }

    createScene() {
        const { width, height } = this.scale;
        const groundY = height - 180;

        // Sky gradient background
        const bg = this.add.graphics();
        for (let i = 0; i < 20; i++) {
            const t = i / 20;
            const r = Math.floor(125 + (186 - 125) * t);
            const gv = Math.floor(211 + (230 - 211) * t);
            const b = Math.floor(252 + (253 - 252) * t);
            bg.fillStyle((r << 16) | (gv << 8) | b);
            bg.fillRect(0, (groundY / 20) * i, width, groundY / 20 + 1);
        }

        // Sun with rays
        const sunX = width - 50;
        const sunY = 70;
        const raysContainer = this.add.container(sunX, sunY);
        for (let i = 0; i < 10; i++) {
            const ray = this.add.image(0, 0, 'sunRay').setOrigin(0, 0.5);
            ray.setAlpha(0.2);
            ray.setAngle(i * 36);
            ray.setScale(1.4 + Math.random() * 0.5, 0.5 + Math.random() * 0.4);
            raysContainer.add(ray);
        }
        this.tweens.add({
            targets: raysContainer,
            angle: 360,
            duration: 90000,
            repeat: -1
        });
        this.add.circle(sunX, sunY, 45, 0xFCD34D);
        this.add.circle(sunX, sunY, 35, 0xFEF3C7);

        // Distant hills
        const hills = this.add.graphics();
        hills.fillStyle(0xA7F3D0, 0.5);
        hills.beginPath();
        hills.moveTo(0, groundY);
        for (let x = 0; x <= width; x += 25) {
            hills.lineTo(x, groundY - 40 - Math.sin(x * 0.015) * 25 - Math.sin(x * 0.03 + 1) * 12);
        }
        hills.lineTo(width, groundY);
        hills.closePath();
        hills.fillPath();

        // Animated clouds
        for (let i = 0; i < 3; i++) {
            const cloud = this.createCloud(60 + i * 130, 60 + i * 20);
            this.tweens.add({
                targets: cloud,
                x: width + 80,
                duration: 55000 + i * 18000,
                repeat: -1,
                onRepeat: () => { cloud.x = -80; }
            });
        }

        // Ground
        bg.fillStyle(COLORS.grass);
        bg.fillRect(0, groundY, width, height - groundY);
        bg.fillStyle(0x4ADE80);
        bg.fillRect(0, groundY, width, 8);

        // Calculate responsive font size
        const titleFontSize = Math.min(38, width / 10);

        // Title with shadow for better readability
        const titleShadow = this.add.text(width / 2 + 2, 172, "Marlow's\nLemonade Stand", {
            fontSize: `${titleFontSize}px`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#00000033',
            align: 'center',
            fontStyle: 'bold',
            lineSpacing: 8,
            wordWrap: { width: width - 40, useAdvancedWrap: true }
        }).setOrigin(0.5);

        const title = this.add.text(width / 2, 170, "Marlow's\nLemonade Stand", {
            fontSize: `${titleFontSize}px`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#78350F',
            align: 'center',
            fontStyle: 'bold',
            lineSpacing: 8,
            wordWrap: { width: width - 40, useAdvancedWrap: true }
        }).setOrigin(0.5);

        // Animated lemon
        const lemon = this.add.image(width / 2, 340, 'lemon').setScale(1.8);
        this.tweens.add({
            targets: lemon,
            y: 330,
            angle: 3,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Play button - large, accessible
        const playBtn = this.add.image(width / 2, 480, 'btnPrimary').setScale(1.3);
        const playText = this.add.text(width / 2, 480, 'Play Game', {
            fontSize: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        playBtn.setInteractive({ useHandCursor: true });
        playBtn.on('pointerover', () => playBtn.setTexture('btnPrimaryHover'));
        playBtn.on('pointerout', () => playBtn.setTexture('btnPrimary'));
        playBtn.on('pointerdown', () => {
            soundManager.play('click');
            this.tweens.add({
                targets: [playBtn, playText],
                scale: { from: 1.3, to: 1.2 },
                duration: 80,
                yoyo: true,
                onComplete: () => this.scene.start('GameScene')
            });
        });

        // Footer text
        this.add.text(width / 2, height - 60, 'Made with ❤️ for Marlow', {
            fontSize: '16px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#166534'
        }).setOrigin(0.5);
    }

    createCloud(x, y) {
        const cloud = this.add.container(x, y);
        cloud.add(this.add.ellipse(0, 0, 50, 28, COLORS.white));
        cloud.add(this.add.ellipse(-18, 6, 35, 22, COLORS.white));
        cloud.add(this.add.ellipse(22, 4, 40, 24, COLORS.white));
        return cloud;
    }

    shutdown() {
        this.scale.off('resize', this.handleResize, this);
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.loadGame();
        this.createSceneElements();

        // Handle resize events
        this.scale.on('resize', this.handleResize, this);
    }

    handleResize(gameSize) {
        this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
        // Reposition elements on resize
        this.repositionElements(gameSize.width, gameSize.height);
    }

    repositionElements(width, height) {
        // Reposition stand container
        if (this.standContainer) {
            this.standContainer.setPosition(width / 2, height / 2 - 30);
        }

        // Reposition money card
        if (this.moneyCard) {
            this.moneyCard.setPosition(width / 2, 55);
        }

        // Reposition stats text
        if (this.statsText) {
            this.statsText.setPosition(width / 2, 100);
        }

        // Reposition progress container
        if (this.progressContainer) {
            this.progressContainer.setPosition(width / 2, height / 2 + 125);
        }

        // Reposition event banner
        if (this.eventBanner) {
            this.eventBanner.setPosition(width / 2, 145);
        }

        // Reposition prestige display
        if (this.prestigeDisplay) {
            this.prestigeDisplay.setPosition(width - 70, 55);
        }

        // Reposition booster row
        if (this.boosterRow) {
            this.boosterRow.setPosition(width / 2, height - 120);
            this._boosterWidth = width;
        }

        // Rebuild bottom nav on resize
        if (this.bottomNav) {
            this.bottomNav.destroy();
        }
        this.createBottomNav(width, height);
    }

    createSceneElements() {
        const { width, height } = this.scale;
        this.createBackground(width, height);
        this.createStand(width, height);
        this.createUI(width, height);
        this.createParticles();

        this.eventMultiplier = 1;
        this.activeEvent = null;

        // Combo system state
        this.comboCount = 0;
        this.lastTapTime = 0;
        this.comboTimeout = null;

        // Idle income timer
        this.time.addEvent({
            delay: 1000,
            callback: this.processIdleIncome,
            callbackScope: this,
            loop: true
        });

        // Quest check timer
        this.time.addEvent({
            delay: 2000,
            callback: this.checkQuests,
            callbackScope: this,
            loop: true
        });

        // Random events
        this.time.addEvent({
            delay: 30000,
            callback: this.tryRandomEvent,
            callbackScope: this,
            loop: true
        });

        // Auto save
        this.time.addEvent({
            delay: 30000,
            callback: () => this.saveGame(),
            callbackScope: this,
            loop: true
        });
    }

    loadGame() {
        try {
            const saved = localStorage.getItem('marlowLemonade');
            if (saved) {
                let data = JSON.parse(saved);
                if (Economy.validateSave(data)) {
                    this.gameState = Economy.migrateSave(data);
                } else {
                    this.gameState = Economy.createNewSave();
                }
            } else {
                this.gameState = Economy.createNewSave();
            }
        } catch (e) {
            console.error('Load error:', e);
            this.gameState = Economy.createNewSave();
        }
        soundManager.enabled = this.gameState.settings?.soundEnabled !== false;
        musicManager.enabled = this.gameState.settings?.musicEnabled !== false;

        // Handle new day / streak tracking
        const streakResult = Economy.updateStreak(
            this.gameState.lastPlayDate || '',
            this.gameState.streak || 0
        );
        if (streakResult.isNewDay) {
            this.gameState.streak = streakResult.streak;
            this.gameState.lastPlayDate = Economy.getTodayString();
            if (streakResult.streakBonus > 0) {
                this.gameState.money += streakResult.streakBonus;
                this.gameState.totalEarned += streakResult.streakBonus;
            }
            // Reset daily stats for new day
            this.gameState.dailyStats = { taps: 0, earned: 0, luckyBonuses: 0, upgradesBought: 0, maxCombo: 0 };
            this.gameState.dailyDate = Economy.getTodayString();
            this.gameState.dailyCompleted = [];
            this._pendingStreakBonus = streakResult.streakBonus;
        }
    }

    saveGame() {
        try {
            this.gameState.lastSaved = Date.now();
            localStorage.setItem('marlowLemonade', JSON.stringify(this.gameState));
        } catch (e) {
            console.error('Save error:', e);
        }
    }

    createBackground(width, height) {
        const bg = this.add.graphics();
        const groundY = height - 200;

        // Sky gradient (smoother with more steps)
        for (let i = 0; i < 20; i++) {
            const t = i / 20;
            const r = Math.floor(125 + (186 - 125) * t);
            const gv = Math.floor(211 + (230 - 211) * t);
            const b = Math.floor(252 + (253 - 252) * t);
            bg.fillStyle((r << 16) | (gv << 8) | b);
            bg.fillRect(0, (groundY / 20) * i, width, groundY / 20 + 1);
        }

        // Sun with animated rays
        const sunX = width - 45;
        const sunY = 60;
        this.sunRaysContainer = this.add.container(sunX, sunY);
        for (let i = 0; i < 10; i++) {
            const ray = this.add.image(0, 0, 'sunRay').setOrigin(0, 0.5);
            ray.setAlpha(0.25);
            ray.setAngle(i * 36);
            ray.setScale(1.2 + Math.random() * 0.6, 0.6 + Math.random() * 0.4);
            this.sunRaysContainer.add(ray);
        }
        this.tweens.add({
            targets: this.sunRaysContainer,
            angle: 360,
            duration: 90000,
            repeat: -1
        });
        // Sun core (on top of rays)
        this.add.circle(sunX, sunY, 38, 0xFCD34D);
        this.add.circle(sunX, sunY, 28, 0xFEF3C7);

        // Distant hills (far layer, slow parallax)
        const hillsFar = this.add.graphics();
        hillsFar.fillStyle(0xA7F3D0, 0.5);
        hillsFar.beginPath();
        hillsFar.moveTo(0, groundY);
        for (let x = 0; x <= width; x += 30) {
            hillsFar.lineTo(x, groundY - 50 - Math.sin(x * 0.012) * 30 - Math.sin(x * 0.025 + 1) * 15);
        }
        hillsFar.lineTo(width, groundY);
        hillsFar.closePath();
        hillsFar.fillPath();

        // Near hills (closer, slightly darker)
        const hillsNear = this.add.graphics();
        hillsNear.fillStyle(0x6EE7B7, 0.6);
        hillsNear.beginPath();
        hillsNear.moveTo(0, groundY);
        for (let x = 0; x <= width; x += 20) {
            hillsNear.lineTo(x, groundY - 25 - Math.sin(x * 0.02 + 2) * 20 - Math.sin(x * 0.04) * 10);
        }
        hillsNear.lineTo(width, groundY);
        hillsNear.closePath();
        hillsNear.fillPath();

        // Far clouds (small, slow, high)
        for (let i = 0; i < 2; i++) {
            const cloud = this.add.container(-60 + i * 200, 30 + i * 20);
            cloud.add(this.add.ellipse(0, 0, 35, 16, COLORS.white, 0.5));
            cloud.add(this.add.ellipse(-10, 3, 22, 12, COLORS.white, 0.5));
            cloud.add(this.add.ellipse(14, 2, 26, 14, COLORS.white, 0.5));
            this.tweens.add({
                targets: cloud,
                x: width + 60,
                duration: 80000 + i * 20000,
                repeat: -1,
                onRepeat: () => { cloud.x = -60; }
            });
        }

        // Mid clouds (medium, medium speed)
        for (let i = 0; i < 3; i++) {
            const cloud = this.add.container(60 + i * 140, 50 + i * 25);
            cloud.add(this.add.ellipse(0, 0, 45, 24, COLORS.white));
            cloud.add(this.add.ellipse(-15, 5, 30, 18, COLORS.white));
            cloud.add(this.add.ellipse(18, 3, 35, 20, COLORS.white));
            this.tweens.add({
                targets: cloud,
                x: width + 80,
                duration: 50000 + i * 15000,
                repeat: -1,
                onRepeat: () => { cloud.x = -80; }
            });
        }

        // Ground
        bg.fillStyle(COLORS.grass);
        bg.fillRect(0, groundY, width, height - groundY);
        bg.fillStyle(0x4ADE80);
        bg.fillRect(0, groundY, width, 6);

        // Ambient floating leaves (only if particles enabled)
        if (this.gameState.settings?.particlesEnabled !== false) {
            this.ambientLeaves = this.add.particles(0, 0, 'leaf', {
                x: { min: 0, max: width },
                y: -10,
                lifespan: { min: 6000, max: 10000 },
                speedX: { min: -15, max: 15 },
                speedY: { min: 12, max: 25 },
                scale: { start: 0.6, end: 0.3 },
                alpha: { start: 0.7, end: 0 },
                rotate: { min: 0, max: 360 },
                frequency: 2500,
                quantity: 1
            });

            // Ambient sparkles near the stand area
            this.ambientSparkles = this.add.particles(0, 0, 'sparkle', {
                x: { min: width / 2 - 100, max: width / 2 + 100 },
                y: { min: height / 2 - 80, max: height / 2 + 40 },
                lifespan: { min: 1500, max: 3000 },
                speed: { min: 5, max: 20 },
                scale: { start: 0.2, end: 0 },
                alpha: { start: 0.4, end: 0 },
                frequency: 4000,
                quantity: 1
            });
        }
    }

    createStand(width, height) {
        const standLevel = Economy.getStandLevel(this.gameState.totalEarned);

        this.standContainer = this.add.container(width / 2, height / 2 - 30);

        // Stand
        this.stand = this.add.image(0, 50, 'stand' + standLevel.level).setScale(1.6);
        this.standContainer.add(this.stand);

        // Marlow
        this.marlow = this.add.image(0, -5, 'marlow').setScale(1.1);
        this.standContainer.add(this.marlow);

        // Tap zone
        this.tapZone = this.add.rectangle(0, 30, 280, 220, 0x000000, 0);
        this.tapZone.setInteractive({ useHandCursor: true });
        this.standContainer.add(this.tapZone);
        this.tapZone.on('pointerdown', (pointer) => this.onTap(pointer));

        // Stand label
        this.standLabel = this.add.text(0, 135, standLevel.name, {
            fontSize: '15px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#78350F',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.standContainer.add(this.standLabel);

        // Steam/aroma particles rising from the stand
        if (this.gameState.settings?.particlesEnabled !== false) {
            this.steamParticles = this.add.particles(0, 0, 'steamParticle', {
                x: { min: -30, max: 30 },
                y: 10,
                lifespan: { min: 1500, max: 2500 },
                speedY: { min: -20, max: -10 },
                speedX: { min: -8, max: 8 },
                scale: { start: 0.5, end: 0.1 },
                alpha: { start: 0.3, end: 0 },
                frequency: 800,
                quantity: 1
            });
            this.standContainer.add(this.steamParticles);
        }

        this.updateDecorations();
    }

    updateDecorations() {
        if (this.decorations) {
            this.decorations.forEach(d => d.destroy());
        }
        this.decorations = [];
        const ul = this.gameState.upgradeLevels;

        // Helper positions and configurations
        const helperConfigs = [
            { id: 'poppyHelper', texture: 'poppy', x: -95, y: 95, scale: 0.85, name: 'Poppy', animate: true },
            { id: 'winnieGuard', texture: 'winnie', x: 95, y: 95, scale: 0.85, name: 'Winnie', animate: false },
            { id: 'violetMarketing', texture: 'violet', x: 70, y: 5, scale: 0.7, name: 'Violet', animate: false },
            { id: 'daddyManager', texture: 'daddy', x: -45, y: -25, scale: 0.6, name: 'Daddy', animate: false },
            { id: 'mommyAccountant', texture: 'mommy', x: 45, y: -25, scale: 0.6, name: 'Mommy', animate: false },
            { id: 'amelieFriend', texture: 'amelie', x: -70, y: 5, scale: 0.7, name: 'Amelie', animate: false },
            { id: 'maddieFriend', texture: 'maddie', x: -110, y: 30, scale: 0.65, name: 'Maddie', animate: false }
        ];

        helperConfigs.forEach(config => {
            if (ul[config.id]) {
                // Create container for helper + name
                const helperContainer = this.add.container(config.x, config.y);

                // Add helper sprite
                const sprite = this.add.image(0, 0, config.texture).setScale(config.scale);
                helperContainer.add(sprite);

                // Add name label below helper
                const nameLabel = this.add.text(0, 28, config.name, {
                    fontSize: '10px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: '#374151',
                    fontStyle: 'bold',
                    backgroundColor: '#FFFFFFCC',
                    padding: { x: 4, y: 2 }
                }).setOrigin(0.5);
                helperContainer.add(nameLabel);

                this.standContainer.add(helperContainer);
                this.decorations.push(helperContainer);

                // Add animation for Poppy
                if (config.animate) {
                    this.tweens.add({
                        targets: helperContainer,
                        y: config.y - 5,
                        duration: 400,
                        yoyo: true,
                        repeat: -1
                    });
                }
            }
        });

        // Labubu charm (special collectible, no name label)
        if (ul.labubuCharm) {
            const labubu = this.add.image(-55, -55, 'labubu').setScale(0.65);
            this.standContainer.add(labubu);
            this.decorations.push(labubu);
            // Add gentle floating animation
            this.tweens.add({
                targets: labubu,
                y: -60,
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createUI(width, height) {
        // Money display - clean card style
        this.moneyCard = this.add.container(width / 2, 55);

        const moneyBg = this.add.graphics();
        moneyBg.fillStyle(COLORS.white, 0.95);
        moneyBg.fillRoundedRect(-110, -28, 220, 56, 16);
        moneyBg.lineStyle(2, COLORS.gray200);
        moneyBg.strokeRoundedRect(-110, -28, 220, 56, 16);
        this.moneyCard.add(moneyBg);

        this.moneyText = this.add.text(0, -4, '$0.00', {
            fontSize: '28px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#166534',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.moneyCard.add(this.moneyText);

        // Stats text
        this.statsText = this.add.text(width / 2, 100, '', {
            fontSize: '13px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#6B7280'
        }).setOrigin(0.5);

        // Stage badge (top-left) - hidden until stage 1
        this.stageBadge = this.add.container(75, 55);
        this.stageBadgeBg = this.add.graphics();
        this.stageBadge.add(this.stageBadgeBg);
        this.stageBadgeText = this.add.text(0, 0, '', {
            fontSize: '11px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.stageBadge.add(this.stageBadgeText);
        this.stageBadge.setVisible(false);

        // Streak badge (below stage badge) - hidden until stage 4
        this.streakBadge = this.add.container(65, 93);
        this.streakBadgeBg = this.add.graphics();
        this.streakBadge.add(this.streakBadgeBg);
        this.streakBadgeText = this.add.text(0, 0, '', {
            fontSize: '11px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.streakBadge.add(this.streakBadgeText);
        this.streakBadge.setVisible(false);

        // Prestige display (top-right) - hidden until stage 3
        this.prestigeDisplay = this.add.container(width - 70, 55);
        this.prestigeDisplayBg = this.add.graphics();
        this.prestigeDisplay.add(this.prestigeDisplayBg);
        this.prestigeDisplayText = this.add.text(0, 0, '', {
            fontSize: '12px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.prestigeDisplay.add(this.prestigeDisplayText);
        this.prestigeDisplay.setVisible(false).setInteractive(
            new Phaser.Geom.Rectangle(-45, -16, 90, 32), Phaser.Geom.Rectangle.Contains
        );
        this.prestigeDisplay.on('pointerdown', () => this.openPrestige());

        // Progress bar
        this.progressContainer = this.add.container(width / 2, height / 2 + 125);

        const progressBg = this.add.image(0, 0, 'progressBg');
        this.progressContainer.add(progressBg);

        this.progressFill = this.add.image(-140, 0, 'progressFill');
        this.progressFill.setOrigin(0, 0.5);
        this.progressFill.setCrop(0, 0, 0, 12);
        this.progressContainer.add(this.progressFill);

        this.progressText = this.add.text(0, 20, '', {
            fontSize: '12px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#6B7280'
        }).setOrigin(0.5);
        this.progressContainer.add(this.progressText);

        // Stage progress bar (below stand progress bar) - hidden until stage 1
        this.stageProgressFill = this.add.graphics();
        this.progressContainer.add(this.stageProgressFill);
        this.stageProgressText = this.add.text(0, 50, '', {
            fontSize: '11px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#6B7280'
        }).setOrigin(0.5);
        this.progressContainer.add(this.stageProgressText);
        this.stageProgressFill.setVisible(false);
        this.stageProgressText.setVisible(false);

        // Event banner
        this.eventBanner = this.add.container(width / 2, 145);
        this.eventBanner.setVisible(false);

        const eventBg = this.add.graphics();
        eventBg.fillStyle(COLORS.lemonYellow, 0.95);
        eventBg.fillRoundedRect(-160, -32, 320, 64, 12);
        this.eventBanner.add(eventBg);

        this.eventText = this.add.text(0, 0, '', {
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#78350F',
            align: 'center',
            fontStyle: 'bold',
            wordWrap: { width: 300, useAdvancedWrap: true }
        }).setOrigin(0.5);
        this.eventBanner.add(this.eventText);

        // Combo counter display (hidden until combo >= 2)
        this.comboText = this.add.text(width / 2, height / 2 - 130, '', {
            fontSize: '32px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#F59E0B',
            fontStyle: 'bold',
            stroke: '#78350F',
            strokeThickness: 3
        }).setOrigin(0.5).setAlpha(0).setDepth(10);

        // Flavor booster row (above nav) - hidden until stage 2
        this.boosterRow = this.add.container(width / 2, height - 120);
        this.boosterRow.setVisible(false);
        this._boosterWidth = width;

        // Bottom navigation
        this.createBottomNav(width, height);
        this.updateUI();

        // Show pending streak bonus after short delay (if new day)
        if (this._pendingStreakBonus && this._pendingStreakBonus > 0) {
            this.time.delayedCall(1200, () => {
                const currentStage = Economy.getProgressionStage(this.gameState.totalEarned);
                if (currentStage.index >= 1) {
                    this.showFloatingText(
                        width / 2, height / 2,
                        `🔥 Streak! +$${this._pendingStreakBonus.toFixed(2)}`,
                        '#F59E0B', 22
                    );
                }
                this._pendingStreakBonus = 0;
            });
        }
    }

    createBottomNav(width, height) {
        const navY = height - 55;

        // Create container for entire nav (for easy destruction on resize)
        this.bottomNav = this.add.container(0, 0);

        const navBg = this.add.graphics();
        navBg.fillStyle(COLORS.white, 0.98);
        navBg.fillRoundedRect(20, navY - 35, width - 40, 70, 20);
        navBg.lineStyle(1, COLORS.gray200);
        navBg.strokeRoundedRect(20, navY - 35, width - 40, 70, 20);
        this.bottomNav.add(navBg);

        // 4-button nav (Daily button hidden until Stage 1 unlock)
        const buttonSpacing = Math.min(88, (width - 60) / 4);
        const centerX = width / 2;

        const buttons = [
            { x: centerX - buttonSpacing * 1.5, label: 'Shop',   icon: '🛒', callback: () => this.openShop(),   ref: null },
            { x: centerX - buttonSpacing * 0.5, label: 'Quests', icon: '⭐', callback: () => this.openQuests(), ref: null },
            { x: centerX + buttonSpacing * 0.5, label: 'Daily',  icon: '📋', callback: () => this.openDailyChallenges(), ref: 'dailyNavBtn', hidden: true },
            { x: centerX + buttonSpacing * 1.5, label: 'Menu',   icon: '⚙️', callback: () => this.openSettings(), ref: null }
        ];

        buttons.forEach(btn => {
            const container = this.add.container(btn.x, navY);

            const hitArea = this.add.rectangle(0, 0, 75, 60, 0x000000, 0).setInteractive({ useHandCursor: true });
            container.add(hitArea);

            const icon = this.add.text(0, -8, btn.icon, { fontSize: '22px' }).setOrigin(0.5);
            container.add(icon);

            const label = this.add.text(0, 16, btn.label, {
                fontSize: '11px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#374151',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            container.add(label);

            hitArea.on('pointerdown', () => {
                soundManager.play('click');
                this.tweens.add({
                    targets: container,
                    scale: 0.9,
                    duration: 60,
                    yoyo: true,
                    onComplete: btn.callback
                });
            });

            if (btn.hidden) container.setVisible(false);
            if (btn.ref) this[btn.ref] = container;

            this.bottomNav.add(container);
        });
    }

    createParticles() {
        this.coinParticles = this.add.particles(0, 0, 'coin', {
            speed: { min: 80, max: 180 },
            angle: { min: -130, max: -50 },
            scale: { start: 0.7, end: 0 },
            lifespan: 700,
            gravityY: 280,
            emitting: false
        });

        this.sparkleParticles = this.add.particles(0, 0, 'sparkle', {
            speed: { min: 40, max: 120 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 500,
            emitting: false
        });
    }

    onTap(pointer) {
        soundManager.play('click');

        // Start music on first tap (browser audio policy requires user gesture)
        if (!musicManager.playing && musicManager.enabled) {
            musicManager.start();
        }

        // Update combo
        const now = Date.now();
        if (now - this.lastTapTime < 2000) {
            this.comboCount++;
        } else {
            this.comboCount = 1;
        }
        this.lastTapTime = now;

        // Reset combo decay timer
        if (this.comboTimeout) clearTimeout(this.comboTimeout);
        this.comboTimeout = setTimeout(() => this.resetCombo(), 2000);

        // Calculate tap value with combo bonus
        let clickValue = Economy.calculateClickValue(this.gameState.upgradeLevels);
        clickValue *= Economy.calculatePriceMultiplier(this.gameState.upgradeLevels);
        clickValue *= this.eventMultiplier;

        // Combo bonus: +2% per combo step, capped at +50%
        const comboBonus = 1 + Math.min(this.comboCount - 1, 25) * 0.02;
        clickValue *= comboBonus;

        // Prestige multiplier
        const prestigeMult = Economy.calculatePrestigeMultiplier(this.gameState.prestigeStars || 0);
        clickValue *= prestigeMult;

        // Active booster (tap or all multiplier)
        const activeBooster = this.gameState.activeBooster;
        if (activeBooster && Date.now() < (activeBooster.endsAt || 0)) {
            const boosterDef = Economy.FLAVOR_BOOSTERS.find(b => b.id === activeBooster.id);
            if (boosterDef && (boosterDef.effect === 'tapMultiplier' || boosterDef.effect === 'allMultiplier')) {
                clickValue *= boosterDef.value;
            }
        } else if (activeBooster && Date.now() >= (activeBooster.endsAt || 0)) {
            this.gameState.activeBooster = null;
            this._lastBoosterSig = null;
        }

        const luckyChance = Economy.calculateLuckyChance(this.gameState.upgradeLevels);
        const isLucky = Math.random() < luckyChance;

        if (isLucky) {
            clickValue *= 5;
            this.gameState.luckyBonuses = (this.gameState.luckyBonuses || 0) + 1;
            soundManager.play('luckyBig');
        }

        this.gameState.money += clickValue;
        this.gameState.totalEarned += clickValue;
        this.gameState.totalSales++;

        // Daily stats tracking
        if (!this.gameState.dailyStats) {
            this.gameState.dailyStats = { taps: 0, earned: 0, luckyBonuses: 0, upgradesBought: 0, maxCombo: 0 };
        }
        this.gameState.dailyStats.taps = (this.gameState.dailyStats.taps || 0) + 1;
        this.gameState.dailyStats.earned = (this.gameState.dailyStats.earned || 0) + clickValue;
        if (isLucky) {
            this.gameState.dailyStats.luckyBonuses = (this.gameState.dailyStats.luckyBonuses || 0) + 1;
        }
        this.gameState.dailyStats.maxCombo = Math.max(this.gameState.dailyStats.maxCombo || 0, this.comboCount);

        // Floating text
        this.showFloatingText(
            pointer.x, pointer.y - 30,
            isLucky ? `+$${clickValue.toFixed(2)} LUCKY!` : `+$${clickValue.toFixed(2)}`,
            isLucky ? '#F59E0B' : '#166534',
            isLucky ? 28 : 20
        );

        // Combo sound (rising pitch)
        if (this.comboCount >= 3) {
            soundManager._comboHint = this.comboCount;
            soundManager.play('combo');
        }

        // Update combo display
        this.updateComboDisplay();

        // Particles
        if (this.gameState.settings?.particlesEnabled !== false) {
            this.coinParticles.setPosition(pointer.x, pointer.y);
            this.coinParticles.explode(isLucky ? 8 : Math.min(2 + Math.floor(this.comboCount / 5), 6));

            if (isLucky) {
                this.sparkleParticles.setPosition(pointer.x, pointer.y);
                this.sparkleParticles.explode(12);
            }

            // Tap ripple effect
            this.showRipple(pointer.x, pointer.y, isLucky);
        }

        // Lucky hit screen flash
        if (isLucky) {
            this.cameras.main.flash(300, 255, 215, 0, false, (cam, progress) => {
                // flash callback - no action needed
            });
        }

        // Marlow bounce (scales with combo)
        const bounceScale = Math.min(1.2 + this.comboCount * 0.02, 1.5);
        this.tweens.add({
            targets: this.marlow,
            scaleX: bounceScale,
            scaleY: 1.1 - (bounceScale - 1.2) * 0.5,
            duration: 60,
            yoyo: true
        });

        this.updateUI();
        this.checkStandUpgrade();
    }

    updateComboDisplay() {
        if (this.comboCount >= 2) {
            this.comboText.setText(`x${this.comboCount} COMBO!`);
            this.comboText.setAlpha(1);

            // Scale pulse on update
            const pulseScale = Math.min(1 + this.comboCount * 0.03, 1.8);
            this.tweens.add({
                targets: this.comboText,
                scale: pulseScale,
                duration: 80,
                yoyo: true,
                ease: 'Quad.out'
            });

            // Color shifts at milestones
            if (this.comboCount >= 20) {
                this.comboText.setColor('#EF4444'); // Red for high combos
            } else if (this.comboCount >= 10) {
                this.comboText.setColor('#F97316'); // Orange
            } else {
                this.comboText.setColor('#F59E0B'); // Amber default
            }
        } else {
            this.comboText.setAlpha(0);
        }
    }

    resetCombo() {
        if (this.comboCount >= 2) {
            // Fade out combo text
            this.tweens.add({
                targets: this.comboText,
                alpha: 0,
                scale: 0.5,
                duration: 300,
                ease: 'Power2'
            });
        }
        this.comboCount = 0;
    }

    showRipple(x, y, isLucky) {
        const color = isLucky ? 0xFCD34D : 0xFFFFFF;
        const maxRadius = isLucky ? 60 : 35;
        const ripple = this.add.circle(x, y, 10, color, 0).setDepth(5);
        ripple.setStrokeStyle(isLucky ? 3 : 2, color, 0.6);

        this.tweens.add({
            targets: ripple,
            radius: maxRadius,
            alpha: 0,
            duration: isLucky ? 500 : 350,
            ease: 'Quad.out',
            onUpdate: () => {
                ripple.setStrokeStyle(isLucky ? 3 : 2, color, ripple.alpha * 0.6);
            },
            onComplete: () => ripple.destroy()
        });
    }

    showFloatingText(x, y, text, color, fontSize) {
        const size = fontSize || 20;
        const floatText = this.add.text(x, y, text, {
            fontSize: `${size}px`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: color,
            fontStyle: 'bold',
            stroke: size > 20 ? '#000000' : undefined,
            strokeThickness: size > 20 ? 2 : 0
        }).setOrigin(0.5).setDepth(10);

        this.tweens.add({
            targets: floatText,
            y: y - 60,
            alpha: 0,
            scale: size > 20 ? 1.3 : 1,
            duration: 900,
            ease: 'Power2',
            onComplete: () => floatText.destroy()
        });
    }

    processIdleIncome() {
        const autoIncome = Economy.calculateAutoIncome(this.gameState.upgradeLevels);
        if (autoIncome > 0) {
            let income = autoIncome * this.eventMultiplier;
            income *= Economy.calculatePriceMultiplier(this.gameState.upgradeLevels);

            // Prestige multiplier
            income *= Economy.calculatePrestigeMultiplier(this.gameState.prestigeStars || 0);

            // Streak multiplier
            income *= Economy.getStreakMultiplier(this.gameState.streak || 0);

            // Active booster (auto or all multiplier)
            const activeBooster = this.gameState.activeBooster;
            if (activeBooster && Date.now() < (activeBooster.endsAt || 0)) {
                const boosterDef = Economy.FLAVOR_BOOSTERS.find(b => b.id === activeBooster.id);
                if (boosterDef && (boosterDef.effect === 'autoMultiplier' || boosterDef.effect === 'allMultiplier')) {
                    income *= boosterDef.value;
                }
            } else if (activeBooster && Date.now() >= (activeBooster.endsAt || 0)) {
                this.gameState.activeBooster = null;
                this._lastBoosterSig = null;
            }

            this.gameState.money += income;
            this.gameState.totalEarned += income;
            this.updateUI();
        }
    }

    tryRandomEvent() {
        if (this.activeEvent) return;
        const event = Economy.tryGetRandomEvent(this.gameState.upgradeLevels);
        if (event) {
            this.activeEvent = event;
            soundManager.play('quest');
            this.eventText.setText(`${event.name}: ${event.description}`);
            this.eventBanner.setVisible(true);
            this.eventBanner.setScale(0);
            this.tweens.add({ targets: this.eventBanner, scale: 1, duration: 250, ease: 'Back.out' });

            if (event.effect.type === 'tempMultiplier') {
                this.eventMultiplier = event.effect.value;
                this.time.delayedCall(event.effect.duration, () => {
                    this.eventMultiplier = 1;
                    this.activeEvent = null;
                    this.eventBanner.setVisible(false);
                });
            } else if (event.effect.type === 'tempBonus' || event.effect.type === 'instantBonus') {
                this.gameState.money += event.effect.value;
                this.showFloatingText(this.scale.width / 2, 200, `+$${event.effect.value}!`, '#F59E0B');
                this.time.delayedCall(3000, () => {
                    this.activeEvent = null;
                    this.eventBanner.setVisible(false);
                });
            }
            this.updateUI();
        }
    }

    checkQuests() {
        const stats = {
            totalSales: this.gameState.totalSales,
            totalEarned: this.gameState.totalEarned,
            luckyBonuses: this.gameState.luckyBonuses || 0
        };
        const completed = Economy.checkQuests(stats, this.gameState.upgradeLevels, this.gameState.completedQuests);

        for (const quest of completed) {
            this.gameState.completedQuests.push(quest.id);
            this.gameState.money += quest.reward;
            soundManager.play('quest');
            this.showQuestComplete(quest);
        }

        // Check daily challenges
        const today = Economy.getTodayString();
        if (!this.gameState.dailyStats) {
            this.gameState.dailyStats = { taps: 0, earned: 0, luckyBonuses: 0, upgradesBought: 0, maxCombo: 0 };
        }
        if (!this.gameState.dailyCompleted) this.gameState.dailyCompleted = [];

        const dailyChallenges = Economy.getDailyChallenges(today);
        let newDailyCompleted = false;
        dailyChallenges.forEach((ch, i) => {
            const key = `day_${today}_${i}`;
            if (!this.gameState.dailyCompleted.includes(key) &&
                Economy.checkDailyChallenge(ch, this.gameState.dailyStats)) {
                this.gameState.dailyCompleted.push(key);
                this.gameState.money += ch.reward;
                soundManager.play('quest');
                const { width, height } = this.scale;
                this.showFloatingText(width / 2, height / 2 - 40,
                    `📋 Daily: +$${ch.reward}!`, '#F59E0B', 20);
                newDailyCompleted = true;
            }
        });

        // All 3 daily challenges bonus
        const todayKeys = dailyChallenges.map((_, i) => `day_${today}_${i}`);
        const allDone = todayKeys.every(k => this.gameState.dailyCompleted.includes(k));
        const bonusKey = `bonus_${today}`;
        if (allDone && !this.gameState.dailyCompleted.includes(bonusKey)) {
            this.gameState.dailyCompleted.push(bonusKey);
            this.gameState.money += Economy.DAILY_BONUS_REWARD;
            soundManager.play('levelUp');
            const { width, height } = this.scale;
            this.showFloatingText(width / 2, height / 2 - 60,
                `🏆 All Daily Done! +$${Economy.DAILY_BONUS_REWARD}!`, '#10B981', 24);
            newDailyCompleted = true;
        }

        if (completed.length > 0 || newDailyCompleted) {
            this.updateUI();
            this.saveGame();
        }
    }

    showQuestComplete(quest) {
        const { width, height } = this.scale;
        const banner = this.add.container(width / 2, height / 2);

        const bg = this.add.graphics();
        bg.fillStyle(COLORS.purple, 0.95);
        bg.fillRoundedRect(-140, -55, 280, 110, 16);
        banner.add(bg);

        banner.add(this.add.text(0, -25, '⭐ Quest Complete!', {
            fontSize: '18px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#FFFFFF',
            fontStyle: 'bold',
            wordWrap: { width: 250, useAdvancedWrap: true }
        }).setOrigin(0.5));

        banner.add(this.add.text(0, 5, quest.name, {
            fontSize: '16px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#E9D5FF',
            wordWrap: { width: 250, useAdvancedWrap: true }
        }).setOrigin(0.5));

        banner.add(this.add.text(0, 32, `+$${quest.reward}`, {
            fontSize: '22px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#FCD34D',
            fontStyle: 'bold'
        }).setOrigin(0.5));

        banner.setScale(0);
        this.tweens.add({ targets: banner, scale: 1, duration: 250, ease: 'Back.out' });
        this.time.delayedCall(2200, () => {
            this.tweens.add({
                targets: banner,
                scale: 0,
                alpha: 0,
                duration: 200,
                onComplete: () => banner.destroy()
            });
        });
    }

    checkStandUpgrade() {
        const newLevel = Economy.getStandLevel(this.gameState.totalEarned);
        const currentNum = parseInt(this.stand.texture.key.replace('stand', ''));

        if (newLevel.level > currentNum) {
            soundManager.play('levelUp');
            this.stand.setTexture('stand' + newLevel.level);
            this.standLabel.setText(newLevel.name);
            this.sparkleParticles.setPosition(this.scale.width / 2, this.scale.height / 2);
            this.sparkleParticles.explode(25);
            this.showFloatingText(this.scale.width / 2, this.scale.height / 2 - 80, `🎉 ${newLevel.name}!`, '#F59E0B');
            this.updateDecorations();
        }
    }

    updateUI() {
        this.moneyText.setText('$' + this.gameState.money.toFixed(2));

        const autoIncome = Economy.calculateAutoIncome(this.gameState.upgradeLevels);
        const clickValue = Economy.calculateClickValue(this.gameState.upgradeLevels);
        this.statsText.setText(`Tap: $${clickValue.toFixed(2)}  •  Auto: $${autoIncome.toFixed(2)}/s`);

        const progress = Economy.getStandProgress(this.gameState.totalEarned);
        const progressWidth = Math.floor(progress.progress * 280);
        this.progressFill.setCrop(0, 0, progressWidth, 12);

        if (progress.next) {
            this.progressText.setText(`Stand: ${progress.next.name} ($${progress.next.moneyRequired})`);
        } else {
            this.progressText.setText('🏆 Max Stand Level!');
        }

        // --- Stage system updates ---
        const currentStage = Economy.getProgressionStage(this.gameState.totalEarned);

        // Detect stage change and trigger transition (first time only)
        if (currentStage.index > (this.lastKnownStageIndex !== undefined ? this.lastKnownStageIndex : -1)) {
            this.lastKnownStageIndex = currentStage.index;
            if (!(this.gameState.seenStages || []).includes(currentStage.id)) {
                this.triggerStageTransition(currentStage);
            }
        }

        // Stage badge (visible at stage >= 1)
        if (currentStage.index >= 1 && this.stageBadge) {
            this.stageBadge.setVisible(true);
            this.stageBadgeBg.clear();
            this.stageBadgeBg.fillStyle(currentStage.color, 0.92);
            this.stageBadgeBg.fillRoundedRect(-50, -16, 100, 32, 10);
            this.stageBadgeText.setText(currentStage.name);
        }

        // Stage progress bar (visible at stage >= 1)
        if (currentStage.index >= 1 && this.stageProgressFill) {
            this.stageProgressFill.setVisible(true);
            this.stageProgressText.setVisible(true);
            const stageProg = Economy.getStageProgress(this.gameState.totalEarned);
            const stageBarW = Math.floor(stageProg * 280);
            this.stageProgressFill.clear();
            // Background track
            this.stageProgressFill.fillStyle(0xE5E7EB, 1);
            this.stageProgressFill.fillRoundedRect(-140, 36, 280, 10, 5);
            // Fill
            if (stageBarW > 0) {
                this.stageProgressFill.fillStyle(currentStage.color, 1);
                this.stageProgressFill.fillRoundedRect(-140, 36, stageBarW, 10, 5);
            }
            if (currentStage.thresholdMax !== Infinity) {
                const nextStage = Economy.PROGRESSION_STAGES[currentStage.index + 1];
                this.stageProgressText.setText(nextStage ? `Stage: ${nextStage.name} ($${nextStage.thresholdMin.toLocaleString()})` : '');
            } else {
                this.stageProgressText.setText('🌟 Maximum Stage!');
            }
        }

        // Streak badge (visible at stage >= 4)
        if (currentStage.index >= 4 && this.streakBadge) {
            this.streakBadge.setVisible(true);
            const streak = this.gameState.streak || 0;
            this.streakBadgeBg.clear();
            this.streakBadgeBg.fillStyle(0xF97316, 0.92);
            this.streakBadgeBg.fillRoundedRect(-40, -14, 80, 28, 8);
            this.streakBadgeText.setText(`🔥 ${streak}d`);
        }

        // Prestige display (visible at stage >= 3)
        if (currentStage.index >= 3 && this.prestigeDisplay) {
            this.prestigeDisplay.setVisible(true);
            const stars = this.gameState.prestigeStars || 0;
            const canPrestige = Economy.canPrestige(this.gameState.totalEarned);
            const bgColor = canPrestige ? 0xF59E0B : 0x8B5CF6;
            this.prestigeDisplayBg.clear();
            this.prestigeDisplayBg.fillStyle(bgColor, 0.92);
            this.prestigeDisplayBg.fillRoundedRect(-45, -16, 90, 32, 10);
            this.prestigeDisplayText.setText(canPrestige ? `★ ${stars} ✨` : `★ ${stars}`);
        }

        // Booster row (visible at stage >= 2)
        if (currentStage.index >= 2 && this.boosterRow) {
            this.boosterRow.setVisible(true);
            this.refreshBoosterRow();
        }
    }

    refreshBoosterRow() {
        if (!this.boosterRow) return;
        // Clear existing children except we recreate each frame check
        // Use a flag to avoid recreating every frame — only update on state change
        const boosters = Economy.getAvailableBoosters(this.gameState.totalEarned);
        const activeBooster = this.gameState.activeBooster;
        const cooldownEnd = this.gameState.boosterCooldown || 0;
        const isReady = Economy.isBoosterReady(cooldownEnd);
        const cooldownSecs = Economy.getBoosterCooldownRemaining(cooldownEnd);

        // Build a state signature to avoid unnecessary rebuilds
        const sig = boosters.map(b => b.id).join(',') + '|' +
            (activeBooster ? activeBooster.id : 'none') + '|' +
            (isReady ? 'ready' : Math.floor(cooldownSecs / 5));

        if (this._lastBoosterSig === sig) return;
        this._lastBoosterSig = sig;

        // Rebuild
        this.boosterRow.removeAll(true);

        const spacing = 70;
        const startX = -(boosters.length - 1) * spacing / 2;

        boosters.forEach((booster, i) => {
            const bx = startX + i * spacing;
            const isActive = activeBooster && activeBooster.id === booster.id && Date.now() < (activeBooster.endsAt || 0);
            const canActivate = isReady && !activeBooster;

            const circle = this.add.circle(bx, 0, 28, booster.color, isActive ? 1 : 0.75);
            this.boosterRow.add(circle);

            if (isActive) {
                // Glowing ring for active booster
                const ring = this.add.circle(bx, 0, 33, booster.color, 0);
                ring.setStrokeStyle(3, booster.color, 0.6);
                this.boosterRow.add(ring);
                const secsLeft = Math.max(0, Math.ceil(((activeBooster.endsAt || 0) - Date.now()) / 1000));
                const activeText = this.add.text(bx, 34, `${secsLeft}s`, {
                    fontSize: '10px', fontFamily: 'system-ui', color: '#FFFFFF', fontStyle: 'bold'
                }).setOrigin(0.5);
                this.boosterRow.add(activeText);
            } else if (!isReady) {
                // Cooldown overlay
                const cdOverlay = this.add.circle(bx, 0, 28, 0x000000, 0.4);
                this.boosterRow.add(cdOverlay);
                const cdText = this.add.text(bx, 0, `${cooldownSecs}s`, {
                    fontSize: '11px', fontFamily: 'system-ui', color: '#FFFFFF', fontStyle: 'bold'
                }).setOrigin(0.5);
                this.boosterRow.add(cdText);
            }

            const emoji = { strawberry: '🍓', blueberry: '🫐', mango: '🥭' }[booster.id] || '🍋';
            const emojiText = this.add.text(bx, 0, emoji, { fontSize: '18px' }).setOrigin(0.5);
            this.boosterRow.add(emojiText);

            const nameText = this.add.text(bx, -42, booster.name.split(' ')[0], {
                fontSize: '10px', fontFamily: 'system-ui', color: '#374151', fontStyle: 'bold'
            }).setOrigin(0.5);
            this.boosterRow.add(nameText);

            if (canActivate) {
                const hitArea = this.add.circle(bx, 0, 30, 0x000000, 0).setInteractive({ useHandCursor: true });
                this.boosterRow.add(hitArea);
                hitArea.on('pointerdown', () => this.activateBooster(booster));
            }
        });
    }

    activateBooster(booster) {
        if (!Economy.isBoosterReady(this.gameState.boosterCooldown)) return;
        if (this.gameState.activeBooster) return;
        this.gameState.activeBooster = { id: booster.id, endsAt: Date.now() + booster.duration };
        this.gameState.boosterCooldown = Date.now() + Economy.BOOSTER_COOLDOWN;
        soundManager.play('upgrade');
        this.showFloatingText(this.scale.width / 2, this.scale.height / 2 - 60, `${booster.name} activated!`, '#EC4899', 18);
        this._lastBoosterSig = null; // Force refresh
        this.saveGame();
    }

    triggerStageTransition(stage) {
        if (!stage || !this.gameState) return;
        // Mark as seen
        if (!this.gameState.seenStages) this.gameState.seenStages = [];
        this.gameState.seenStages.push(stage.id);
        this.saveGame();

        const { width, height } = this.scale;
        soundManager.play('levelUp');

        // Full-screen color wash
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, stage.color, 0).setDepth(100);

        this.tweens.add({
            targets: overlay,
            fillAlpha: 0.88,
            duration: 320,
            ease: 'Quad.easeIn',
            onComplete: () => {
                const nameText = this.add.text(width / 2, height / 2 - 55, stage.name, {
                    fontSize: '40px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: '#FFFFFF',
                    fontStyle: 'bold',
                    stroke: '#00000033',
                    strokeThickness: 3
                }).setOrigin(0.5).setDepth(101).setAlpha(0);

                const tagText = this.add.text(width / 2, height / 2 + 5, stage.tagline, {
                    fontSize: '17px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: '#FFFFFFEE',
                    align: 'center',
                    wordWrap: { width: width - 60 }
                }).setOrigin(0.5).setDepth(101).setAlpha(0);

                const unlockText = stage.achievementText ? this.add.text(width / 2, height / 2 + 55,
                    '✨ ' + stage.achievementText, {
                        fontSize: '15px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        color: '#FEFCE8',
                        fontStyle: 'bold',
                        align: 'center'
                    }).setOrigin(0.5).setDepth(101).setAlpha(0) : null;

                this.tweens.add({
                    targets: [nameText, tagText, unlockText].filter(Boolean),
                    alpha: 1,
                    duration: 380,
                    ease: 'Power2'
                });

                // Sparkle burst
                if (this.sparkleParticles) {
                    this.sparkleParticles.setPosition(width / 2, height / 2);
                    this.sparkleParticles.explode(28);
                }

                this.time.delayedCall(1900, () => {
                    const toFade = [overlay, nameText, tagText, unlockText].filter(Boolean);
                    this.tweens.add({
                        targets: toFade,
                        alpha: 0,
                        duration: 480,
                        ease: 'Quad.easeOut',
                        onComplete: () => {
                            toFade.forEach(o => o.destroy());
                            if (stage.unlocks) {
                                this.revealUnlockedFeature(stage.unlocks);
                            }
                        }
                    });
                });
            }
        });
    }

    revealUnlockedFeature(unlockKey) {
        switch (unlockKey) {
            case 'dailyChallenges':
                if (this.dailyNavBtn) {
                    this.dailyNavBtn.setVisible(true).setScale(0);
                    this.tweens.add({ targets: this.dailyNavBtn, scale: 1, duration: 420, ease: 'Back.out' });
                }
                break;
            case 'flavorBoosters':
                if (this.boosterRow) {
                    this.boosterRow.setVisible(true);
                    this.boosterRow.setAlpha(0);
                    const origY = this.boosterRow.y;
                    this.boosterRow.y = origY + 50;
                    this.tweens.add({
                        targets: this.boosterRow,
                        y: origY,
                        alpha: 1,
                        duration: 480,
                        ease: 'Back.out'
                    });
                    this._lastBoosterSig = null;
                    this.refreshBoosterRow();
                }
                break;
            case 'prestigeStars':
                if (this.prestigeDisplay) {
                    this.prestigeDisplay.setVisible(true).setScale(0);
                    this.tweens.add({ targets: this.prestigeDisplay, scale: 1, duration: 420, ease: 'Back.out' });
                }
                break;
            case 'streakDisplay':
                if (this.streakBadge) {
                    this.streakBadge.setVisible(true);
                }
                break;
        }
    }

    openShop() {
        this.scene.pause();
        this.scene.launch('ShopScene', { gameState: this.gameState, parentScene: this });
    }

    openQuests() {
        this.scene.pause();
        this.scene.launch('QuestScene', { gameState: this.gameState, parentScene: this });
    }

    openSettings() {
        this.scene.pause();
        this.scene.launch('SettingsScene', { gameState: this.gameState, parentScene: this });
    }

    openDailyChallenges() {
        this.scene.pause();
        this.scene.launch('DailyChallengeScene', { gameState: this.gameState, parentScene: this });
    }

    openPrestige() {
        if (!Economy.canPrestige(this.gameState.totalEarned)) return;
        this.scene.pause();
        this.scene.launch('PrestigeConfirmScene', { gameState: this.gameState, parentScene: this });
    }

    doPrestige() {
        const newStars = Economy.calculatePrestigeStars(this.gameState.totalEarned);
        const fresh = Economy.createNewSave();
        fresh.prestigeStars = (this.gameState.prestigeStars || 0) + newStars;
        fresh.streak = this.gameState.streak || 0;
        fresh.lastPlayDate = this.gameState.lastPlayDate || '';
        fresh.settings = this.gameState.settings;
        fresh.seenStages = this.gameState.seenStages || [];
        this.gameState = fresh;
        this.saveGame();
        this.scene.restart();
    }

    shutdown() {
        this.scale.off('resize', this.handleResize, this);
        musicManager.stop();
    }

    returnFromOverlay() {
        this.updateUI();
        this.updateDecorations();
        this.scene.resume();
    }
}

// Shop Scene
class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    init(data) {
        this.gameState = data.gameState;
        this.parentScene = data.parentScene;
    }

    create() {
        const { width, height } = this.scale;
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

        // Card
        const card = this.add.graphics();
        card.fillStyle(COLORS.white, 1);
        card.fillRoundedRect(15, 60, width - 30, height - 120, 24);

        this.add.text(width / 2, 95, 'Shop', {
            fontSize: '28px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#111827',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Close button
        const closeBtn = this.add.image(width - 45, 90, 'closeBtn').setScale(1.1).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.closeShop());

        // Tabs
        this.currentCategory = 'stand';
        this.createTabs(width);

        // Upgrade list area
        this.listY = 180;
        this.upgradeItems = [];
        this.refreshUpgradeList();

        // Money display
        this.moneyText = this.add.text(width / 2, height - 85, '', {
            fontSize: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#166534',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.updateMoneyDisplay();
    }

    createTabs(width) {
        const categories = ['stand', 'helpers', 'special'];
        const tabWidth = 100;
        const startX = (width - categories.length * tabWidth) / 2 + tabWidth / 2;

        this.tabButtons = [];
        categories.forEach((cat, i) => {
            const x = startX + i * tabWidth;
            const isActive = cat === this.currentCategory;

            const btn = this.add.graphics();
            btn.fillStyle(isActive ? COLORS.primary : COLORS.gray100, 1);
            btn.fillRoundedRect(x - 45, 125, 90, 36, 10);

            const label = this.add.text(x, 143, cat.charAt(0).toUpperCase() + cat.slice(1), {
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: isActive ? '#FFFFFF' : '#374151',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const hitArea = this.add.rectangle(x, 143, 90, 36, 0x000000, 0).setInteractive({ useHandCursor: true });
            hitArea.on('pointerdown', () => {
                soundManager.play('click');
                this.currentCategory = cat;
                this.refreshTabs();
                this.refreshUpgradeList();
            });

            this.tabButtons.push({ btn, label, category: cat, hitArea });
        });
    }

    refreshTabs() {
        this.tabButtons.forEach(t => {
            const isActive = t.category === this.currentCategory;
            t.btn.clear();
            t.btn.fillStyle(isActive ? COLORS.primary : COLORS.gray100, 1);
            t.btn.fillRoundedRect(t.hitArea.x - 45, 125, 90, 36, 10);
            t.label.setColor(isActive ? '#FFFFFF' : '#374151');
        });
    }

    refreshUpgradeList() {
        this.upgradeItems.forEach(item => item.destroy());
        this.upgradeItems = [];

        const { width } = this.scale;
        let y = this.listY;

        const upgrades = Object.values(Economy.UPGRADES).filter(u => u.category === this.currentCategory);

        upgrades.forEach(upgrade => {
            if (y > 580) return;

            const currentLevel = this.gameState.upgradeLevels[upgrade.id] || 0;
            const cost = Economy.calculateUpgradeCost(upgrade.id, currentLevel);
            const canAfford = this.gameState.money >= cost && currentLevel < upgrade.maxLevel;
            const maxed = currentLevel >= upgrade.maxLevel;

            const item = this.add.container(width / 2, y);

            const bg = this.add.graphics();
            bg.fillStyle(canAfford ? 0xECFDF5 : COLORS.gray50, 1);
            bg.fillRoundedRect(-165, -35, 330, 70, 12);
            if (canAfford) {
                bg.lineStyle(2, COLORS.success);
                bg.strokeRoundedRect(-165, -35, 330, 70, 12);
            }
            item.add(bg);

            item.add(this.add.text(-150, -18, upgrade.name, {
                fontSize: '15px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#111827',
                fontStyle: 'bold'
            }));

            item.add(this.add.text(-150, 4, upgrade.description, {
                fontSize: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#6B7280'
            }).setWordWrapWidth(200));

            item.add(this.add.text(150, -18, `Lv.${currentLevel}`, {
                fontSize: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#6B7280'
            }).setOrigin(1, 0));

            // Buy button
            const btnColor = maxed ? COLORS.gray300 : (canAfford ? COLORS.success : COLORS.gray400);
            const buyBtn = this.add.graphics();
            buyBtn.fillStyle(btnColor, 1);
            buyBtn.fillRoundedRect(85, 2, 70, 28, 8);
            item.add(buyBtn);

            const btnText = maxed ? 'MAX' : `$${cost.toFixed(0)}`;
            item.add(this.add.text(120, 16, btnText, {
                fontSize: '13px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#FFFFFF',
                fontStyle: 'bold'
            }).setOrigin(0.5));

            if (!maxed) {
                const hitArea = this.add.rectangle(120, 16, 70, 28, 0x000000, 0).setInteractive({ useHandCursor: true });
                item.add(hitArea);
                hitArea.on('pointerdown', () => {
                    if (canAfford) this.buyUpgrade(upgrade.id);
                    else soundManager.play('error');
                });
            }

            this.upgradeItems.push(item);
            y += 80;
        });
    }

    buyUpgrade(upgradeId) {
        const currentLevel = this.gameState.upgradeLevels[upgradeId] || 0;
        const cost = Economy.calculateUpgradeCost(upgradeId, currentLevel);

        if (this.gameState.money >= cost) {
            this.gameState.money -= cost;
            this.gameState.upgradeLevels[upgradeId] = currentLevel + 1;
            soundManager.play('upgrade');
            // Track daily stat
            if (!this.gameState.dailyStats) {
                this.gameState.dailyStats = { taps: 0, earned: 0, luckyBonuses: 0, upgradesBought: 0, maxCombo: 0 };
            }
            this.gameState.dailyStats.upgradesBought = (this.gameState.dailyStats.upgradesBought || 0) + 1;
            this.updateMoneyDisplay();
            this.refreshUpgradeList();
            this.parentScene.saveGame();
        }
    }

    updateMoneyDisplay() {
        this.moneyText.setText('💰 $' + this.gameState.money.toFixed(2));
    }

    closeShop() {
        soundManager.play('click');
        this.scene.stop();
        this.parentScene.returnFromOverlay();
    }
}

// Quest Scene
class QuestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'QuestScene' });
    }

    init(data) {
        this.gameState = data.gameState;
        this.parentScene = data.parentScene;
    }

    create() {
        const { width, height } = this.scale;
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

        const card = this.add.graphics();
        card.fillStyle(COLORS.white, 1);
        card.fillRoundedRect(15, 60, width - 30, height - 120, 24);

        this.add.text(width / 2, 95, 'Quests', {
            fontSize: '28px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#111827',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const closeBtn = this.add.image(width - 45, 90, 'closeBtn').setScale(1.1).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.closeQuests());

        let y = 145;
        Economy.QUESTS.forEach(quest => {
            if (y > height - 150) return;

            const isCompleted = this.gameState.completedQuests.includes(quest.id);

            const bg = this.add.graphics();
            bg.fillStyle(isCompleted ? 0xECFDF5 : COLORS.gray50, 1);
            bg.fillRoundedRect(30, y, width - 60, 60, 10);

            // Checkbox
            const checkBg = this.add.graphics();
            checkBg.fillStyle(isCompleted ? COLORS.success : COLORS.white, 1);
            checkBg.lineStyle(2, isCompleted ? COLORS.successDark : COLORS.gray300);
            checkBg.fillCircle(60, y + 30, 14);
            checkBg.strokeCircle(60, y + 30, 14);

            if (isCompleted) {
                this.add.text(60, y + 30, '✓', {
                    fontSize: '18px',
                    color: '#FFFFFF'
                }).setOrigin(0.5);
            }

            this.add.text(85, y + 15, quest.name, {
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#111827',
                fontStyle: 'bold',
                wordWrap: { width: width - 160, useAdvancedWrap: true }
            });

            this.add.text(85, y + 35, quest.description, {
                fontSize: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#6B7280',
                wordWrap: { width: width - 160, useAdvancedWrap: true }
            });

            this.add.text(width - 50, y + 30, `$${quest.reward}`, {
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#F59E0B',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            y += 70;
        });
    }

    closeQuests() {
        soundManager.play('click');
        this.scene.stop();
        this.parentScene.returnFromOverlay();
    }
}

// Settings Scene
class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    init(data) {
        this.gameState = data.gameState;
        this.parentScene = data.parentScene;
    }

    create() {
        const { width, height } = this.scale;
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

        const card = this.add.graphics();
        card.fillStyle(COLORS.white, 1);
        card.fillRoundedRect(30, 140, width - 60, 470, 24);

        this.add.text(width / 2, 175, 'Settings', {
            fontSize: '26px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#111827',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const closeBtn = this.add.image(width - 55, 170, 'closeBtn').setScale(1).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.closeSettings());

        // Toggles
        this.createToggle(width / 2, 235, 'Sound Effects', this.gameState.settings?.soundEnabled !== false, (val) => {
            this.gameState.settings.soundEnabled = val;
            soundManager.enabled = val;
            this.parentScene.saveGame();
        });

        this.createToggle(width / 2, 293, 'Particles', this.gameState.settings?.particlesEnabled !== false, (val) => {
            this.gameState.settings.particlesEnabled = val;
            this.parentScene.saveGame();
        });

        this.createToggle(width / 2, 351, 'Background Music', this.gameState.settings?.musicEnabled !== false, (val) => {
            this.gameState.settings.musicEnabled = val;
            musicManager.setEnabled(val);
            this.parentScene.saveGame();
        });

        // Stats
        this.add.text(width / 2, 415, `Total Earned: $${this.gameState.totalEarned.toFixed(2)}`, {
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#6B7280'
        }).setOrigin(0.5);

        this.add.text(width / 2, 440, `Total Sales: ${this.gameState.totalSales}`, {
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#6B7280'
        }).setOrigin(0.5);

        // Reset button
        this.createResetButton(width / 2, 530);
    }

    createToggle(x, y, label, initialValue, onChange) {
        this.add.text(x - 80, y, label, {
            fontSize: '16px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#374151'
        }).setOrigin(0, 0.5);

        const toggleBg = this.add.graphics();
        toggleBg.fillStyle(initialValue ? COLORS.success : COLORS.gray300, 1);
        toggleBg.fillRoundedRect(x + 50, y - 14, 50, 28, 14);

        const toggleKnob = this.add.circle(initialValue ? x + 86 : x + 64, y, 10, COLORS.white);

        let isOn = initialValue;
        const hitArea = this.add.rectangle(x + 75, y, 50, 28, 0x000000, 0).setInteractive({ useHandCursor: true });

        hitArea.on('pointerdown', () => {
            isOn = !isOn;
            soundManager.play('click');
            toggleBg.clear();
            toggleBg.fillStyle(isOn ? COLORS.success : COLORS.gray300, 1);
            toggleBg.fillRoundedRect(x + 50, y - 14, 50, 28, 14);
            this.tweens.add({ targets: toggleKnob, x: isOn ? x + 86 : x + 64, duration: 100 });
            onChange(isOn);
        });
    }

    createResetButton(x, y) {
        const btn = this.add.graphics();
        btn.fillStyle(COLORS.danger, 1);
        btn.fillRoundedRect(x - 70, y - 22, 140, 44, 12);

        this.add.text(x, y, 'Reset Progress', {
            fontSize: '15px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const hitArea = this.add.rectangle(x, y, 140, 44, 0x000000, 0).setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => {
            soundManager.play('click');
            this.showResetConfirm();
        });
    }

    showResetConfirm() {
        const { width, height } = this.scale;
        const overlay = this.add.container(width / 2, height / 2);

        overlay.add(this.add.rectangle(0, 0, width, height, 0x000000, 0.7));

        const panel = this.add.graphics();
        panel.fillStyle(COLORS.white, 1);
        panel.fillRoundedRect(-140, -90, 280, 180, 20);
        overlay.add(panel);

        overlay.add(this.add.text(0, -55, 'Reset All Progress?', {
            fontSize: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#EF4444',
            fontStyle: 'bold',
            wordWrap: { width: 250, useAdvancedWrap: true }
        }).setOrigin(0.5));

        overlay.add(this.add.text(0, -20, 'This cannot be undone!', {
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#6B7280',
            wordWrap: { width: 250, useAdvancedWrap: true }
        }).setOrigin(0.5));

        // Yes button
        const yesBg = this.add.graphics();
        yesBg.fillStyle(COLORS.danger, 1);
        yesBg.fillRoundedRect(-120, 20, 100, 44, 10);
        overlay.add(yesBg);

        overlay.add(this.add.text(-70, 42, 'Reset', {
            fontSize: '15px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5));

        const yesHit = this.add.rectangle(-70, 42, 100, 44, 0x000000, 0).setInteractive({ useHandCursor: true });
        overlay.add(yesHit);
        yesHit.on('pointerdown', () => {
            localStorage.removeItem('marlowLemonade');
            window.location.reload();
        });

        // No button
        const noBg = this.add.graphics();
        noBg.fillStyle(COLORS.success, 1);
        noBg.fillRoundedRect(20, 20, 100, 44, 10);
        overlay.add(noBg);

        overlay.add(this.add.text(70, 42, 'Cancel', {
            fontSize: '15px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5));

        const noHit = this.add.rectangle(70, 42, 100, 44, 0x000000, 0).setInteractive({ useHandCursor: true });
        overlay.add(noHit);
        noHit.on('pointerdown', () => {
            soundManager.play('click');
            overlay.destroy();
        });
    }

    closeSettings() {
        soundManager.play('click');
        this.scene.stop();
        this.parentScene.returnFromOverlay();
    }
}

// Daily Challenge Scene
class DailyChallengeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DailyChallengeScene' });
    }

    init(data) {
        this.gameState = data.gameState;
        this.parentScene = data.parentScene;
    }

    create() {
        const { width, height } = this.scale;
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

        const cardH = Math.min(500, height - 100);
        const card = this.add.graphics();
        card.fillStyle(COLORS.white, 1);
        card.fillRoundedRect(25, (height - cardH) / 2, width - 50, cardH, 24);

        const cardTop = (height - cardH) / 2;

        this.add.text(width / 2, cardTop + 32, '📋 Daily Challenges', {
            fontSize: '22px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#111827',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const closeBtn = this.add.image(width - 40, cardTop + 32, 'closeBtn').setScale(0.9).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.close());

        // Streak display
        const streak = this.gameState.streak || 0;
        const streakBonus = Economy.getStreakBonus(streak);
        this.add.text(width / 2, cardTop + 68, `🔥 ${streak} day streak  •  Login bonus: $${streakBonus.toFixed(0)}`, {
            fontSize: '13px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#F59E0B',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Daily challenges
        const today = Economy.getTodayString();
        const challenges = Economy.getDailyChallenges(today);
        if (!this.gameState.dailyCompleted) this.gameState.dailyCompleted = [];
        if (!this.gameState.dailyStats) {
            this.gameState.dailyStats = { taps: 0, earned: 0, luckyBonuses: 0, upgradesBought: 0, maxCombo: 0 };
        }

        let y = cardTop + 105;
        challenges.forEach((ch, i) => {
            const key = `day_${today}_${i}`;
            const isComplete = this.gameState.dailyCompleted.includes(key);

            // Progress calculation
            const stats = this.gameState.dailyStats;
            let current = 0;
            const req = ch.requirement;
            if (req.type === 'dailyTaps') current = stats.taps || 0;
            else if (req.type === 'dailyEarned') current = stats.earned || 0;
            else if (req.type === 'dailyLucky') current = stats.luckyBonuses || 0;
            else if (req.type === 'dailyUpgrades') current = stats.upgradesBought || 0;
            else if (req.type === 'dailyCombo') current = stats.maxCombo || 0;
            const progress = Math.min(current / req.amount, 1);

            const rowBg = this.add.graphics();
            const rowColor = isComplete ? COLORS.success : COLORS.gray100;
            rowBg.fillStyle(rowColor, isComplete ? 0.15 : 0.5);
            rowBg.fillRoundedRect(35, y, width - 70, 88, 10);

            const statusIcon = isComplete ? '✅' : '📌';
            this.add.text(50, y + 14, `${statusIcon} ${ch.name}`, {
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: isComplete ? '#065F46' : '#374151',
                fontStyle: 'bold'
            });

            this.add.text(50, y + 34, ch.description, {
                fontSize: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#6B7280'
            });

            // Progress bar
            const barW = width - 120;
            const barBg = this.add.graphics();
            barBg.fillStyle(0xE5E7EB, 1);
            barBg.fillRoundedRect(50, y + 55, barW, 10, 5);
            if (progress > 0) {
                barBg.fillStyle(isComplete ? COLORS.success : COLORS.primary, 1);
                barBg.fillRoundedRect(50, y + 55, Math.floor(progress * barW), 10, 5);
            }

            this.add.text(width - 50, y + 14, `+$${ch.reward}`, {
                fontSize: '13px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#F59E0B',
                fontStyle: 'bold'
            }).setOrigin(1, 0);

            y += 98;
        });

        // All done bonus
        const todayKeys = challenges.map((_, i) => `day_${today}_${i}`);
        const allDone = todayKeys.every(k => this.gameState.dailyCompleted.includes(k));
        const bonusKey = `bonus_${today}`;
        const bonusCollected = this.gameState.dailyCompleted.includes(bonusKey);

        this.add.text(width / 2, y + 10, allDone
            ? (bonusCollected ? `🏆 All Complete! Bonus collected: +$${Economy.DAILY_BONUS_REWARD}` : `🏆 All Complete! Bonus: +$${Economy.DAILY_BONUS_REWARD}`)
            : `Complete all 3 for +$${Economy.DAILY_BONUS_REWARD} bonus!`, {
            fontSize: '13px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: allDone ? '#065F46' : '#6B7280',
            fontStyle: allDone ? 'bold' : 'normal',
            align: 'center'
        }).setOrigin(0.5);
    }

    close() {
        soundManager.play('click');
        this.scene.stop();
        this.parentScene.returnFromOverlay();
    }
}

// Prestige Confirm Scene
class PrestigeConfirmScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PrestigeConfirmScene' });
    }

    init(data) {
        this.gameState = data.gameState;
        this.parentScene = data.parentScene;
    }

    create() {
        const { width, height } = this.scale;
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

        const card = this.add.graphics();
        card.fillStyle(COLORS.white, 1);
        card.fillRoundedRect(30, height / 2 - 200, width - 60, 400, 24);

        const newStars = Economy.calculatePrestigeStars(this.gameState.totalEarned);
        const currentStars = this.gameState.prestigeStars || 0;
        const totalStars = currentStars + newStars;
        const newMult = Economy.calculatePrestigeMultiplier(totalStars);

        this.add.text(width / 2, height / 2 - 165, '⭐ Prestige!', {
            fontSize: '26px', fontFamily: 'system-ui', color: '#111827', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 115, `Earn ${newStars} Lemonade Star${newStars !== 1 ? 's' : ''}`, {
            fontSize: '20px', fontFamily: 'system-ui', color: '#8B5CF6', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 75, [
            `Total stars after: ${totalStars} ★`,
            `Income multiplier: ${newMult.toFixed(1)}x`,
            '',
            '✅ Kept: Stars, streak, settings',
            '🔄 Reset: Money, upgrades, stand'
        ].join('\n'), {
            fontSize: '14px', fontFamily: 'system-ui', color: '#374151',
            lineSpacing: 6, align: 'center'
        }).setOrigin(0.5);

        // Confirm button
        const confirmBg = this.add.graphics();
        confirmBg.fillStyle(COLORS.success, 1);
        confirmBg.fillRoundedRect(width / 2 - 80, height / 2 + 90, 160, 48, 14);
        this.add.text(width / 2, height / 2 + 114, 'Prestige!', {
            fontSize: '17px', fontFamily: 'system-ui', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        const confirmHit = this.add.rectangle(width / 2, height / 2 + 114, 160, 48, 0x000000, 0).setInteractive({ useHandCursor: true });
        confirmHit.on('pointerdown', () => {
            soundManager.play('levelUp');
            this.scene.stop();
            this.parentScene.doPrestige();
        });

        // Cancel button
        const cancelBg = this.add.graphics();
        cancelBg.fillStyle(COLORS.gray300, 1);
        cancelBg.fillRoundedRect(width / 2 - 80, height / 2 + 150, 160, 40, 12);
        this.add.text(width / 2, height / 2 + 170, 'Not yet', {
            fontSize: '15px', fontFamily: 'system-ui', color: '#374151'
        }).setOrigin(0.5);
        const cancelHit = this.add.rectangle(width / 2, height / 2 + 170, 160, 40, 0x000000, 0).setInteractive({ useHandCursor: true });
        cancelHit.on('pointerdown', () => {
            soundManager.play('click');
            this.scene.stop();
            this.parentScene.returnFromOverlay();
        });
    }
}

// Phaser config - RESIZE mode fills the window dynamically
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#7DD3FC',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%',
        min: {
            width: 320,
            height: 480
        },
        max: {
            width: 600,
            height: 1200
        }
    },
    scene: [BootScene, MainMenuScene, GameScene, ShopScene, QuestScene, SettingsScene, DailyChallengeScene, PrestigeConfirmScene],
    render: {
        pixelArt: false,
        antialias: true
    }
};

// Start game
window.addEventListener('load', () => {
    console.log('Starting Phaser game...');
    try {
        new Phaser.Game(config);
        console.log('Phaser initialized');
    } catch (e) {
        console.error('Phaser error:', e);
        document.getElementById('loading').innerHTML = '<h1>Error</h1><p>' + e.message + '</p>';
    }
});
