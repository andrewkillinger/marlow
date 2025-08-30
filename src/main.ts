import Phaser from 'phaser';
import MainScene from './MainScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 480,
  height: 320,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scene: [MainScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
});
