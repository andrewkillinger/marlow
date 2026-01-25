// Main game controller
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set up canvas size
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Initialize engine with pixel size of 4
        this.pixelSize = 4;
        this.engine = new ParticleEngine(this.canvas.width, this.canvas.height, this.pixelSize);

        // Initialize UI and input
        this.ui = new UI();
        this.input = new InputHandler(this.canvas, this.engine, this.ui);

        // Expose game globally for UI access
        window.game = this;

        // Start game loop
        this.lastTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.accumulator = 0;

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.ctx.scale(dpr, dpr);

        if (this.engine) {
            this.engine.resize(this.canvas.width, this.canvas.height);
        }
    }

    gameLoop(currentTime) {
        requestAnimationFrame((time) => this.gameLoop(time));

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.accumulator += deltaTime;

        // Update physics at fixed rate
        while (this.accumulator >= this.frameInterval) {
            this.engine.update();
            this.accumulator -= this.frameInterval;
        }

        // Render
        this.render();
    }

    render() {
        const ctx = this.ctx;
        const engine = this.engine;
        const pixelSize = this.pixelSize;

        // Clear with background color
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw atmospheric gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f0f23');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render particles
        for (let y = 0; y < engine.height; y++) {
            for (let x = 0; x < engine.width; x++) {
                const particle = engine.getParticle(x, y);
                if (!particle) continue;

                ctx.fillStyle = particle.color;

                // Draw with slight variations for visual interest
                const px = x * pixelSize;
                const py = y * pixelSize;

                ctx.fillRect(px, py, pixelSize, pixelSize);

                // Add glow effect for fire and lava
                const material = Materials[particle.type];
                if (material && material.glows) {
                    ctx.save();
                    ctx.globalAlpha = 0.3 + Math.random() * 0.2;
                    ctx.shadowColor = particle.color;
                    ctx.shadowBlur = 8;
                    ctx.fillRect(px, py, pixelSize, pixelSize);
                    ctx.restore();
                }
            }
        }

        // Add subtle vignette effect
        this.renderVignette();
    }

    renderVignette() {
        const ctx = this.ctx;
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.max(width, height) * 0.8;

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
