/**
 * Marlow's Lemonade Stand - Main Game
 * A Phaser 3 clicker/idle game for mobile
 */

// Game configuration
const GAME_WIDTH = 390;
const GAME_HEIGHT = 844;

// Color palette
const COLORS = {
    yellow: 0xFFD93D,
    lightYellow: 0xFFF3B0,
    orange: 0xFF6B35,
    green: 0x4CAF50,
    darkGreen: 0x2E7D32,
    blue: 0x2196F3,
    lightBlue: 0x87CEEB,
    pink: 0xFF69B4,
    purple: 0x9C27B0,
    brown: 0x8B4513,
    white: 0xFFFFFF,
    black: 0x000000,
    gray: 0x9E9E9E
};

// Sound generation using Web Audio API
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

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        try {
            switch (type) {
                case 'click':
                    this.playTone(800, 0.1, 'square', 0.2);
                    break;
                case 'coin':
                    this.playTone(523, 0.1, 'sine', 0.15);
                    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.15), 50);
                    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.15), 100);
                    break;
                case 'upgrade':
                    this.playTone(440, 0.1, 'sine', 0.2);
                    setTimeout(() => this.playTone(554, 0.1, 'sine', 0.2), 80);
                    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.2), 160);
                    setTimeout(() => this.playTone(880, 0.2, 'sine', 0.2), 240);
                    break;
                case 'levelUp':
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => this.playTone(440 + i * 100, 0.1, 'sine', 0.2), i * 80);
                    }
                    break;
                case 'quest':
                    this.playTone(523, 0.15, 'sine', 0.25);
                    setTimeout(() => this.playTone(659, 0.15, 'sine', 0.25), 100);
                    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.25), 200);
                    setTimeout(() => this.playTone(1047, 0.3, 'sine', 0.25), 300);
                    break;
                case 'error':
                    this.playTone(200, 0.2, 'square', 0.2);
                    break;
                case 'pop':
                    this.playTone(600, 0.05, 'sine', 0.15);
                    break;
                case 'event':
                    this.playTone(880, 0.1, 'triangle', 0.2);
                    setTimeout(() => this.playTone(1100, 0.1, 'triangle', 0.2), 100);
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

