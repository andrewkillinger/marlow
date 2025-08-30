import Phaser from 'phaser';

const WORLD_WIDTH = 480;
const WORLD_HEIGHT = 320;

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('Main');
  }

  create() {
    const cam = this.cameras.main;
    cam.setZoom(3);
    cam.setRoundPixels(true);
    cam.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.game.canvas.style.imageRendering = 'pixelated';
  }
}
