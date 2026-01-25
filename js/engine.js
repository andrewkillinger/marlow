// Physics simulation engine
class ParticleEngine {
    constructor(width, height, pixelSize = 4) {
        this.pixelSize = pixelSize;
        this.width = Math.floor(width / pixelSize);
        this.height = Math.floor(height / pixelSize);
        this.grid = new Array(this.width * this.height).fill(null);
        this.updateOrder = [];
        this.frameCount = 0;

        // Pre-calculate indices for performance
        this.initUpdateOrder();
    }

    initUpdateOrder() {
        // Create shuffled update order to prevent directional bias
        this.updateOrder = [];
        for (let i = 0; i < this.width * this.height; i++) {
            this.updateOrder.push(i);
        }
    }

    resize(width, height) {
        const newWidth = Math.floor(width / this.pixelSize);
        const newHeight = Math.floor(height / this.pixelSize);
        const newGrid = new Array(newWidth * newHeight).fill(null);

        // Copy existing particles to new grid
        for (let x = 0; x < Math.min(this.width, newWidth); x++) {
            for (let y = 0; y < Math.min(this.height, newHeight); y++) {
                const oldIdx = y * this.width + x;
                const newIdx = y * newWidth + x;
                newGrid[newIdx] = this.grid[oldIdx];
            }
        }

        this.width = newWidth;
        this.height = newHeight;
        this.grid = newGrid;
        this.initUpdateOrder();
    }

    getIndex(x, y) {
        return y * this.width + x;
    }

    inBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getParticle(x, y) {
        if (!this.inBounds(x, y)) return null;
        return this.grid[this.getIndex(x, y)];
    }

    setParticle(x, y, particle) {
        if (!this.inBounds(x, y)) return;
        this.grid[this.getIndex(x, y)] = particle;
    }

    createParticle(x, y, type) {
        if (!this.inBounds(x, y)) return;
        if (this.getParticle(x, y) !== null) return;

        const material = Materials[type];
        if (!material) return;

        const particle = {
            type: type,
            color: getMaterialColor(type),
            updated: false,
            lifetime: material.lifetime || -1,
            velocity: { x: 0, y: 0 }
        };

        this.setParticle(x, y, particle);
    }

    removeParticle(x, y) {
        if (!this.inBounds(x, y)) return;
        this.grid[this.getIndex(x, y)] = null;
    }

    swapParticles(x1, y1, x2, y2) {
        if (!this.inBounds(x1, y1) || !this.inBounds(x2, y2)) return false;
        const idx1 = this.getIndex(x1, y1);
        const idx2 = this.getIndex(x2, y2);
        const temp = this.grid[idx1];
        this.grid[idx1] = this.grid[idx2];
        this.grid[idx2] = temp;
        return true;
    }

