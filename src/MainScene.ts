import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  constructor(){ super('Main'); }
  create(){
    this.cameras.main.setZoom(3);
    this.cameras.main.setRoundPixels(true);
    this.game.canvas.style.imageRendering = 'pixelated';
    // no auto-spawn here; clean slate
  }
}
