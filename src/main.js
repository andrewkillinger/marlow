import { SUBSTEPS } from './sim/materials.js';
import { substep } from './sim/physicsRules.js';

const __BUILD_HASH__ = new URL(import.meta.url).searchParams.get('v') || Date.now().toString();
console.log('BUILD', __BUILD_HASH__);
console.log('Phaser.VERSION', Phaser.VERSION);
console.log('navigator.userAgent', navigator.userAgent);
console.log('devicePixelRatio', window.devicePixelRatio);
console.log('bundle', import.meta.url);

const dummyGrid = { width:0, height:0, get(){return null;}, set(){}, swap(){}, inBounds(){return false;} };

class SandboxScene extends Phaser.Scene {
  constructor() {
    super('sandbox');
    this.mode = 'place';
    this.currentType = 'sand';
    this.cellSize = 8;
  }

  preload() {
    this.createTextures();
  }

  createTextures() {
    const colors = {
      sand: 0xcccc00,
      water: 0x0000ff,
      seed: 0x00ff00,
      dynamite: 0xff0000,
      ball: 0xffffff,
      lava: 0xff8800,
      soil: 0x8b4513,
      bot: 0x00ffff,
      spring: 0xff00ff,
      magnet: 0xaaaaaa
    };
    const size = 8;
    const gfx = this.add.graphics();
    for (const key in colors) {
      gfx.clear();
      gfx.fillStyle(colors[key], 1);
      gfx.fillRect(0, 0, size, size);
      gfx.generateTexture(key, size, size);
    }
    gfx.destroy();
  }

  create() {
    this.objects = this.physics.add.group();

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    this.cameras.main.setZoom(DPR);
    this.game.canvas.style.imageRendering = 'pixelated';
    this.input.addPointer(2);
    this.input.mouse?.disableContextMenu();
    this.add.text(4,4,`v:${__BUILD_HASH__}`,{fontFamily:'monospace',fontSize:12,color:'#fff'}).setScrollFactor(0);

    // day/night cycle setup
    this.cycleDuration = 300000; // 5 minutes
    this.cycleStart = this.time.now;
    const w = this.game.config.width;
    const h = this.game.config.height;
    this.background = this.add.graphics().setDepth(-2);
    this.sun = this.add.circle(0, 0, 20, 0xffff00).setDepth(-1);
    this.moon = this.add.circle(0, 0, 15, 0xffffff).setDepth(-1);
    this.drawSky(0);

    // simulation grid
    this.gridWidth = Math.floor(w / this.cellSize);
    this.gridHeight = Math.floor(h / this.cellSize);
    this.grid = Array.from({ length: this.gridHeight }, () => Array(this.gridWidth).fill(null));

    // starting environment ground
    this.ground = this.physics.add.staticGroup();
    for (let x = 0; x < w; x += this.cellSize) {
      this.ground.create(x, h, 'sand').setOrigin(0, 1).refreshBody();
    }
    for (let gx = 0; gx < this.gridWidth; gx++) {
      this.grid[this.gridHeight - 1][gx] = { type: 'solid' };
    }

    this.physics.add.collider(this.objects, this.ground);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.placing = false;
    this.lastPlace = 0;
    this.pointer = null;
    this.input.on('pointerdown', pointer => {
      if (this.mode === 'place') {
        this.placing = true;
        this.pointer = pointer;
        this.placeObject(pointer.x, pointer.y);
        this.lastPlace = pointer.time;
      }
    });
    this.input.on('pointermove', pointer => {
      if (this.mode === 'place' && this.placing) {
        this.pointer = pointer;
      }
    });
    this.input.on('pointerup', () => {
      this.placing = false;
      this.pointer = null;
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

  }

  placeObject(x, y) {
    if (this.currentType === 'sand' || this.currentType === 'water') {
      const gx = Math.floor(x / this.cellSize);
      const gy = Math.floor(y / this.cellSize);
      if (this.isInside(gx, gy) && this.isEmpty(gx, gy)) {
        const sprite = this.add.image(gx * this.cellSize, gy * this.cellSize, this.currentType).setOrigin(0);
        this.grid[gy][gx] = { sprite, type: this.currentType };
      }
      return;
    }

    const obj = this.objects.create(x, y, this.currentType);
    obj.setInteractive();
    obj.body.setBounce(0.2);
    obj.body.setCollideWorldBounds(true);

    if (this.currentType === 'dynamite') {
      this.time.delayedCall(2000, () => {
        const blast = this.add.circle(obj.x, obj.y, 40, 0xff0000, 0.5);
        this.physics.world.overlap(this.objects, blast, o => o.destroy());
        obj.destroy();
        this.time.delayedCall(200, () => blast.destroy());
      });
    } else if (this.currentType === 'seed') {
      this.time.delayedCall(5000, () => {
        const tree = this.add.rectangle(obj.x, obj.y, 10, 40, 0x00ff00);
        this.physics.world.disable(tree);
        obj.destroy();
      });
    }
  }

  stepSimulation() {
    for (let y = this.gridHeight - 2; y >= 0; y--) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        if (!cell) continue;
        if (cell.type === 'sand') {
          this.updateSand(x, y);
        } else if (cell.type === 'water') {
          this.updateWater(x, y);
        }
      }
    }
  }

