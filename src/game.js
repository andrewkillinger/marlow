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

        // Sky gradient background
        const bg = this.add.graphics();
        for (let i = 0; i < 20; i++) {
            const t = i / 20;
            const r = Math.floor(125 + (186 - 125) * t);
            const g = Math.floor(211 + (230 - 211) * t);
            const b = Math.floor(252 + (253 - 252) * t);
            bg.fillStyle((r << 16) | (g << 8) | b);
            bg.fillRect(0, (height / 20) * i, width, height / 20 + 1);
        }

        // Sun
        this.add.circle(width - 50, 70, 45, 0xFCD34D);
        this.add.circle(width - 50, 70, 35, 0xFEF3C7);

        // Clouds
        this.createCloud(60, 80);
        this.createCloud(200, 50);
        this.createCloud(320, 100);

        // Ground
        bg.fillStyle(COLORS.grass);
        bg.fillRect(0, height - 180, width, 180);
        bg.fillStyle(0x4ADE80);
        bg.fillRect(0, height - 180, width, 8);

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

        // Sky gradient
        for (let i = 0; i < 15; i++) {
            const t = i / 15;
            const r = Math.floor(125 + (186 - 125) * t);
            const g = Math.floor(211 + (230 - 211) * t);
            const b = Math.floor(252 + (253 - 252) * t);
            bg.fillStyle((r << 16) | (g << 8) | b);
            bg.fillRect(0, (height * 0.7 / 15) * i, width, height * 0.7 / 15 + 1);
        }

        // Sun
        this.add.circle(width - 45, 60, 38, 0xFCD34D);
        this.add.circle(width - 45, 60, 28, 0xFEF3C7);

        // Clouds
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
        bg.fillRect(0, height - 200, width, 200);
        bg.fillStyle(0x4ADE80);
        bg.fillRect(0, height - 200, width, 6);
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

        // Bottom navigation
        this.createBottomNav(width, height);
        this.updateUI();
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

        // Calculate button spacing based on width
        const buttonSpacing = Math.min(100, (width - 80) / 3);

        const buttons = [
            { x: width / 2 - buttonSpacing, label: 'Shop', icon: '🛒', callback: () => this.openShop() },
            { x: width / 2, label: 'Quests', icon: '⭐', callback: () => this.openQuests() },
            { x: width / 2 + buttonSpacing, label: 'Menu', icon: '⚙️', callback: () => this.openSettings() }
        ];

        buttons.forEach(btn => {
            const container = this.add.container(btn.x, navY);

            const hitArea = this.add.rectangle(0, 0, 80, 60, 0x000000, 0).setInteractive({ useHandCursor: true });
            container.add(hitArea);

            const icon = this.add.text(0, -8, btn.icon, { fontSize: '22px' }).setOrigin(0.5);
            container.add(icon);

            const label = this.add.text(0, 16, btn.label, {
                fontSize: '12px',
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

            this.bottomNav.add(container);
        });
    }

    shutdown() {
        this.scale.off('resize', this.handleResize, this);
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

        let clickValue = Economy.calculateClickValue(this.gameState.upgradeLevels);
        clickValue *= Economy.calculatePriceMultiplier(this.gameState.upgradeLevels);
        clickValue *= this.eventMultiplier;

        const luckyChance = Economy.calculateLuckyChance(this.gameState.upgradeLevels);
        const isLucky = Math.random() < luckyChance;

        if (isLucky) {
            clickValue *= 5;
            this.gameState.luckyBonuses = (this.gameState.luckyBonuses || 0) + 1;
            soundManager.play('coin');
        }

        this.gameState.money += clickValue;
        this.gameState.totalEarned += clickValue;
        this.gameState.totalSales++;

        this.showFloatingText(
            pointer.x, pointer.y - 30,
            isLucky ? `+$${clickValue.toFixed(2)} 🍀` : `+$${clickValue.toFixed(2)}`,
            isLucky ? '#F59E0B' : '#166534'
        );

        if (this.gameState.settings?.particlesEnabled !== false) {
            this.coinParticles.setPosition(pointer.x, pointer.y);
            this.coinParticles.explode(isLucky ? 6 : 2);
            if (isLucky) {
                this.sparkleParticles.setPosition(pointer.x, pointer.y);
                this.sparkleParticles.explode(8);
            }
        }

        this.tweens.add({
            targets: this.marlow,
            scaleX: 1.2,
            scaleY: 1.0,
            duration: 60,
            yoyo: true
        });

        this.updateUI();
        this.checkStandUpgrade();
    }

    showFloatingText(x, y, text, color) {
        const floatText = this.add.text(x, y, text, {
            fontSize: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: color,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatText,
            y: y - 50,
            alpha: 0,
            duration: 800,
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

        if (completed.length > 0) {
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
            this.progressText.setText(`Next: ${progress.next.name} ($${progress.next.moneyRequired})`);
        } else {
            this.progressText.setText('🏆 Max Level!');
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
        card.fillRoundedRect(30, 150, width - 60, 400, 24);

        this.add.text(width / 2, 185, 'Settings', {
            fontSize: '26px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#111827',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const closeBtn = this.add.image(width - 55, 180, 'closeBtn').setScale(1).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.closeSettings());

        // Toggles
        this.createToggle(width / 2, 250, 'Sound Effects', this.gameState.settings?.soundEnabled !== false, (val) => {
            this.gameState.settings.soundEnabled = val;
            soundManager.enabled = val;
            this.parentScene.saveGame();
        });

        this.createToggle(width / 2, 310, 'Particles', this.gameState.settings?.particlesEnabled !== false, (val) => {
            this.gameState.settings.particlesEnabled = val;
            this.parentScene.saveGame();
        });

        // Stats
        this.add.text(width / 2, 370, `Total Earned: $${this.gameState.totalEarned.toFixed(2)}`, {
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#6B7280'
        }).setOrigin(0.5);

        this.add.text(width / 2, 395, `Total Sales: ${this.gameState.totalSales}`, {
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#6B7280'
        }).setOrigin(0.5);

        // Reset button
        this.createResetButton(width / 2, 470);
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
    scene: [BootScene, MainMenuScene, GameScene, ShopScene, QuestScene, SettingsScene],
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
