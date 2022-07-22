import { Scene } from 'phaser'
import axios from 'axios'
import Player from '../components/player.js'
import Controls from '../components/controls.js'
import { FkDestructibleObject } from '../../shared/destructibleobject.js'
import { FkDstrGridData } from '../../shared/fkdstrgriddata.js'
import eventsCenter from '../components/eventcenter.js'
import {world} from '../../shared/world.js'
import * as _ from "lodash-es"

export default class GameScene extends Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.objects = {}
    this.playerId,
    this.ground = [];
    this.worldUpdateCache = [];
    this.worldUpdateTicker = 0;
    this.chunkSize = world.getChunkSize();
    this.worldSize = world.getWorldSize();
    this.controls = null;
    this.counter = 0;
  }

  init({ channel }) {
    this.channel = channel
  }

  preload() {
    this.load.image("bg", "./assets/bg.png");
    this.load.image("player", "./assets/player.png");
   
    this.load.image("gold", "./assets/gold.png");
    this.load.image("dirt", "./assets/dirt.png");
    for(var i = 0; i < 5; i ++)
    {
      //this.load.image("dirt"+i, "./assets/dirt"+i+".png");
    }
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
    for(var x = 0; x < this.worldSize.width; x ++){
      for(var y = 0; y < this.worldSize.height; y ++){

        var color1 = new FkDestructibleObject(this, x*this.chunkSize,y*this.chunkSize,this.chunkSize,this.chunkSize,"dirt",0,7)
      
        this.ground.push(color1)
      }
    }

    this.background = this.add.tileSprite(1920/2,1080/2,1920,1080,'bg').setDepth(-1).setOrigin(0.5,0.5);
    this.controls = new Controls(this, this.channel)

    this.waitFor(()=> this.objects[this.playerId] != null, () => {
      this.cameras.main.setZoom(1);
      this.cameras.main.startFollow(this.objects[this.playerId].sprite);
    })

    const initWorld = world => {
      for(var i = 0; i < this.ground.length; i ++){
        this.ground[i].dataBody = this.ground[i].dataBody.updateWithQuadTree22( world[i].dataBody);
       
      }
      this.ground[0].drawDstrObject();
      console.log(this.ground)
    }

    const playerUpdateHandler = updates => {
      updates.forEach(gameObject => {
        const { playerId, x, y, scale, mass, health, playermassrequiredtogrow, playersize, zoom, dead } = gameObject

        const alpha = dead ? 0 : 1

     

        if (Object.keys(this.objects).includes(playerId)) {
          // if the gameObject does already exist,
          // update the gameObject
          let sprite = this.objects[playerId].sprite
          sprite.setAlpha(alpha)
          sprite.setPosition(x, y)
          sprite.setDisplaySize(playersize, playersize)

          var cacheUpdate = {x,y,playersize}
          if(!_.some(this.worldUpdateCache, v => _.isEqual(v, cacheUpdate)))
          this.worldUpdateCache.push(cacheUpdate);

          if(playerId == this.playerId){
            this.controls.setCoords(x,y);
            this.controls.zoomTo(zoom);
            this.background.setScale(1+(scale*0.1))
            this.background.setX(x)
            this.background.setY(y)
            eventsCenter.emit("updateMass", mass);
            eventsCenter.emit("updateHealth", health);
          }


          //this.objects[playerId].setVelocity(dx, dy)
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
    var worldUpdates = [];
    
    var stateHide = FkDstrGridData.getStateHide();
    var stateVisible = FkDstrGridData.getStateVisible();

    updates.forEach(gameObject => {
      const { x, y, playersize} = gameObject
      worldUpdates.push({x,y,playersize})
    });

    // go through and merge rectangles together for optimization

    this.ground.forEach(layer => {
      var layerGotUpdates = false;
      worldUpdates.forEach(upd => {

        var playerRectangle = new Phaser.Geom.Rectangle(upd.x-upd.playersize/2,upd.y-upd.playersize/2,upd.playersize,upd.playersize);
        
        var collision = FkDestructibleObject.CollideWithRectangle(layer, playerRectangle, stateVisible)
          
        if(collision){
          //console.log("Colliding!, update")
          layer.modifyByRectangle(playerRectangle, stateHide, false);
          layerGotUpdates = true;
        }
        /*
        if(layer.dataBody.RectangleToRectangle(layer.dataRect,playerRectangle)){
          //console.log("PLAYER", playerRectangle, stateVisible)
        
          else{
            //console.log(layer.dataPos, layer.dataRect, playerRectangle)
          }
       
        }
        */
      })

    if(layerGotUpdates)
    layer.drawDstrObject();
    })
  }

  update(time, delta){
    this.worldUpdateTicker += delta;

    if(this.worldUpdateCache.length >= 2 && this.worldUpdateTicker >= (1000/10)){
      this.updateWorld(this.worldUpdateCache)
      this.worldUpdateCache = [];
      this.worldUpdateTicker = 0;
    }
 
  }
}