  updateSand(x, y) {
    if (this.isEmpty(x, y + 1)) {
      this.moveCell(x, y, x, y + 1);
      return;
    }
    const left = this.isEmpty(x - 1, y + 1);
    const right = this.isEmpty(x + 1, y + 1);
    if (left && right) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      this.moveCell(x, y, x + dir, y + 1);
    } else if (left) {
      this.moveCell(x, y, x - 1, y + 1);
    } else if (right) {
      this.moveCell(x, y, x + 1, y + 1);
    }
  }

  updateWater(x, y) {
    if (this.isEmpty(x, y + 1)) {
      this.moveCell(x, y, x, y + 1);
      return;
    }
    const dirs = Phaser.Utils.Array.Shuffle([-1, 1]);
    for (const dir of dirs) {
      if (this.isEmpty(x + dir, y + 1)) {
        this.moveCell(x, y, x + dir, y + 1);
        return;
      }
    }
    for (const dir of dirs) {
      if (this.isEmpty(x + dir, y)) {
        this.moveCell(x, y, x + dir, y);
        return;
      }
    }
  }

  moveCell(x1, y1, x2, y2) {
    if (!this.isInside(x2, y2)) return;
    const cell = this.grid[y1][x1];
    this.grid[y1][x1] = null;
    this.grid[y2][x2] = cell;
    cell.sprite.setPosition(x2 * this.cellSize, y2 * this.cellSize);
  }

  isInside(x, y) {
    return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight;
  }

  isEmpty(x, y) {
    return this.isInside(x, y) && !this.grid[y][x];
  }

  drawSky(progress) {
    const dayTop = { r: 135, g: 206, b: 235 };
    const dayBottom = { r: 255, g: 223, b: 186 };
    const nightTop = { r: 0, g: 0, b: 32 };
    const nightBottom = { r: 0, g: 0, b: 64 };
    const t = progress < 0.5 ? progress * 2 : (progress - 0.5) * 2;
    const fromTop = progress < 0.5 ? dayTop : nightTop;
    const toTop = progress < 0.5 ? nightTop : dayTop;
    const fromBottom = progress < 0.5 ? dayBottom : nightBottom;
    const toBottom = progress < 0.5 ? nightBottom : dayBottom;
    const top = {
      r: Phaser.Math.Linear(fromTop.r, toTop.r, t),
      g: Phaser.Math.Linear(fromTop.g, toTop.g, t),
      b: Phaser.Math.Linear(fromTop.b, toTop.b, t)
    };
    const bottom = {
      r: Phaser.Math.Linear(fromBottom.r, toBottom.r, t),
      g: Phaser.Math.Linear(fromBottom.g, toBottom.g, t),
      b: Phaser.Math.Linear(fromBottom.b, toBottom.b, t)
    };
    const topColor = Phaser.Display.Color.GetColor(top.r, top.g, top.b);
    const bottomColor = Phaser.Display.Color.GetColor(bottom.r, bottom.g, bottom.b);
    this.background.clear();
    this.background.fillGradientStyle(topColor, topColor, bottomColor, bottomColor);
    this.background.fillRect(0, 0, this.game.config.width, this.game.config.height);
  }

  update(time) {
    if (this.mode === 'interact') {
      this.input.setDraggable(this.objects.getChildren());
    } else {
      this.input.setDraggable([]);
      if (this.placing && this.pointer && time - this.lastPlace > 50) {
        this.placeObject(this.pointer.x, this.pointer.y);
        this.lastPlace = time;
      }
    }

    // day/night cycle animation
    const progress = ((time - this.cycleStart) % this.cycleDuration) / this.cycleDuration;
    this.drawSky(progress);
    const angle = progress * Math.PI * 2;
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height * 0.8;
    const radius = this.game.config.width / 2;

    this.sun.x = centerX + radius * Math.cos(angle);
    this.sun.y = centerY + radius * Math.sin(angle);
    this.moon.x = centerX + radius * Math.cos(angle + Math.PI);
    this.moon.y = centerY + radius * Math.sin(angle + Math.PI);

    this.sun.setVisible(this.sun.y < centerY);
    this.moon.setVisible(this.moon.y < centerY);

    for (let i = 0; i < 2; i++) {
      this.stepSimulation();
    }

    const dt = Math.min(1/60, this.game.loop.delta / 1000);
    const step = dt / SUBSTEPS;
    for (let i=0; i<SUBSTEPS; i++) substep(dummyGrid, step);
  }
}
const config = {
  type: Phaser.AUTO,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#0f1220',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game',
    width: 360,
    height: 640
  },
  render: { antialias: false, mipmapFilter: 'NEAREST' },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 300 }, debug: false }
  },
  scene: [SandboxScene]
};

const game = new Phaser.Game(config);

// UI handlers
const modeToggle = document.getElementById('modeToggle');
const objectButtons = document.querySelectorAll('#objectMenu button');
const materialButtons = document.querySelectorAll('#materialMenu button');
const allButtons = [...objectButtons, ...materialButtons];
let activeButton = allButtons[0];
activeButton.classList.add('active');

modeToggle.addEventListener('pointerdown', () => {
  const scene = game.scene.keys['sandbox'];
  if (scene.mode === 'place') {
    scene.mode = 'interact';
    modeToggle.textContent = 'Interact';
    modeToggle.classList.remove('active');
    allButtons.forEach(b => b.disabled = true);
  } else {
    scene.mode = 'place';
    modeToggle.textContent = 'Place';
    modeToggle.classList.add('active');
    allButtons.forEach(b => b.disabled = false);
    scene.currentType = activeButton.dataset.type;
  }
});

allButtons.forEach(btn => {
  btn.addEventListener('pointerdown', () => {
    allButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeButton = btn;
    const scene = game.scene.keys['sandbox'];
    scene.currentType = btn.dataset.type;
  });
});

document.getElementById('menu').addEventListener('pointerdown', e => e.stopPropagation());
