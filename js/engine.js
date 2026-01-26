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
            velocity: { x: 0, y: 0 },
            fallDistance: 0
        };

        // Initialize animal properties
        if (material.isAnimal) {
            particle.health = material.maxHealth || 1;
            particle.direction = Math.random() < 0.5 ? -1 : 1;
            particle.actionCooldown = 0;
            particle.isGrounded = false;
        }

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
            case 'ant':
                this.updateAnt(x, y, particle);
                break;
            case 'fish':
                this.updateFish(x, y, particle);
                break;
            case 'bird':
                this.updateBird(x, y, particle);
                break;
            case 'frog':
                this.updateFrog(x, y, particle);
                break;
            case 'worm':
                this.updateWorm(x, y, particle);
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

    // ========== ANIMAL BEHAVIORS ==========

    // Check if animal should take fall damage and die
    checkFallDamage(x, y, particle, landed) {
        const material = Materials[particle.type];
        if (!material || !material.isAnimal) return false;

        if (landed && particle.fallDistance > 0) {
            if (particle.fallDistance >= material.fallDamageThreshold) {
                // Animal dies from fall damage - create splat
                this.killAnimal(x, y, particle);
                return true;
            }
            particle.fallDistance = 0;
        }
        return false;
    }

    // Kill an animal and create blood splatter
    killAnimal(x, y, particle) {
        // Remove the animal
        this.removeParticle(x, y);

        // Create blood splatter
        const splatSize = 2 + Math.floor(Math.random() * 3);
        for (let dx = -splatSize; dx <= splatSize; dx++) {
            for (let dy = -splatSize; dy <= splatSize; dy++) {
                if (dx * dx + dy * dy <= splatSize * splatSize) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (this.inBounds(nx, ny) && !this.getParticle(nx, ny)) {
                        if (Math.random() < 0.6) {
                            this.createParticle(nx, ny, MaterialType.BLOOD);
                        }
                    }
                }
            }
        }
    }

    // Check if position is solid ground
    isSolidGround(x, y) {
        const particle = this.getParticle(x, y);
        if (!particle) return false;
        const mat = Materials[particle.type];
        return mat && (mat.state === 'solid' || mat.state === 'powder');
    }

    // Check if position is water
    isWater(x, y) {
        const particle = this.getParticle(x, y);
        return particle && particle.type === MaterialType.WATER;
    }

    // Check if position is empty or passable for animals
    isPassable(x, y) {
        if (!this.inBounds(x, y)) return false;
        const particle = this.getParticle(x, y);
        if (!particle) return true;
        const mat = Materials[particle.type];
        return mat && (mat.state === 'gas' || mat.state === 'liquid');
    }

    // Ant: walks along surfaces, follows other ants
    updateAnt(x, y, particle) {
        if (particle.actionCooldown > 0) particle.actionCooldown--;

        const below = this.getParticle(x, y + 1);
        const onGround = below && Materials[below.type]?.state !== 'gas';

        // Apply gravity if not on ground
        if (!onGround && this.isPassable(x, y + 1)) {
            particle.fallDistance++;
            this.swapParticles(x, y, x, y + 1);
            return;
        }

        // Check fall damage when landing
        if (onGround && particle.fallDistance > 0) {
            if (this.checkFallDamage(x, y, particle, true)) return;
        }

        // Walk along surfaces
        if (onGround && particle.actionCooldown === 0) {
            const dir = particle.direction;

            // Try to walk in current direction
            if (this.isPassable(x + dir, y)) {
                // Check if there's ground ahead or we can climb down
                if (this.isSolidGround(x + dir, y + 1)) {
                    this.swapParticles(x, y, x + dir, y);
                    particle.actionCooldown = 2;
                } else if (this.isPassable(x + dir, y + 1)) {
                    // Walk down slope
                    this.swapParticles(x, y, x + dir, y + 1);
                    particle.actionCooldown = 2;
                }
            } else if (this.isPassable(x + dir, y - 1)) {
                // Climb up
                this.swapParticles(x, y, x + dir, y - 1);
                particle.actionCooldown = 3;
            } else {
                // Turn around
                particle.direction = -dir;
            }

            // Randomly change direction sometimes
            if (Math.random() < 0.02) particle.direction = -particle.direction;
        }
    }

    // Fish: swims in water, dies outside water
    updateFish(x, y, particle) {
        if (particle.actionCooldown > 0) particle.actionCooldown--;

        const inWater = this.isWater(x, y - 1) || this.isWater(x, y + 1) ||
                        this.isWater(x - 1, y) || this.isWater(x + 1, y);

        // Fish dies if not in or adjacent to water
        if (!inWater) {
            particle.health -= 0.02;
            if (particle.health <= 0) {
                this.killAnimal(x, y, particle);
                return;
            }
        } else {
            particle.health = Math.min(particle.health + 0.01, Materials[particle.type].maxHealth);
        }

        // Swimming behavior
        if (inWater && particle.actionCooldown === 0) {
            const dir = particle.direction;
            const swimDirs = [
                [x + dir, y],
                [x + dir, y - 1],
                [x + dir, y + 1],
                [x, y - 1],
                [x, y + 1]
            ];

            // Shuffle a bit for natural movement
            if (Math.random() < 0.3) {
                const moveDir = swimDirs[Math.floor(Math.random() * swimDirs.length)];
                if (this.isWater(moveDir[0], moveDir[1])) {
                    this.swapParticles(x, y, moveDir[0], moveDir[1]);
                    particle.actionCooldown = 3;
                }
            }

            if (Math.random() < 0.05) particle.direction = -particle.direction;
        }

        // Fall with gravity when not in water
        if (!inWater) {
            if (this.isPassable(x, y + 1)) {
                particle.fallDistance++;
                this.swapParticles(x, y, x, y + 1);
            } else if (particle.fallDistance > 0) {
                if (this.checkFallDamage(x, y, particle, true)) return;
            }
        }
    }

    // Bird: flies around, avoids obstacles
    updateBird(x, y, particle) {
        if (particle.actionCooldown > 0) particle.actionCooldown--;

        // Birds prefer to fly
        const shouldFly = Math.random() < 0.8;

        if (particle.actionCooldown === 0) {
            const dir = particle.direction;

            if (shouldFly) {
                // Try to fly up or forward-up
                const flyDirs = [
                    [x, y - 1],
                    [x + dir, y - 1],
                    [x + dir, y],
                    [x - dir, y - 1]
                ];

                for (const [nx, ny] of flyDirs) {
                    if (this.isPassable(nx, ny)) {
                        this.swapParticles(x, y, nx, ny);
                        particle.actionCooldown = 2 + Math.floor(Math.random() * 2);
                        particle.fallDistance = 0;
                        break;
                    }
                }
            } else {
                // Occasionally glide down
                if (this.isPassable(x + dir, y + 1)) {
                    this.swapParticles(x, y, x + dir, y + 1);
                    particle.fallDistance++;
                    particle.actionCooldown = 3;
                }
            }

            // Change direction randomly
            if (Math.random() < 0.08) particle.direction = -particle.direction;
        }

        // Light gravity when not actively flying
        if (particle.actionCooldown > 1 && Math.random() < 0.3) {
            if (this.isPassable(x, y + 1)) {
                particle.fallDistance++;
                this.swapParticles(x, y, x, y + 1);

                // Check fall damage if hits ground
                const below = this.getParticle(x, y + 1);
                if (below && this.isSolidGround(x, y + 1)) {
                    if (this.checkFallDamage(x, y, particle, true)) return;
                }
            }
        }
    }

    // Frog: hops around, eats ants
    updateFrog(x, y, particle) {
        if (particle.actionCooldown > 0) particle.actionCooldown--;

        const below = this.getParticle(x, y + 1);
        const onGround = below && this.isSolidGround(x, y + 1);

        // Apply gravity
        if (!onGround && this.isPassable(x, y + 1)) {
            particle.fallDistance++;
            this.swapParticles(x, y, x, y + 1);
            return;
        }

        // Check fall damage when landing
        if (onGround && particle.fallDistance > 0) {
            if (this.checkFallDamage(x, y, particle, true)) return;
        }

        // Look for ants nearby and eat them
        const searchRadius = 3;
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                const neighbor = this.getParticle(x + dx, y + dy);
                if (neighbor && neighbor.type === MaterialType.ANT) {
                    // Eat the ant!
                    this.removeParticle(x + dx, y + dy);
                    particle.direction = dx > 0 ? 1 : -1;
                    break;
                }
            }
        }

        // Hop when on ground
        if (onGround && particle.actionCooldown === 0 && Math.random() < 0.1) {
            const dir = particle.direction;
            const hopHeight = 2 + Math.floor(Math.random() * 2);
            const hopDist = 1 + Math.floor(Math.random() * 2);

            // Try to hop
            let canHop = true;
            for (let i = 1; i <= hopHeight; i++) {
                if (!this.isPassable(x, y - i)) {
                    canHop = false;
                    break;
                }
            }

            if (canHop && this.isPassable(x + dir * hopDist, y - hopHeight)) {
                this.swapParticles(x, y, x + dir * hopDist, y - hopHeight);
                particle.actionCooldown = 15 + Math.floor(Math.random() * 10);
            }

            if (Math.random() < 0.1) particle.direction = -particle.direction;
        }
    }

    // Worm: burrows through sand and soft materials
    updateWorm(x, y, particle) {
        if (particle.actionCooldown > 0) particle.actionCooldown--;

        const below = this.getParticle(x, y + 1);
        const onGround = below !== null;

        // Worms burrow through sand
        const canBurrowInto = (px, py) => {
            const p = this.getParticle(px, py);
            return p && p.type === MaterialType.SAND;
        };

        // Apply gravity when in open air
        if (!onGround) {
            particle.fallDistance++;
            if (this.isPassable(x, y + 1)) {
                this.swapParticles(x, y, x, y + 1);
                return;
            }
        }

        // Check fall damage when landing
        if (onGround && particle.fallDistance > 0) {
            if (this.checkFallDamage(x, y, particle, true)) return;
        }

        // Burrowing behavior
        if (particle.actionCooldown === 0) {
            const dir = particle.direction;

            // Prefer to burrow down or sideways through sand
            const burrowDirs = [
                [x, y + 1],
                [x + dir, y + 1],
                [x + dir, y],
                [x, y - 1]
            ];

            let moved = false;
            for (const [nx, ny] of burrowDirs) {
                if (canBurrowInto(nx, ny)) {
                    // Swap with sand (burrow through)
                    this.swapParticles(x, y, nx, ny);
                    particle.actionCooldown = 4;
                    moved = true;
                    break;
                } else if (this.isPassable(nx, ny)) {
                    this.swapParticles(x, y, nx, ny);
                    particle.actionCooldown = 3;
                    moved = true;
                    break;
                }
            }

            if (!moved && Math.random() < 0.1) {
                particle.direction = -particle.direction;
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