// Boot Scene - Initialize game
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create graphics for all game elements
        this.createGameGraphics();
    }

    createGameGraphics() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Lemon
        g.clear();
        g.fillStyle(COLORS.yellow);
        g.fillEllipse(32, 32, 56, 48);
        g.fillStyle(0xF0C800);
        g.fillEllipse(28, 30, 48, 40);
        g.generateTexture('lemon', 64, 64);

        // Golden Lemon
        g.clear();
        g.fillStyle(0xFFD700);
        g.fillEllipse(32, 32, 56, 48);
        g.fillStyle(0xFFF8DC);
        g.fillEllipse(28, 28, 20, 16);
        g.generateTexture('goldenLemon', 64, 64);

        // Lemonade cup
        g.clear();
        g.fillStyle(COLORS.white);
        g.fillRect(12, 8, 40, 48);
        g.fillStyle(COLORS.yellow);
        g.fillRect(16, 16, 32, 36);
        g.fillStyle(COLORS.lightYellow);
        g.fillRect(16, 42, 32, 10);
        g.fillStyle(COLORS.orange);
        g.fillCircle(32, 12, 6);
        g.generateTexture('cup', 64, 64);

        // Coin
        g.clear();
        g.fillStyle(0xFFD700);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0xDAA520);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0xFFD700);
        g.lineStyle(2, 0xB8860B);
        g.strokeCircle(16, 16, 12);
        g.generateTexture('coin', 32, 32);

        // Particle (small circle)
        g.clear();
        g.fillStyle(COLORS.white);
        g.fillCircle(4, 4, 4);
        g.generateTexture('particle', 8, 8);

        // Sparkle
        g.clear();
        g.fillStyle(COLORS.yellow);
        g.fillStar(16, 16, 4, 16, 6);
        g.generateTexture('sparkle', 32, 32);

        // Heart
        g.clear();
        g.fillStyle(COLORS.pink);
        g.fillCircle(12, 14, 10);
        g.fillCircle(22, 14, 10);
        g.fillTriangle(4, 18, 30, 18, 17, 34);
        g.generateTexture('heart', 34, 36);

        // Star
        g.clear();
        g.fillStyle(0xFFD700);
        g.fillStar(20, 20, 5, 18, 8);
        g.generateTexture('star', 40, 40);

        // Button background
        g.clear();
        g.fillStyle(COLORS.orange);
        g.fillRoundedRect(0, 0, 200, 60, 15);
        g.fillStyle(0xFF8C00);
        g.fillRoundedRect(4, 4, 192, 52, 12);
        g.generateTexture('button', 200, 60);

        // Small button
        g.clear();
        g.fillStyle(COLORS.green);
        g.fillRoundedRect(0, 0, 120, 50, 12);
        g.fillStyle(COLORS.darkGreen);
        g.fillRoundedRect(3, 3, 114, 44, 10);
        g.generateTexture('buttonSmall', 120, 50);

        // Panel background
        g.clear();
        g.fillStyle(COLORS.white, 0.95);
        g.fillRoundedRect(0, 0, 340, 200, 20);
        g.lineStyle(4, COLORS.brown);
        g.strokeRoundedRect(2, 2, 336, 196, 18);
        g.generateTexture('panel', 340, 200);

        // Big panel
        g.clear();
        g.fillStyle(COLORS.white, 0.95);
        g.fillRoundedRect(0, 0, 360, 600, 20);
        g.lineStyle(4, COLORS.brown);
        g.strokeRoundedRect(2, 2, 356, 596, 18);
        g.generateTexture('bigPanel', 360, 600);

        // Tab button
        g.clear();
        g.fillStyle(COLORS.lightYellow);
        g.fillRoundedRect(0, 0, 80, 40, 10);
        g.generateTexture('tab', 80, 40);

        // Tab button active
        g.clear();
        g.fillStyle(COLORS.yellow);
        g.fillRoundedRect(0, 0, 80, 40, 10);
        g.lineStyle(2, COLORS.orange);
        g.strokeRoundedRect(1, 1, 78, 38, 9);
        g.generateTexture('tabActive', 80, 40);

        // Progress bar background
        g.clear();
        g.fillStyle(COLORS.gray);
        g.fillRoundedRect(0, 0, 200, 20, 10);
        g.generateTexture('progressBg', 200, 20);

        // Progress bar fill
        g.clear();
        g.fillStyle(COLORS.green);
        g.fillRoundedRect(0, 0, 200, 20, 10);
        g.generateTexture('progressFill', 200, 20);

        // Dogs - Poppy (golden retriever colored)
        g.clear();
        g.fillStyle(0xD4A574);
        g.fillEllipse(24, 28, 36, 28);
        g.fillCircle(24, 12, 14);
        g.fillEllipse(12, 8, 10, 14);
        g.fillEllipse(36, 8, 10, 14);
        g.fillStyle(COLORS.black);
        g.fillCircle(20, 12, 3);
        g.fillCircle(28, 12, 3);
        g.fillCircle(24, 18, 4);
        g.generateTexture('poppy', 48, 48);

        // Dogs - Winnie (darker colored)
        g.clear();
        g.fillStyle(0x8B6914);
        g.fillEllipse(24, 28, 36, 28);
        g.fillCircle(24, 12, 14);
        g.fillEllipse(10, 6, 10, 14);
        g.fillEllipse(38, 6, 10, 14);
        g.fillStyle(COLORS.black);
        g.fillCircle(20, 12, 3);
        g.fillCircle(28, 12, 3);
        g.fillCircle(24, 18, 4);
        g.generateTexture('winnie', 48, 48);

        // Labubu (cute character)
        g.clear();
        g.fillStyle(0xE8D5B7);
        g.fillRoundedRect(8, 16, 32, 28, 10);
        g.fillCircle(24, 14, 16);
        g.fillStyle(COLORS.pink);
        g.fillTriangle(12, 4, 18, 16, 6, 16);
        g.fillTriangle(36, 4, 42, 16, 30, 16);
        g.fillStyle(COLORS.black);
        g.fillCircle(18, 14, 4);
        g.fillCircle(30, 14, 4);
        g.fillStyle(COLORS.white);
        g.fillCircle(19, 13, 2);
        g.fillCircle(31, 13, 2);
        g.generateTexture('labubu', 48, 48);

        // Volleyball
        g.clear();
        g.fillStyle(COLORS.white);
        g.fillCircle(20, 20, 18);
        g.lineStyle(2, COLORS.blue);
        g.strokeCircle(20, 20, 16);
        g.beginPath();
        g.moveTo(4, 20);
        g.lineTo(36, 20);
        g.strokePath();
        g.arc(20, 20, 16, 0.5, 2.5);
        g.strokePath();
        g.generateTexture('volleyball', 40, 40);

        // Basketball
        g.clear();
        g.fillStyle(0xFF6B00);
        g.fillCircle(20, 20, 18);
        g.lineStyle(2, COLORS.black);
        g.strokeCircle(20, 20, 16);
        g.beginPath();
        g.moveTo(4, 20);
        g.lineTo(36, 20);
        g.moveTo(20, 4);
        g.lineTo(20, 36);
        g.strokePath();
        g.generateTexture('basketball', 40, 40);

        // Stand level 1 - Cardboard box
        g.clear();
        g.fillStyle(0xC4A35A);
        g.fillRect(20, 80, 160, 70);
        g.fillStyle(0xA88B3D);
        g.fillRect(20, 80, 160, 10);
        g.lineStyle(2, 0x8B7355);
        g.strokeRect(20, 80, 160, 70);
        g.generateTexture('stand1', 200, 160);

        // Stand level 2 - Wooden crate
        g.clear();
        g.fillStyle(0xDEB887);
        g.fillRect(15, 70, 170, 80);
        g.fillStyle(0xA0522D);
        for (let i = 0; i < 5; i++) {
            g.fillRect(15, 70 + i * 16, 170, 2);
        }
        g.lineStyle(3, 0x8B4513);
        g.strokeRect(15, 70, 170, 80);
        g.generateTexture('stand2', 200, 160);

        // Stand level 3 - Small table
        g.clear();
        g.fillStyle(0xF5DEB3);
        g.fillRect(10, 60, 180, 15);
        g.fillStyle(0xDEB887);
        g.fillRect(25, 75, 15, 75);
        g.fillRect(160, 75, 15, 75);
        g.lineStyle(2, 0xA0522D);
        g.strokeRect(10, 60, 180, 15);
        g.generateTexture('stand3', 200, 160);

        // Stand level 4 - Decorated stand
        g.clear();
        g.fillStyle(0xFFE4B5);
        g.fillRect(5, 50, 190, 100);
        g.fillStyle(COLORS.yellow);
        g.fillTriangle(100, 10, 5, 50, 195, 50);
        g.fillStyle(COLORS.pink);
        g.fillCircle(30, 35, 10);
        g.fillCircle(100, 20, 12);
        g.fillCircle(170, 35, 10);
        g.lineStyle(3, COLORS.brown);
        g.strokeRect(5, 50, 190, 100);
        g.generateTexture('stand4', 200, 160);

        // Stand level 5 - Professional booth
        g.clear();
        g.fillStyle(0xFFFFE0);
        g.fillRect(5, 40, 190, 110);
        g.fillStyle(COLORS.orange);
        g.fillRect(5, 40, 190, 20);
        g.fillStyle(COLORS.yellow);
        g.fillRect(5, 40, 190, 10);
        g.fillStyle(COLORS.white);
        g.fillRect(70, 70, 60, 50);
        g.lineStyle(3, COLORS.brown);
        g.strokeRect(5, 40, 190, 110);
        g.generateTexture('stand5', 200, 160);

        // Stand level 6-10 (progressively fancier)
        for (let level = 6; level <= 10; level++) {
            g.clear();
            const baseColor = level < 8 ? 0xFFF8DC : (level < 10 ? 0xF0E68C : 0xFFD700);
            g.fillStyle(baseColor);
            g.fillRoundedRect(0, 30, 200, 120, 10);

            // Roof
            g.fillStyle(level < 9 ? COLORS.orange : 0xFF4500);
            g.fillTriangle(100, 0, -10, 35, 210, 35);

            // Decorations based on level
            if (level >= 7) {
                g.fillStyle(COLORS.yellow);
                for (let i = 0; i < 5; i++) {
                    g.fillCircle(20 + i * 40, 25, 8);
                }
            }
            if (level >= 8) {
                g.fillStyle(COLORS.pink);
                g.fillStar(30, 60, 5, 12, 6);
                g.fillStar(170, 60, 5, 12, 6);
            }
            if (level >= 9) {
                g.fillStyle(0xFFD700);
                g.fillStar(100, 15, 5, 15, 7);
            }
            if (level >= 10) {
                g.lineStyle(4, 0xFFD700);
                g.strokeRoundedRect(2, 32, 196, 116, 8);
            }

            // Counter
            g.fillStyle(COLORS.white);
            g.fillRect(40, 90, 120, 50);
            g.lineStyle(2, COLORS.brown);
            g.strokeRect(40, 90, 120, 50);

            g.generateTexture('stand' + level, 200, 160);
        }

        // Character - Marlow
        g.clear();
        // Body
        g.fillStyle(COLORS.yellow);
        g.fillRect(16, 40, 32, 40);
        // Head
        g.fillStyle(0xFFDBAC);
        g.fillCircle(32, 24, 20);
        // Hair
        g.fillStyle(0x8B4513);
        g.fillEllipse(32, 12, 22, 12);
        // Eyes
        g.fillStyle(COLORS.black);
        g.fillCircle(26, 22, 3);
        g.fillCircle(38, 22, 3);
        // Smile
        g.lineStyle(2, COLORS.black);
        g.beginPath();
        g.arc(32, 28, 8, 0.2, Math.PI - 0.2);
        g.strokePath();
        // Arms
        g.fillStyle(0xFFDBAC);
        g.fillRect(8, 45, 10, 25);
        g.fillRect(46, 45, 10, 25);
        g.generateTexture('marlow', 64, 90);

        // Violet (sister)
        g.clear();
        g.fillStyle(COLORS.purple);
        g.fillRect(16, 40, 32, 40);
        g.fillStyle(0xFFDBAC);
        g.fillCircle(32, 24, 18);
        g.fillStyle(0x4A0080);
        g.fillEllipse(32, 10, 20, 14);
        g.fillRect(14, 10, 8, 20);
        g.fillRect(42, 10, 8, 20);
        g.fillStyle(COLORS.black);
        g.fillCircle(26, 22, 3);
        g.fillCircle(38, 22, 3);
        g.lineStyle(2, COLORS.pink);
        g.beginPath();
        g.arc(32, 28, 6, 0.2, Math.PI - 0.2);
        g.strokePath();
        g.fillStyle(0xFFDBAC);
        g.fillRect(8, 45, 10, 22);
        g.fillRect(46, 45, 10, 22);
        g.generateTexture('violet', 64, 90);

        // Close button
        g.clear();
        g.fillStyle(0xFF5555);
        g.fillCircle(20, 20, 18);
        g.lineStyle(4, COLORS.white);
        g.beginPath();
        g.moveTo(12, 12);
        g.lineTo(28, 28);
        g.moveTo(28, 12);
        g.lineTo(12, 28);
        g.strokePath();
        g.generateTexture('closeBtn', 40, 40);

        g.destroy();
    }

    create() {
        soundManager.init();

        // Hide loading screen early as fallback
        try {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.display = 'none';
            }
        } catch (e) {
            console.log('Could not hide loading:', e);
        }

        this.scene.start('MainMenuScene');
    }
}

