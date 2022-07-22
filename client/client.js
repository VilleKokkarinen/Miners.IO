//// <reference path="../phaser.d.ts" />

import Phaser, { Game } from 'phaser'
import BootScene from './scenes/bootScene.js'
import GameScene from './scenes/gameScene.js'
import ScoreBoardScene from './scenes/scoreBoardScene.js'

const config = {
  type: Phaser.Auto,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080
  },
  fps: 60,
  pixelArt: true,
  antialias: false,
  scene: [BootScene, GameScene,ScoreBoardScene]
}

window.addEventListener('load', () => {
  const game = new Game(config)
})
