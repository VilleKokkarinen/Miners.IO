import { Scene } from 'phaser'
import axios from 'axios'
import Player from '../components/player.js'
import Controls from '../components/controls.js'
import eventsCenter from '../components/eventcenter.js'
import {world} from '../../shared/world.js'
import * as _ from "lodash-es"

export default class GameScene extends Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.objects = {}
    this.playerId,
    this.ground = [];
    this.groundTiles = [];
    this.worldUpdateCache = [];
    this.worldUpdateTicker = 0;
    this.chunkSize = world.getChunkSize();
    this.worldSize = world.getWorldSize();
    this.controls = null;
    this.counter = 0;
    this.backgrounds = [];
  }

  init({ channel }) {
    this.channel = channel
  }

  preload() {
    this.load.image("bg", "./assets/bg.png");
    this.load.image("player", "./assets/player.png");

    this.load.image('base_tiles', 'assets/tileSet-extruded.png')
  }

     
  waitFor(condition, callback) {
    if(!condition()) {
      setTimeout(()=>{
        this.waitFor(condition, callback);
      }, 25)
    } else {
        callback();
      }
  }

  async create() {

    this.controls = new Controls(this, this.channel)
    
    var colors = [
      [0x836243,0x33261a],
      [0x33261a,0x852727],
      [0x852727,0x331a1a],
      [0x331a1a,0x2b3793],
      [0x2b3793,0x0d1232],
      [0x0d1232,0x28884c],
      [0x28884c,0x0f331d],
      [0x0f331d,0x823399],
      [0x823399,0x401a4b],
      [0x401a4b,0x000b8f]
    ]

    var SkyBox = this.add.graphics().setDepth(-1);
    SkyBox.fillGradientStyle(0x80acf2,0x80acf2,0x4287f5,0x4287f5, 1);
    SkyBox.fillRect(0,-2048,this.chunkSize,this.chunkSize);



    for(var x = 0; x < this.worldSize.width; x ++){
      for(var y = 0; y < this.worldSize.height; y ++){

        var texturename = "";

        if(y <= 5){
          texturename = "dirt"+y
        }
        var bgrect = this.add.graphics().setDepth(-1);

        bgrect.fillGradientStyle(colors[y][0],colors[y][0],colors[y][1],colors[y][1], 1);
        bgrect.fillRect(x*this.chunkSize,y*this.chunkSize,this.chunkSize,this.chunkSize);

        this.backgrounds.push(bgrect)

      }
    }


    this.waitFor(()=> this.objects[this.playerId] != null, () => {
      this.cameras.main.setZoom(1);
      this.cameras.main.startFollow(this.objects[this.playerId].sprite);
    })

    const initWorld = world => {
      var result = [0][0];

      result = world;

      //console.log(result[0][0])

      this.map = this.make.tilemap({ data: result, tileWidth: 64, tileHeight: 64, })
      this.tileset = this.map.addTilesetImage('base_tiles', 'base_tiles', 64,64,1,2)
      this.layer = this.map.createLayer(0,this.tileset,0,0)

    }

    const playerUpdateHandler = updates => {
      updates.forEach(gameObject => {
        const { playerId, x, y, scale, mass, health, playermassrequiredtogrow, playersize, zoom, dead, fuel, fuelMax } = gameObject

        const alpha = dead ? 0 : 1
     

        if (Object.keys(this.objects).includes(playerId)) {
          // if the gameObject does already exist,
          // update the gameObject
          let sprite = this.objects[playerId].sprite
          sprite.setAlpha(alpha)
          sprite.setPosition(x, y)
          //sprite.setDisplaySize(playersize, playersize)

          if(playerId == this.playerId){
            this.controls.setCoords(x,y);
            this.controls.zoomTo(zoom);
            eventsCenter.emit("updateMass", mass);
            eventsCenter.emit("updateHealth", health);
            eventsCenter.emit("updateFuel", {fuel, fuelMax});
          }
        } else {
          // if the gameObject does NOT exist,
          // create a new gameObject
          let newGameObject = {
            sprite: new Player(this, playerId, x || 64, y || 64),
            playerId: playerId
          }
          newGameObject.sprite.setAlpha(alpha)
          
          if(playerId != this.playerId)
            newGameObject.sprite.setDepth(2)
          else
            newGameObject.sprite.setDepth(3)

          this.objects = { ...this.objects, [playerId]: newGameObject }
        }
      })
    }

    this.channel.on('updatePlayers', updates => {
      playerUpdateHandler(updates)
    })

    this.channel.on('removePlayer', playerId => {
      try {
        this.objects[playerId].sprite.destroy()
        delete this.objects[playerId]
      } catch (error) {
        console.error(error.message)
      }
    })

    this.channel.on('tileMined', tile => {
      console.log(tile)
      this.map.removeTileAt(tile.x, tile.y);
    })

    try {
      let res = await axios.get(`${location.protocol}//${location.hostname}:1444/getState`)

      playerUpdateHandler(res.data.state)

      this.channel.on('getId', playerId => {
        this.playerId = playerId
        this.channel.emit('addPlayer')
      })


    
      this.channel.emit('getId')

      let res2 = await axios.get(`${location.protocol}//${location.hostname}:1444/getWorld`)

      initWorld(res2.data)
     
    } catch (error) {
      console.error(error.message)
    }

    this.scene.run("ScoreBoardScene");
    this.scene.get("ScoreBoardScene").events.on('create', ()=>{eventsCenter.emit("updateName", this.playerId)})
    
 
  }

  updateWorld = updates =>{
  
  }

  update(time, delta){
  
  }
}
