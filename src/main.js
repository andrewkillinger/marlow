class SandboxScene extends Phaser.Scene {
  constructor() {
    super('sandbox');
    this.mode = 'place';
    this.currentType = 'sand';
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

    // day/night cycle setup
    this.cycleDuration = 300000; // 5 minutes
    this.cycleStart = this.time.now;
    const w = this.game.config.width;
    const h = this.game.config.height;
    this.sun = this.add.circle(0, 0, 20, 0xffff00).setDepth(-1);
    this.moon = this.add.circle(0, 0, 15, 0xffffff).setDepth(-1);

    // starting environment ground
    this.ground = this.physics.add.staticGroup();
    for (let x = 0; x < w; x += 8) {
      this.ground.create(x, h, 'soil').setOrigin(0, 1).refreshBody();
    }
    this.physics.add.collider(this.objects, this.ground);
    this.physics.world.setBoundsCollision(true, true, true, false);

    this.input.on('pointerdown', pointer => {
      if (this.mode === 'place') {
        this.placeObject(pointer.x, pointer.y);
      }
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    // automated bots
    this.time.addEvent({ delay: 2000, callback: () => this.spawnBot(), loop: true });
  }

  placeObject(x, y) {
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

  spawnBot() {
    if (this.objects.countActive() > 20) return;
    const bot = this.objects.create(Phaser.Math.Between(0, this.game.config.width), 0, 'bot');
    bot.body.setVelocity(Phaser.Math.Between(-50, 50), 20);
    bot.body.setCollideWorldBounds(true);
    bot.body.setBounce(1);
  }

  update(time) {
    if (this.mode === 'interact') {
      this.input.setDraggable(this.objects.getChildren());
    } else {
      this.input.setDraggable([]);
    }

    // day/night cycle animation
    const progress = ((time - this.cycleStart) % this.cycleDuration) / this.cycleDuration;
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

    const day = { r: 135, g: 206, b: 235 };
    const night = { r: 0, g: 16, b: 51 };
    const t = progress < 0.5 ? progress * 2 : (progress - 0.5) * 2;
    const from = progress < 0.5 ? day : night;
    const to = progress < 0.5 ? night : day;
    const r = Phaser.Math.Linear(from.r, to.r, t);
    const g = Phaser.Math.Linear(from.g, to.g, t);
    const b = Phaser.Math.Linear(from.b, to.b, t);
    this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(r, g, b));
  }
}

const config = {
  type: Phaser.AUTO,
  width: 375,
  height: 667,
  backgroundColor: '#87ceeb',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [SandboxScene]
};

const game = new Phaser.Game(config);

// UI handlers
const placeMenu = document.getElementById('placeMenu');
const modeButtons = document.querySelectorAll('#modeMenu button');
modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const scene = game.scene.keys['sandbox'];
    modeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (btn.dataset.mode === 'place') {
      scene.mode = 'place';
      placeMenu.style.display = 'flex';
      const active = placeMenu.querySelector('button.active') || placeMenu.querySelector('button');
      scene.currentType = active.dataset.type;
    } else {
      scene.mode = 'interact';
      placeMenu.style.display = 'none';
    }
  });
});

const materialButtons = document.querySelectorAll('#placeMenu button');
materialButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    materialButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const scene = game.scene.keys['sandbox'];
    scene.currentType = btn.dataset.type;
  });
});
materialButtons[0].classList.add('active');

document.getElementById('menu').addEventListener('pointerdown', e => e.stopPropagation());
