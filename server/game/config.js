import '@geckos.io/phaser-on-nodejs'

import Phaser from 'phaser'
import { GameScene } from './gameScene.js'

export const config = {
  type: Phaser.HEADLESS,
  parent: 'phaser-game',
  width: 1920,
  height: 1080,
  banner: false,
  audio: false,
  phaserOnNodeFPS:30,
  scene: [GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
    }
  }
}