// Main Menu Scene
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Background - simple gradient using multiple rectangles
        const bg = this.add.graphics();
        const steps = 20;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const r = Math.floor(135 + (255 - 135) * t);
            const g = Math.floor(206 + (217 - 206) * t);
            const b = Math.floor(235 + (61 - 235) * t);
            const color = (r << 16) | (g << 8) | b;
            bg.fillStyle(color);
            bg.fillRect(0, (height / steps) * i, width, height / steps + 1);
        }

        // Sun
        this.add.circle(width - 60, 80, 50, COLORS.yellow);
        this.add.circle(width - 60, 80, 40, 0xFFF59D);

        // Clouds
        for (let i = 0; i < 3; i++) {
            const cx = 50 + i * 130;
            const cy = 60 + Math.random() * 40;
            this.add.ellipse(cx, cy, 60, 30, COLORS.white);
            this.add.ellipse(cx - 20, cy + 10, 40, 25, COLORS.white);
            this.add.ellipse(cx + 25, cy + 5, 45, 28, COLORS.white);
        }

        // Title
        const titleStyle = {
            fontSize: '42px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#8B4513',
            stroke: '#FFFFFF',
            strokeThickness: 6,
            align: 'center'
        };

        const title = this.add.text(width / 2, 180, "Marlow's\nLemonade Stand", titleStyle);
        title.setOrigin(0.5);

        // Animated lemon
        const lemon = this.add.image(width / 2, 340, 'lemon').setScale(2);
        this.tweens.add({
            targets: lemon,
            y: 330,
            angle: 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Play button
        const playBtn = this.add.image(width / 2, 480, 'button').setScale(1.2);
        const playText = this.add.text(width / 2, 480, 'PLAY!', {
            fontSize: '32px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#FFFFFF',
            stroke: '#8B4513',
            strokeThickness: 3
        }).setOrigin(0.5);

        playBtn.setInteractive({ useHandCursor: true });
        playBtn.on('pointerdown', () => {
            soundManager.play('click');
            this.tweens.add({
                targets: [playBtn, playText],
                scale: 1.1,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.scene.start('GameScene');
                }
            });
        });

        // Credits
        const creditStyle = {
            fontSize: '16px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#8B4513',
            align: 'center'
        };

        this.add.text(width / 2, height - 80, 'A game for Marlow\nMade with love!', creditStyle).setOrigin(0.5);

        // Easter egg: tap the sun 5 times
        let sunTaps = 0;
        const sun = this.add.circle(width - 60, 80, 50, 0x000000, 0).setInteractive();
        sun.on('pointerdown', () => {
            sunTaps++;
            if (sunTaps >= 5) {
                soundManager.play('quest');
                this.add.text(width / 2, height / 2, '☀️ Sunny Days Ahead! ☀️', {
                    fontSize: '24px',
                    fontFamily: 'Comic Sans MS, cursive',
                    color: '#FFD700',
                    stroke: '#8B4513',
                    strokeThickness: 3
                }).setOrigin(0.5);
            }
        });

        // Hide loading screen
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Load or create save
        this.loadGame();

        // Setup UI layers
        this.createBackground(width, height);
        this.createStand(width, height);
        this.createUI(width, height);
        this.createParticles();

        // Setup game loop
        this.autoSaveTimer = 0;
        this.eventTimer = 0;
        this.collectionTimer = 0;
        this.activeEvent = null;
        this.eventMultiplier = 1;

        // Easter egg trackers
        this.secretTaps = { topLeft: 0, topRight: 0 };

        // Start idle income
        this.time.addEvent({
            delay: 1000,
            callback: this.processIdleIncome,
            callbackScope: this,
            loop: true
        });

        // Check for quests periodically
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
    }

    loadGame() {
        try {
            const saved = localStorage.getItem('marlowLemonade');
            if (saved) {
                let data = JSON.parse(saved);
                if (Economy.validateSave(data)) {
                    data = Economy.migrateSave(data);
                    this.gameState = data;
                } else {
                    this.gameState = Economy.createNewSave();
                }
            } else {
                this.gameState = Economy.createNewSave();
            }
        } catch (e) {
            console.error('Failed to load save:', e);
            this.gameState = Economy.createNewSave();
        }

        // Apply settings
        soundManager.enabled = this.gameState.settings?.soundEnabled !== false;
    }

    saveGame() {
        try {
            this.gameState.lastSaved = Date.now();
            localStorage.setItem('marlowLemonade', JSON.stringify(this.gameState));
        } catch (e) {
            console.error('Failed to save:', e);
        }
    }

    createBackground(width, height) {
        // Sky gradient using multiple rectangles for compatibility
        const bg = this.add.graphics();
        const steps = 20;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            // Interpolate from light blue (135, 206, 235) to light green (144, 238, 144)
            const r = Math.floor(135 + (144 - 135) * t);
            const g = Math.floor(206 + (238 - 206) * t);
            const b = Math.floor(235 + (144 - 235) * t);
            const color = (r << 16) | (g << 8) | b;
            bg.fillStyle(color);
            bg.fillRect(0, (height / steps) * i, width, height / steps + 1);
        }

        // Sun
        this.sun = this.add.circle(width - 50, 70, 40, COLORS.yellow);
        this.add.circle(width - 50, 70, 30, 0xFFF59D);

        // Animated clouds
        this.clouds = [];
        for (let i = 0; i < 3; i++) {
            const cloud = this.add.container(i * 150 - 50, 50 + i * 30);
            cloud.add(this.add.ellipse(0, 0, 50, 25, COLORS.white));
            cloud.add(this.add.ellipse(-15, 8, 35, 20, COLORS.white));
            cloud.add(this.add.ellipse(20, 5, 40, 22, COLORS.white));
            this.clouds.push(cloud);

            this.tweens.add({
                targets: cloud,
                x: width + 100,
                duration: 60000 + i * 20000,
                repeat: -1,
                onRepeat: () => { cloud.x = -100; }
            });
        }

        // Ground
        bg.fillStyle(0x90EE90);
        bg.fillRect(0, height - 200, width, 200);
        bg.fillStyle(0x7CCD7C);
        bg.fillRect(0, height - 200, width, 10);

        // Secret tap zones for easter eggs
        const topLeft = this.add.rectangle(40, 40, 80, 80, 0x000000, 0).setInteractive();
        topLeft.on('pointerdown', () => this.handleSecretTap('topLeft'));

        const topRight = this.add.rectangle(width - 40, 40, 80, 80, 0x000000, 0).setInteractive();
        topRight.on('pointerdown', () => this.handleSecretTap('topRight'));
    }

    handleSecretTap(zone) {
        this.secretTaps[zone]++;

        // Easter egg: tap both corners 3 times each
        if (this.secretTaps.topLeft >= 3 && this.secretTaps.topRight >= 3) {
            this.secretTaps.topLeft = 0;
            this.secretTaps.topRight = 0;

            // Secret bonus!
            soundManager.play('quest');
            this.gameState.money += 50;
            this.showFloatingText(this.scale.width / 2, 200, '+$50 Secret Bonus!', '#FFD700');
            this.saveGame();
            this.updateUI();
        }
    }

    createStand(width, height) {
        const standLevel = Economy.getStandLevel(this.gameState.totalEarned);
        const standKey = 'stand' + standLevel.level;

        // Stand container
        this.standContainer = this.add.container(width / 2, height / 2 - 50);

        // Stand image
        this.stand = this.add.image(0, 50, standKey).setScale(1.8);
        this.standContainer.add(this.stand);

        // Marlow character
        this.marlow = this.add.image(0, -20, 'marlow').setScale(1.2);
        this.standContainer.add(this.marlow);

        // Tap zone (big target for mobile)
        this.tapZone = this.add.rectangle(0, 20, 250, 200, 0x000000, 0);
        this.tapZone.setInteractive({ useHandCursor: true });
        this.standContainer.add(this.tapZone);

        this.tapZone.on('pointerdown', (pointer) => {
            this.onTap(pointer);
        });

        // Stand name label
        this.standLabel = this.add.text(0, 130, standLevel.name, {
            fontSize: '16px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#8B4513',
            stroke: '#FFFFFF',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.standContainer.add(this.standLabel);

        // Add decorations based on upgrades
        this.updateStandDecorations();
    }

    updateStandDecorations() {
        // Remove old decorations
        if (this.decorations) {
            this.decorations.forEach(d => d.destroy());
        }
        this.decorations = [];

        const ul = this.gameState.upgradeLevels;

        // Poppy dog
        if (ul.poppyHelper) {
            const poppy = this.add.image(-90, 80, 'poppy').setScale(0.8);
            this.standContainer.add(poppy);
            this.decorations.push(poppy);
            this.tweens.add({
                targets: poppy,
                y: 75,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }

        // Winnie dog
        if (ul.winnieGuard) {
            const winnie = this.add.image(90, 80, 'winnie').setScale(0.8);
            this.standContainer.add(winnie);
            this.decorations.push(winnie);
            this.tweens.add({
                targets: winnie,
                angle: 5,
                duration: 300,
                yoyo: true,
                repeat: -1
            });
        }

        // Labubu
        if (ul.labubuCharm) {
            const labubu = this.add.image(-60, -60, 'labubu').setScale(0.7);
            this.standContainer.add(labubu);
            this.decorations.push(labubu);
        }

        // Violet
        if (ul.violetMarketing) {
            const violet = this.add.image(60, -10, 'violet').setScale(0.8);
            this.standContainer.add(violet);
            this.decorations.push(violet);
        }

        // Volleyball sign
        if (ul.volleyballSign) {
            const vball = this.add.image(-100, -50, 'volleyball').setScale(0.6);
            this.standContainer.add(vball);
            this.decorations.push(vball);
        }

        // Basketball
        if (ul.basketballCooler) {
            const bball = this.add.image(100, -50, 'basketball').setScale(0.6);
            this.standContainer.add(bball);
            this.decorations.push(bball);
        }
    }

    createUI(width, height) {
        // Money display at top
        this.moneyPanel = this.add.container(width / 2, 50);

        const moneyBg = this.add.graphics();
        moneyBg.fillStyle(COLORS.white, 0.9);
        moneyBg.fillRoundedRect(-100, -25, 200, 50, 15);
        moneyBg.lineStyle(3, COLORS.yellow);
        moneyBg.strokeRoundedRect(-100, -25, 200, 50, 15);
        this.moneyPanel.add(moneyBg);

        this.moneyText = this.add.text(0, 0, '$0.00', {
            fontSize: '28px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#228B22',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.moneyPanel.add(this.moneyText);

        // Stats display
        this.statsText = this.add.text(width / 2, 95, '', {
            fontSize: '14px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#666666'
        }).setOrigin(0.5);

        // Stand progress bar
        this.progressContainer = this.add.container(width / 2, height / 2 + 120);

        const progressBg = this.add.image(0, 0, 'progressBg').setScale(1.5, 1);
        this.progressContainer.add(progressBg);

        this.progressFill = this.add.image(-150, 0, 'progressFill').setScale(0, 1);
        this.progressFill.setOrigin(0, 0.5);
        this.progressContainer.add(this.progressFill);

        this.progressText = this.add.text(0, 20, '', {
            fontSize: '12px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#666666'
        }).setOrigin(0.5);
        this.progressContainer.add(this.progressText);

        // Bottom buttons
        this.createBottomButtons(width, height);

        // Event banner (hidden by default)
        this.eventBanner = this.add.container(width / 2, 150);
        this.eventBanner.setVisible(false);

        const eventBg = this.add.graphics();
        eventBg.fillStyle(COLORS.yellow, 0.95);
        eventBg.fillRoundedRect(-170, -30, 340, 60, 15);
        eventBg.lineStyle(3, COLORS.orange);
        eventBg.strokeRoundedRect(-170, -30, 340, 60, 15);
        this.eventBanner.add(eventBg);

        this.eventText = this.add.text(0, 0, '', {
            fontSize: '18px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#8B4513',
            align: 'center'
        }).setOrigin(0.5);
        this.eventBanner.add(this.eventText);

        // Update all UI
        this.updateUI();
    }

    createBottomButtons(width, height) {
        const btnY = height - 70;
        const btnSpacing = 90;

        // Shop button
        this.shopBtn = this.createButton(width / 2 - btnSpacing, btnY, 'Shop', () => {
            this.openShop();
        });

        // Quests button
        this.questBtn = this.createButton(width / 2, btnY, 'Quests', () => {
            this.openQuests();
        });

        // Settings button
        this.settingsBtn = this.createButton(width / 2 + btnSpacing, btnY, 'Menu', () => {
            this.openSettings();
        });
    }

    createButton(x, y, label, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.image(0, 0, 'buttonSmall');
        container.add(bg);

        const text = this.add.text(0, 0, label, {
            fontSize: '18px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#FFFFFF',
            stroke: '#2E7D32',
            strokeThickness: 2
        }).setOrigin(0.5);
        container.add(text);

        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => {
            soundManager.play('click');
            this.tweens.add({
                targets: container,
                scale: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: callback
            });
        });

        return container;
    }

    createParticles() {
        // Coin particles
        this.coinParticles = this.add.particles(0, 0, 'coin', {
            speed: { min: 100, max: 200 },
            angle: { min: -120, max: -60 },
            scale: { start: 0.8, end: 0 },
            lifespan: 800,
            gravityY: 300,
            emitting: false
        });

        // Sparkle particles
        this.sparkleParticles = this.add.particles(0, 0, 'sparkle', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.6, end: 0 },
            lifespan: 600,
            emitting: false,
            tint: [COLORS.yellow, COLORS.orange, COLORS.white]
        });
    }

    onTap(pointer) {
        soundManager.play('click');

        // Calculate click value
        let clickValue = Economy.calculateClickValue(this.gameState.upgradeLevels);

        // Apply price multiplier
        clickValue *= Economy.calculatePriceMultiplier(this.gameState.upgradeLevels);

        // Apply event multiplier
        clickValue *= this.eventMultiplier;

        // Lucky bonus chance
        const luckyChance = Economy.calculateLuckyChance(this.gameState.upgradeLevels);
        let isLucky = Math.random() < luckyChance;

        if (isLucky) {
            clickValue *= 5;
            this.gameState.luckyBonuses = (this.gameState.luckyBonuses || 0) + 1;
            soundManager.play('coin');
        }

        // Update money
        this.gameState.money += clickValue;
        this.gameState.totalEarned += clickValue;
        this.gameState.totalSales++;

        // Visual feedback
        this.showFloatingText(
            pointer.x,
            pointer.y - 20,
            isLucky ? `+$${clickValue.toFixed(2)} LUCKY!` : `+$${clickValue.toFixed(2)}`,
            isLucky ? '#FFD700' : '#228B22'
        );

        // Particles
        if (this.gameState.settings?.particlesEnabled !== false) {
            this.coinParticles.setPosition(pointer.x, pointer.y);
            this.coinParticles.explode(isLucky ? 8 : 3);

            if (isLucky) {
                this.sparkleParticles.setPosition(pointer.x, pointer.y);
                this.sparkleParticles.explode(10);
            }
        }

        // Bounce animation
        this.tweens.add({
            targets: this.marlow,
            scaleX: 1.3,
            scaleY: 1.1,
            duration: 50,
            yoyo: true
        });

        // Try to collect item
        this.tryCollectItem();

        // Update UI and save
        this.updateUI();
        this.checkStandUpgrade();
    }

    showFloatingText(x, y, text, color) {
        const floatText = this.add.text(x, y, text, {
            fontSize: '22px',
            fontFamily: 'Comic Sans MS, cursive',
            color: color,
            stroke: '#FFFFFF',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatText,
            y: y - 60,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => floatText.destroy()
        });
    }

    processIdleIncome() {
        const autoIncome = Economy.calculateAutoIncome(this.gameState.upgradeLevels);

        if (autoIncome > 0) {
            let income = autoIncome * this.eventMultiplier;
            income *= Economy.calculatePriceMultiplier(this.gameState.upgradeLevels);

            this.gameState.money += income;
            this.gameState.totalEarned += income;

            this.updateUI();
        }

        // Auto save every 30 seconds
        this.autoSaveTimer++;
        if (this.autoSaveTimer >= 30) {
            this.autoSaveTimer = 0;
            this.gameState.playTime += 30;
            this.saveGame();
        }
    }

    tryRandomEvent() {
        if (this.activeEvent) return;

        const event = Economy.tryGetRandomEvent(this.gameState.upgradeLevels);

        if (event) {
            this.activeEvent = event;
            soundManager.play('event');

            // Show event banner
            this.eventText.setText(`${event.name}\n${event.description}`);
            this.eventBanner.setVisible(true);
            this.eventBanner.setScale(0);

            this.tweens.add({
                targets: this.eventBanner,
                scale: 1,
                duration: 300,
                ease: 'Back.out'
            });

            // Apply event effect
            if (event.effect.type === 'tempMultiplier') {
                this.eventMultiplier = event.effect.value;

                this.time.delayedCall(event.effect.duration, () => {
                    this.eventMultiplier = 1;
                    this.activeEvent = null;
                    this.eventBanner.setVisible(false);
                });
            } else if (event.effect.type === 'tempBonus') {
                this.gameState.money += event.effect.value;
                this.showFloatingText(this.scale.width / 2, 250, `+$${event.effect.value}!`, '#FFD700');

                this.time.delayedCall(3000, () => {
                    this.activeEvent = null;
                    this.eventBanner.setVisible(false);
                });
            } else if (event.effect.type === 'instantBonus') {
                this.gameState.money += event.effect.value;
                this.showFloatingText(this.scale.width / 2, 250, `+$${event.effect.value}!`, '#FFD700');

                this.time.delayedCall(3000, () => {
                    this.activeEvent = null;
                    this.eventBanner.setVisible(false);
                });
            }

            this.updateUI();
        }
    }

    tryCollectItem() {
        const collected = Economy.tryCollectItem();

        if (collected) {
            const { collectionId, item } = collected;

            // Initialize collection if needed
            if (!this.gameState.collections[collectionId]) {
                this.gameState.collections[collectionId] = [];
            }

            // Add if not already collected
            if (!this.gameState.collections[collectionId].includes(item.id)) {
                this.gameState.collections[collectionId].push(item.id);

                soundManager.play('pop');
                this.showFloatingText(
                    this.scale.width / 2,
                    300,
                    `New: ${item.name}!`,
                    item.rarity === 'legendary' ? '#FFD700' : '#9C27B0'
                );
            }
        }
    }

    checkQuests() {
        const stats = {
            totalSales: this.gameState.totalSales,
            totalEarned: this.gameState.totalEarned,
            luckyBonuses: this.gameState.luckyBonuses || 0
        };

        const completed = Economy.checkQuests(
            stats,
            this.gameState.upgradeLevels,
            this.gameState.completedQuests
        );

        for (const quest of completed) {
            this.gameState.completedQuests.push(quest.id);
            this.gameState.money += quest.reward;

            soundManager.play('quest');
            this.showQuestComplete(quest);
        }

        if (completed.length > 0) {
            this.updateUI();
            this.saveGame();
        }
    }

    showQuestComplete(quest) {
        const { width, height } = this.scale;

        const banner = this.add.container(width / 2, height / 2);

        const bg = this.add.graphics();
        bg.fillStyle(0x9C27B0, 0.95);
        bg.fillRoundedRect(-150, -60, 300, 120, 20);
        banner.add(bg);

        banner.add(this.add.image(0, -30, 'star').setScale(0.8));

        banner.add(this.add.text(0, 10, `Quest Complete!\n${quest.name}`, {
            fontSize: '20px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5));

        banner.add(this.add.text(0, 50, `+$${quest.reward}`, {
            fontSize: '24px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5));

        banner.setScale(0);
        this.tweens.add({
            targets: banner,
            scale: 1,
            duration: 300,
            ease: 'Back.out'
        });

        this.time.delayedCall(2500, () => {
            this.tweens.add({
                targets: banner,
                scale: 0,
                alpha: 0,
                duration: 300,
                onComplete: () => banner.destroy()
            });
        });
    }

    checkStandUpgrade() {
        const newLevel = Economy.getStandLevel(this.gameState.totalEarned);
        const currentStandNum = parseInt(this.stand.texture.key.replace('stand', ''));

        if (newLevel.level > currentStandNum) {
            soundManager.play('levelUp');

            // Update stand
            this.stand.setTexture('stand' + newLevel.level);
            this.standLabel.setText(newLevel.name);

            // Celebration effect
            this.sparkleParticles.setPosition(this.scale.width / 2, this.scale.height / 2);
            this.sparkleParticles.explode(30);

            this.showFloatingText(
                this.scale.width / 2,
                this.scale.height / 2 - 100,
                `Level Up!\n${newLevel.name}`,
                '#FFD700'
            );

            this.updateStandDecorations();
        }
    }

    updateUI() {
        // Money
        this.moneyText.setText('$' + this.gameState.money.toFixed(2));

        // Stats
        const autoIncome = Economy.calculateAutoIncome(this.gameState.upgradeLevels);
        const clickValue = Economy.calculateClickValue(this.gameState.upgradeLevels);
        this.statsText.setText(`Per tap: $${clickValue.toFixed(2)} | Per sec: $${autoIncome.toFixed(2)}`);

        // Progress bar
        const progress = Economy.getStandProgress(this.gameState.totalEarned);
        const progressWidth = progress.progress * 300;
        this.progressFill.setScale(progressWidth / 200, 1);

        if (progress.next) {
            this.progressText.setText(`Next: ${progress.next.name} ($${progress.next.moneyRequired})`);
        } else {
            this.progressText.setText('MAX LEVEL!');
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

    returnFromOverlay() {
        this.updateUI();
        this.updateStandDecorations();
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

        // Semi-transparent background
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

        // Panel
        const panel = this.add.image(width / 2, height / 2, 'bigPanel');

        // Title
        this.add.text(width / 2, 80, 'SHOP', {
            fontSize: '36px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#8B4513',
            stroke: '#FFFFFF',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Close button
        const closeBtn = this.add.image(width - 40, 50, 'closeBtn').setInteractive();
        closeBtn.on('pointerdown', () => this.closeShop());

        // Category tabs
        this.currentCategory = 'stand';
        this.createTabs(width);

        // Scroll container for upgrades
        this.createUpgradeList(width, height);

        // Money display
        this.moneyText = this.add.text(width / 2, height - 50, '', {
            fontSize: '24px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#228B22'
        }).setOrigin(0.5);

        this.updateMoneyDisplay();
    }

    createTabs(width) {
        const categories = ['stand', 'marketing', 'helpers', 'special'];
        const tabY = 130;
        const tabWidth = 80;
        const startX = (width - (categories.length * tabWidth)) / 2 + tabWidth / 2;

        this.tabs = [];

        categories.forEach((cat, i) => {
            const x = startX + i * tabWidth;
            const isActive = cat === this.currentCategory;

            const tab = this.add.image(x, tabY, isActive ? 'tabActive' : 'tab');
            tab.setInteractive();

            const label = this.add.text(x, tabY, cat.charAt(0).toUpperCase() + cat.slice(1, 4), {
                fontSize: '14px',
                fontFamily: 'Comic Sans MS, cursive',
                color: '#8B4513'
            }).setOrigin(0.5);

            tab.on('pointerdown', () => {
                soundManager.play('click');
                this.currentCategory = cat;
                this.refreshTabs();
                this.refreshUpgradeList();
            });

            this.tabs.push({ tab, label, category: cat });
        });
    }

    refreshTabs() {
        this.tabs.forEach(t => {
            t.tab.setTexture(t.category === this.currentCategory ? 'tabActive' : 'tab');
        });
    }

    createUpgradeList(width, height) {
        this.upgradeContainer = this.add.container(0, 0);
        this.upgradeItems = [];

        this.refreshUpgradeList();
    }

    refreshUpgradeList() {
        // Clear existing items
        this.upgradeItems.forEach(item => item.destroy());
        this.upgradeItems = [];

        const { width, height } = this.scale;
        const startY = 180;
        const itemHeight = 90;
        let y = startY;

        // Get upgrades for current category
        const upgrades = Object.values(Economy.UPGRADES)
            .filter(u => u.category === this.currentCategory || this.currentCategory === 'special' && u.isEasterEgg);

        upgrades.forEach(upgrade => {
            const currentLevel = this.gameState.upgradeLevels[upgrade.id] || 0;
            const cost = Economy.calculateUpgradeCost(upgrade.id, currentLevel);
            const canAfford = this.gameState.money >= cost && currentLevel < upgrade.maxLevel;
            const maxed = currentLevel >= upgrade.maxLevel;

            const item = this.add.container(width / 2, y);

            // Background
            const bg = this.add.graphics();
            bg.fillStyle(canAfford ? 0xE8F5E9 : 0xF5F5F5, 1);
            bg.fillRoundedRect(-170, -35, 340, 80, 10);
            bg.lineStyle(2, canAfford ? COLORS.green : COLORS.gray);
            bg.strokeRoundedRect(-170, -35, 340, 80, 10);
            item.add(bg);

            // Name and level
            item.add(this.add.text(-160, -25, `${upgrade.name} (Lv.${currentLevel})`, {
                fontSize: '16px',
                fontFamily: 'Comic Sans MS, cursive',
                color: '#333333',
                fontStyle: 'bold'
            }));

            // Description
            item.add(this.add.text(-160, 0, upgrade.description, {
                fontSize: '12px',
                fontFamily: 'Comic Sans MS, cursive',
                color: '#666666'
            }));

            // Easter egg badge
            if (upgrade.isEasterEgg) {
                item.add(this.add.text(-160, 20, '★ Special!', {
                    fontSize: '11px',
                    fontFamily: 'Comic Sans MS, cursive',
                    color: '#9C27B0'
                }));
            }

            // Buy button
            const btnText = maxed ? 'MAX' : `$${cost.toFixed(2)}`;
            const btnColor = maxed ? COLORS.gray : (canAfford ? COLORS.green : COLORS.orange);

            const buyBtn = this.add.graphics();
            buyBtn.fillStyle(btnColor, 1);
            buyBtn.fillRoundedRect(80, -20, 80, 40, 8);
            item.add(buyBtn);

            const buyText = this.add.text(120, 0, btnText, {
                fontSize: '14px',
                fontFamily: 'Comic Sans MS, cursive',
                color: '#FFFFFF'
            }).setOrigin(0.5);
            item.add(buyText);

            if (!maxed) {
                const hitArea = this.add.rectangle(120, 0, 80, 40, 0x000000, 0).setInteractive();
                item.add(hitArea);

                hitArea.on('pointerdown', () => {
                    if (canAfford) {
                        this.buyUpgrade(upgrade.id);
                    } else {
                        soundManager.play('error');
                    }
                });
            }

            this.upgradeItems.push(item);
            y += itemHeight;
        });
    }

    buyUpgrade(upgradeId) {
        const currentLevel = this.gameState.upgradeLevels[upgradeId] || 0;
        const cost = Economy.calculateUpgradeCost(upgradeId, currentLevel);

        if (this.gameState.money >= cost) {
            this.gameState.money -= cost;
            this.gameState.upgradeLevels[upgradeId] = currentLevel + 1;

            soundManager.play('upgrade');
            this.updateMoneyDisplay();
            this.refreshUpgradeList();

            // Save
            this.parentScene.saveGame();
        }
    }

    updateMoneyDisplay() {
        this.moneyText.setText('Money: $' + this.gameState.money.toFixed(2));
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

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

        this.add.image(width / 2, height / 2, 'bigPanel');

        this.add.text(width / 2, 80, 'QUESTS', {
            fontSize: '36px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#8B4513',
            stroke: '#FFFFFF',
            strokeThickness: 3
        }).setOrigin(0.5);

        const closeBtn = this.add.image(width - 40, 50, 'closeBtn').setInteractive();
        closeBtn.on('pointerdown', () => this.closeQuests());

        this.createQuestList(width, height);
    }

    createQuestList(width, height) {
        const startY = 140;
        const itemHeight = 70;
        let y = startY;

        Economy.QUESTS.forEach(quest => {
            const isCompleted = this.gameState.completedQuests.includes(quest.id);

            const item = this.add.container(width / 2, y);

            const bg = this.add.graphics();
            bg.fillStyle(isCompleted ? 0xC8E6C9 : 0xFFF8E1, 1);
            bg.fillRoundedRect(-170, -28, 340, 60, 10);
            item.add(bg);

            // Checkbox
            const checkBg = this.add.graphics();
            checkBg.fillStyle(isCompleted ? COLORS.green : COLORS.white, 1);
            checkBg.lineStyle(2, isCompleted ? COLORS.darkGreen : COLORS.gray);
            checkBg.fillCircle(-145, 0, 15);
            checkBg.strokeCircle(-145, 0, 15);
            item.add(checkBg);

            if (isCompleted) {
                item.add(this.add.text(-145, 0, '✓', {
                    fontSize: '20px',
                    color: '#FFFFFF'
                }).setOrigin(0.5));
            }

            // Quest info
            item.add(this.add.text(-120, -15, quest.name, {
                fontSize: '16px',
                fontFamily: 'Comic Sans MS, cursive',
                color: isCompleted ? '#666666' : '#333333',
                fontStyle: 'bold'
            }));

            item.add(this.add.text(-120, 8, quest.description, {
                fontSize: '12px',
                fontFamily: 'Comic Sans MS, cursive',
                color: '#666666'
            }));

            // Reward
            item.add(this.add.text(140, 0, `$${quest.reward}`, {
                fontSize: '16px',
                fontFamily: 'Comic Sans MS, cursive',
                color: '#FFD700',
                fontStyle: 'bold'
            }).setOrigin(0.5));

            y += itemHeight;

            // Limit visible quests
            if (y > height - 100) return;
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

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

        this.add.image(width / 2, height / 2 - 50, 'panel').setScale(1.2, 2);

        this.add.text(width / 2, 180, 'MENU', {
            fontSize: '36px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#8B4513',
            stroke: '#FFFFFF',
            strokeThickness: 3
        }).setOrigin(0.5);

        const closeBtn = this.add.image(width - 40, 160, 'closeBtn').setInteractive();
        closeBtn.on('pointerdown', () => this.closeSettings());

        // Sound toggle
        this.createToggle(width / 2, 260, 'Sound', this.gameState.settings?.soundEnabled !== false, (val) => {
            this.gameState.settings.soundEnabled = val;
            soundManager.enabled = val;
            this.parentScene.saveGame();
        });

        // Particles toggle
        this.createToggle(width / 2, 330, 'Particles', this.gameState.settings?.particlesEnabled !== false, (val) => {
            this.gameState.settings.particlesEnabled = val;
            this.parentScene.saveGame();
        });

        // Stats
        this.add.text(width / 2, 400, `Total Earned: $${this.gameState.totalEarned.toFixed(2)}`, {
            fontSize: '16px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#666666'
        }).setOrigin(0.5);

        this.add.text(width / 2, 430, `Total Sales: ${this.gameState.totalSales}`, {
            fontSize: '16px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#666666'
        }).setOrigin(0.5);

        // Collection count
        let collectedItems = 0;
        Object.values(this.gameState.collections).forEach(c => collectedItems += c.length);
        const totalItems = Object.values(Economy.COLLECTIONS).reduce((sum, c) => sum + c.items.length, 0);

        this.add.text(width / 2, 460, `Collections: ${collectedItems}/${totalItems}`, {
            fontSize: '16px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#666666'
        }).setOrigin(0.5);

        // Reset button
        this.createResetButton(width / 2, 530);
    }

    createToggle(x, y, label, initialValue, onChange) {
        const container = this.add.container(x, y);

        container.add(this.add.text(-80, 0, label, {
            fontSize: '20px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#333333'
        }).setOrigin(0, 0.5));

        const toggleBg = this.add.graphics();
        toggleBg.fillStyle(initialValue ? COLORS.green : COLORS.gray, 1);
        toggleBg.fillRoundedRect(40, -15, 60, 30, 15);
        container.add(toggleBg);

        const toggleKnob = this.add.circle(initialValue ? 85 : 55, 0, 12, COLORS.white);
        container.add(toggleKnob);

        let isOn = initialValue;

        const hitArea = this.add.rectangle(70, 0, 60, 30, 0x000000, 0).setInteractive();
        container.add(hitArea);

        hitArea.on('pointerdown', () => {
            isOn = !isOn;
            soundManager.play('click');

            toggleBg.clear();
            toggleBg.fillStyle(isOn ? COLORS.green : COLORS.gray, 1);
            toggleBg.fillRoundedRect(40, -15, 60, 30, 15);

            this.tweens.add({
                targets: toggleKnob,
                x: isOn ? 85 : 55,
                duration: 100
            });

            onChange(isOn);
        });

        return container;
    }

    createResetButton(x, y) {
        const btn = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0xFF5555, 1);
        bg.fillRoundedRect(-80, -20, 160, 40, 10);
        btn.add(bg);

        btn.add(this.add.text(0, 0, 'Reset Save', {
            fontSize: '18px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#FFFFFF'
        }).setOrigin(0.5));

        const hitArea = this.add.rectangle(0, 0, 160, 40, 0x000000, 0).setInteractive();
        btn.add(hitArea);

        hitArea.on('pointerdown', () => {
            soundManager.play('click');
            this.showResetConfirm();
        });
    }

    showResetConfirm() {
        const { width, height } = this.scale;

        const overlay = this.add.container(width / 2, height / 2);

        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(-width / 2, -height / 2, width, height);
        overlay.add(bg);

        const panel = this.add.graphics();
        panel.fillStyle(COLORS.white, 1);
        panel.fillRoundedRect(-150, -100, 300, 200, 20);
        overlay.add(panel);

        overlay.add(this.add.text(0, -60, 'Reset All Progress?', {
            fontSize: '22px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#FF5555',
            fontStyle: 'bold'
        }).setOrigin(0.5));

        overlay.add(this.add.text(0, -20, 'This cannot be undone!', {
            fontSize: '16px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#666666'
        }).setOrigin(0.5));

        // Yes button
        const yesBg = this.add.graphics();
        yesBg.fillStyle(0xFF5555, 1);
        yesBg.fillRoundedRect(-130, 30, 120, 50, 10);
        overlay.add(yesBg);

        overlay.add(this.add.text(-70, 55, 'Yes, Reset', {
            fontSize: '16px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#FFFFFF'
        }).setOrigin(0.5));

        const yesHit = this.add.rectangle(-70, 55, 120, 50, 0x000000, 0).setInteractive();
        overlay.add(yesHit);

        yesHit.on('pointerdown', () => {
            soundManager.play('click');
            localStorage.removeItem('marlowLemonade');
            window.location.reload();
        });

        // No button
        const noBg = this.add.graphics();
        noBg.fillStyle(COLORS.green, 1);
        noBg.fillRoundedRect(10, 30, 120, 50, 10);
        overlay.add(noBg);

        overlay.add(this.add.text(70, 55, 'No, Keep', {
            fontSize: '16px',
            fontFamily: 'Comic Sans MS, cursive',
            color: '#FFFFFF'
        }).setOrigin(0.5));

        const noHit = this.add.rectangle(70, 55, 120, 50, 0x000000, 0).setInteractive();
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

// Game configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        min: {
            width: 320,
            height: 480
        },
        max: {
            width: 480,
            height: 960
        }
    },
    scene: [BootScene, MainMenuScene, GameScene, ShopScene, QuestScene, SettingsScene],
    render: {
        pixelArt: false,
        antialias: true
    },
    input: {
        activePointers: 3
    }
};

// Start the game
window.addEventListener('load', () => {
    const game = new Phaser.Game(config);
});