    update() {
        this.frameCount++;

        // Reset updated flags
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i]) this.grid[i].updated = false;
        }

        // Update from bottom to top, alternating left-right direction
        const leftToRight = this.frameCount % 2 === 0;

        for (let y = this.height - 1; y >= 0; y--) {
            const startX = leftToRight ? 0 : this.width - 1;
            const endX = leftToRight ? this.width : -1;
            const stepX = leftToRight ? 1 : -1;

            for (let x = startX; x !== endX; x += stepX) {
                const particle = this.getParticle(x, y);
                if (!particle || particle.updated) continue;

                this.updateParticle(x, y, particle);
            }
        }
    }

    updateParticle(x, y, particle) {
        particle.updated = true;
        const material = Materials[particle.type];
        if (!material) return;

        // Handle lifetime (for fire, steam, smoke)
        if (particle.lifetime > 0) {
            particle.lifetime--;
            if (particle.lifetime <= 0) {
                this.removeParticle(x, y);
                return;
            }
        }

        // Process interactions first
        this.processInteractions(x, y, particle);

        // Then handle movement based on behavior
        switch (material.behavior) {
            case 'fall':
                this.updatePowder(x, y, particle);
                break;
            case 'liquid':
                this.updateLiquid(x, y, particle);
                break;
            case 'gas':
                this.updateGas(x, y, particle);
                break;
            case 'fire':
                this.updateFire(x, y, particle);
                break;
            case 'plant':
                this.updatePlant(x, y, particle);
                break;
            // static materials don't move
        }
    }

    updatePowder(x, y, particle) {
        const below = this.getParticle(x, y + 1);

        // Try to fall straight down
        if (this.canMoveTo(x, y + 1, particle.type)) {
            this.swapParticles(x, y, x, y + 1);
            return;
        }

        // Try to slide diagonally
        const dir = Math.random() < 0.5 ? -1 : 1;
        if (this.canMoveTo(x + dir, y + 1, particle.type)) {
            this.swapParticles(x, y, x + dir, y + 1);
            return;
        }
        if (this.canMoveTo(x - dir, y + 1, particle.type)) {
            this.swapParticles(x, y, x - dir, y + 1);
        }
    }

    updateLiquid(x, y, particle) {
        // Try to fall straight down
        if (this.canMoveTo(x, y + 1, particle.type)) {
            this.swapParticles(x, y, x, y + 1);
            return;
        }

        // Try to slide diagonally down
        const dir = Math.random() < 0.5 ? -1 : 1;
        if (this.canMoveTo(x + dir, y + 1, particle.type)) {
            this.swapParticles(x, y, x + dir, y + 1);
            return;
        }
        if (this.canMoveTo(x - dir, y + 1, particle.type)) {
            this.swapParticles(x, y, x - dir, y + 1);
            return;
        }

        // Spread horizontally
        const spreadDist = 2 + Math.floor(Math.random() * 2);
        for (let i = 1; i <= spreadDist; i++) {
            if (this.canMoveTo(x + dir * i, y, particle.type)) {
                this.swapParticles(x, y, x + dir * i, y);
                return;
            }
        }
        for (let i = 1; i <= spreadDist; i++) {
            if (this.canMoveTo(x - dir * i, y, particle.type)) {
                this.swapParticles(x, y, x - dir * i, y);
                return;
            }
        }
    }

    updateGas(x, y, particle) {
        // Rise upward with some randomness
        const dir = Math.random() < 0.5 ? -1 : 1;

        // Try to rise
        if (Math.random() < 0.8 && this.canMoveToGas(x, y - 1, particle.type)) {
            this.swapParticles(x, y, x, y - 1);
            return;
        }

        // Try diagonal up
        if (this.canMoveToGas(x + dir, y - 1, particle.type)) {
            this.swapParticles(x, y, x + dir, y - 1);
            return;
        }

        // Spread horizontally
        if (Math.random() < 0.3 && this.canMoveToGas(x + dir, y, particle.type)) {
            this.swapParticles(x, y, x + dir, y);
        }
    }

    updateFire(x, y, particle) {
        // Fire rises and spreads
        particle.color = Materials[MaterialType.FIRE].colors[
            Math.floor(Math.random() * Materials[MaterialType.FIRE].colors.length)
        ];

        // Spread fire to adjacent flammable materials
        this.spreadFire(x, y);

        // Create smoke occasionally
        if (Math.random() < 0.1 && this.inBounds(x, y - 1) && !this.getParticle(x, y - 1)) {
            this.createParticle(x, y - 1, MaterialType.SMOKE);
        }

        // Rise with randomness
        const dir = Math.random() < 0.5 ? -1 : 1;
        if (Math.random() < 0.7 && this.canMoveToGas(x, y - 1, particle.type)) {
            this.swapParticles(x, y, x, y - 1);
            return;
        }
        if (this.canMoveToGas(x + dir, y - 1, particle.type)) {
            this.swapParticles(x, y, x + dir, y - 1);
        }
    }

    updatePlant(x, y, particle) {
        const material = Materials[MaterialType.PLANT];

        // Try to grow if adjacent to water
        const neighbors = [
            [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
        ];

        let hasWater = false;
        for (const [nx, ny] of neighbors) {
            const neighbor = this.getParticle(nx, ny);
            if (neighbor && neighbor.type === MaterialType.WATER) {
                hasWater = true;
                break;
            }
        }

        if (hasWater && Math.random() < material.growthRate) {
            // Grow in a random empty direction, preferring upward
            const growDirs = [[x, y - 1], [x - 1, y], [x + 1, y], [x - 1, y - 1], [x + 1, y - 1]];
            for (const [gx, gy] of growDirs) {
                if (this.inBounds(gx, gy) && !this.getParticle(gx, gy)) {
                    if (Math.random() < 0.3) {
                        this.createParticle(gx, gy, MaterialType.PLANT);
                        // Consume water occasionally
                        for (const [nx, ny] of neighbors) {
                            const neighbor = this.getParticle(nx, ny);
                            if (neighbor && neighbor.type === MaterialType.WATER && Math.random() < 0.3) {
                                this.removeParticle(nx, ny);
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }
    }

    spreadFire(x, y) {
        const neighbors = [
            [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
            [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]
        ];

        for (const [nx, ny] of neighbors) {
            const neighbor = this.getParticle(nx, ny);
            if (!neighbor) continue;

            const neighborMat = Materials[neighbor.type];
            if (neighborMat && neighborMat.flammable && Math.random() < 0.05) {
                // Ignite the neighbor
                neighbor.type = MaterialType.FIRE;
                neighbor.color = getMaterialColor(MaterialType.FIRE);
                neighbor.lifetime = Materials[MaterialType.FIRE].lifetime + Math.floor(Math.random() * 30);
            }
        }
    }

    processInteractions(x, y, particle) {
        const neighbors = [
            [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
        ];

        for (const [nx, ny] of neighbors) {
            const neighbor = this.getParticle(nx, ny);
            if (!neighbor) continue;

            // Water + Lava = Stone + Steam
            if (particle.type === MaterialType.WATER && neighbor.type === MaterialType.LAVA) {
                neighbor.type = MaterialType.STONE;
                neighbor.color = getMaterialColor(MaterialType.STONE);
                neighbor.lifetime = -1;
                particle.type = MaterialType.STEAM;
                particle.color = getMaterialColor(MaterialType.STEAM);
                particle.lifetime = Materials[MaterialType.STEAM].lifetime;
                return;
            }

            // Lava + Water = Stone + Steam
            if (particle.type === MaterialType.LAVA && neighbor.type === MaterialType.WATER) {
                particle.type = MaterialType.STONE;
                particle.color = getMaterialColor(MaterialType.STONE);
                particle.lifetime = -1;
                neighbor.type = MaterialType.STEAM;
                neighbor.color = getMaterialColor(MaterialType.STEAM);
                neighbor.lifetime = Materials[MaterialType.STEAM].lifetime;
                return;
            }

            // Water extinguishes Fire
            if (particle.type === MaterialType.WATER && neighbor.type === MaterialType.FIRE) {
                this.removeParticle(nx, ny);
                this.createParticle(nx, ny, MaterialType.STEAM);
            }

            // Fire evaporates Water
            if (particle.type === MaterialType.FIRE && neighbor.type === MaterialType.WATER) {
                if (Math.random() < 0.1) {
                    neighbor.type = MaterialType.STEAM;
                    neighbor.color = getMaterialColor(MaterialType.STEAM);
                    neighbor.lifetime = Materials[MaterialType.STEAM].lifetime;
                }
            }

            // Lava ignites flammable materials
            if (particle.type === MaterialType.LAVA) {
                const neighborMat = Materials[neighbor.type];
                if (neighborMat && neighborMat.flammable && Math.random() < 0.2) {
                    neighbor.type = MaterialType.FIRE;
                    neighbor.color = getMaterialColor(MaterialType.FIRE);
                    neighbor.lifetime = Materials[MaterialType.FIRE].lifetime + Math.floor(Math.random() * 40);
                }
            }
        }
    }

    canMoveTo(x, y, type) {
        if (!this.inBounds(x, y)) return false;
        const target = this.getParticle(x, y);
        if (!target) return true;
        return canDisplace(type, target.type);
    }

    canMoveToGas(x, y, type) {
        if (!this.inBounds(x, y)) return false;
        const target = this.getParticle(x, y);
        if (!target) return true;
        // Gases can move through other gases based on density
        const targetMat = Materials[target.type];
        const typeMat = Materials[type];
        return targetMat && typeMat && targetMat.state === 'gas' && typeMat.density < targetMat.density;
    }

    clear() {
        this.grid.fill(null);
    }
}
