class SandboxScene extends Phaser.Scene {
  constructor() {
    super('sandbox');
    this.mode = 'interact';
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

    this.input.on('pointerdown', pointer => {
      if (this.mode === 'place') {
        this.placeObject(pointer.x, pointer.y);
      }
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

  update() {
    if (this.mode === 'interact') {
      this.input.setDraggable(this.objects.getChildren());
      this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
      });
    } else {
      this.input.setDraggable([]);
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 375,
  height: 667,
  backgroundColor: '#000',
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
const modeToggle = document.getElementById('modeToggle');
const placeMenu = document.getElementById('placeMenu');
modeToggle.addEventListener('click', () => {
  const scene = game.scene.keys['sandbox'];
  if (scene.mode === 'interact') {
    scene.mode = 'place';
    placeMenu.style.display = 'block';
    modeToggle.textContent = 'Place';
  } else {
    scene.mode = 'interact';
    placeMenu.style.display = 'none';
    modeToggle.textContent = 'Interact';
  }
});

document.querySelectorAll('#placeMenu button').forEach(btn => {
  btn.addEventListener('click', () => {
    const scene = game.scene.keys['sandbox'];
    scene.currentType = btn.dataset.type;
  });
});
