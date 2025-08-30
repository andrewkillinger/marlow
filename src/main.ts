import Phaser from 'phaser';
import Game from './scenes/Game';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0f1220',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 360,
    height: 640,
  },
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  render: { pixelArt: true, antialias: false, mipmapFilter: 'NEAREST', powerPreference: 'high-performance' },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 300 }, debug: false },
  },
  scene: [Game],
};

new Phaser.Game(config);
