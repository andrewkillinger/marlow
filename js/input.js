// Input handling for touch and mouse
class InputHandler {
    constructor(canvas, engine, ui) {
        this.canvas = canvas;
        this.engine = engine;
        this.ui = ui;

        this.isDrawing = false;
        this.lastPos = null;
        this.pinchStartDist = null;
        this.initialBrushSize = null;

        this.initEventListeners();
    }

    initEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
        this.canvas.addEventListener('mouseup', () => this.onPointerUp());
        this.canvas.addEventListener('mouseleave', () => this.onPointerUp());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        this.canvas.addEventListener('touchcancel', () => this.onPointerUp());

        // Prevent context menu on long press
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Keyboard for brush size (desktop)
        document.addEventListener('keydown', (e) => {
            if (e.key === '[') {
                this.ui.setBrushSize(this.ui.brushSize - 1);
            } else if (e.key === ']') {
                this.ui.setBrushSize(this.ui.brushSize + 1);
            }
        });

        // Mouse wheel for brush size
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1;
            this.ui.setBrushSize(this.ui.brushSize + delta);
        }, { passive: false });
    }

    getCanvasPos(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: Math.floor((clientX - rect.left) * scaleX / this.engine.pixelSize),
            y: Math.floor((clientY - rect.top) * scaleY / this.engine.pixelSize)
        };
    }

    onPointerDown(e) {
        if (e.target !== this.canvas) return;
        this.isDrawing = true;
        const pos = this.getCanvasPos(e.clientX, e.clientY);
        this.lastPos = pos;
        this.draw(pos.x, pos.y);
    }

    onPointerMove(e) {
        const pos = this.getCanvasPos(e.clientX, e.clientY);
        this.ui.showBrushIndicator(e.clientX, e.clientY);

        if (!this.isDrawing) return;

        // Draw line from last position to current
        if (this.lastPos) {
            this.drawLine(this.lastPos.x, this.lastPos.y, pos.x, pos.y);
        }
        this.lastPos = pos;
    }

    onPointerUp() {
        this.isDrawing = false;
        this.lastPos = null;
        this.ui.hideBrushIndicator();
    }

    onTouchStart(e) {
        e.preventDefault();

        if (e.touches.length === 2) {
            // Pinch gesture for brush size
            this.pinchStartDist = this.getPinchDistance(e.touches);
            this.initialBrushSize = this.ui.brushSize;
            this.isDrawing = false;
            return;
        }

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.isDrawing = true;
            const pos = this.getCanvasPos(touch.clientX, touch.clientY);
            this.lastPos = pos;
            this.draw(pos.x, pos.y);
        }
    }

    onTouchMove(e) {
        e.preventDefault();

        if (e.touches.length === 2 && this.pinchStartDist !== null) {
            // Handle pinch for brush size
            const currentDist = this.getPinchDistance(e.touches);
            const scale = currentDist / this.pinchStartDist;
            const newSize = Math.round(this.initialBrushSize * scale);
            this.ui.setBrushSize(newSize);
            return;
        }

        if (e.touches.length === 1 && this.isDrawing) {
            const touch = e.touches[0];
            const pos = this.getCanvasPos(touch.clientX, touch.clientY);
            this.ui.showBrushIndicator(touch.clientX, touch.clientY);

            if (this.lastPos) {
                this.drawLine(this.lastPos.x, this.lastPos.y, pos.x, pos.y);
            }
            this.lastPos = pos;
        }
    }

    onTouchEnd(e) {
        if (e.touches.length === 0) {
            this.isDrawing = false;
            this.lastPos = null;
            this.pinchStartDist = null;
            this.initialBrushSize = null;
            this.ui.hideBrushIndicator();
        } else if (e.touches.length === 1) {
            // Transitioned from pinch to single touch
            this.pinchStartDist = null;
            const touch = e.touches[0];
            const pos = this.getCanvasPos(touch.clientX, touch.clientY);
            this.lastPos = pos;
            this.isDrawing = true;
        }
    }

    getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    draw(x, y) {
        const brushSize = this.ui.brushSize;
        const isEraser = this.ui.currentTool === 'eraser';

        for (let dx = -brushSize; dx <= brushSize; dx++) {
            for (let dy = -brushSize; dy <= brushSize; dy++) {
                // Circular brush
                if (dx * dx + dy * dy <= brushSize * brushSize) {
                    const px = x + dx;
                    const py = y + dy;

                    if (isEraser) {
                        this.engine.removeParticle(px, py);
                    } else {
                        // Add some randomness to make it look more natural
                        if (Math.random() < 0.7) {
                            this.engine.createParticle(px, py, this.ui.currentMaterial);
                        }
                    }
                }
            }
        }
    }

    drawLine(x0, y0, x1, y1) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            this.draw(x0, y0);

            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }
}
