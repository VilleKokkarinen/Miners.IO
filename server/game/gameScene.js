import geckos from '@geckos.io/server'
import { iceServers } from '@geckos.io/server'
import { FkDestructibleObject } from '../../shared/destructibleobject.js'
import { FkDstrGridData } from '../../shared/fkdstrgriddata.js'
import { Guid } from '../../shared/Guid.js'
import pkg from 'phaser'
const { Scene } = pkg

import { Player } from './components/player.js'
import {world} from '../../shared/world.js'

export class GameScene extends Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.playerId = Guid.newGuid();
    this.ground = [];
    this.chunkSize = world.getChunkSize();
    this.worldSize = world.getWorldSize();
  }

  init() {
    this.io = geckos({
      iceServers: process.env.NODE_ENV === 'production' ? iceServers : [],
      maxMessageSize:1024*1024*5*8 // 5 mb
    })
    this.io.addServer(this.game.server)
  }

  getId() {
    return Guid.newGuid();
  }

  prepareToSync(player) {
    return {
      playerId: player.playerId,
      x: player.x,
      y: player.y,
      scale: player.scale,
      mass: player.mass,
      health: player.health,
      playermassrequiredtogrow: player.playermassrequiredtogrow,
      playersize: player.playersize,
      zoom: player.zoom,
      dead: player.dead === true ? 1 : 0
    }
  }

  getState() {
    let state = []
    this.playersGroup.children.iterate(player => {
      state.push(this.prepareToSync(player))
    })
    return state
  }
  getWorld(){
    return this.ground;
  }

  create() {
    this.playersGroup = this.add.group()

    this.physics.world.setBounds(0,0, this.chunkSize*this.worldSize.width, this.chunkSize*this.worldSize.height);
  
    var stateHide = FkDstrGridData.getStateHide();
    var stateVisible = FkDstrGridData.getStateVisible();

    for(var x = 0; x < this.worldSize.width; x ++){
      for(var y = 0; y < this.worldSize.height; y ++){
        var Base1 = new FkDestructibleObject(this, x*this.chunkSize,y*this.chunkSize,this.chunkSize,this.chunkSize,"dirt",0,7)
       
        this.ground.push(Base1);
      }
    }

    this.io.onConnection(channel => {
      channel.onDisconnect(() => {
        console.log('Disconnect user ' + channel.id)
        this.playersGroup.children.each(player => {
          if (player.playerId === channel.playerId) {
            player.kill()
          }
        })
        channel.room.emit('removePlayer', channel.playerId)
      })

      
      channel.on('getId', () => {
        channel.playerId = this.getId()
        channel.emit('getId', channel.playerId)
      })

      channel.on('playerMove', data => {
        this.playersGroup.children.iterate(player => {
          if (player.playerId === channel.playerId) {
            player.setMove(data)
          }
        })
      })

      channel.on('addPlayer', data => {
        let dead = this.playersGroup.getFirstDead()
        if (dead) {
          dead.revive(channel.playerId, false)
        } else {
          var x = Phaser.Math.RND.integerInRange(64, this.chunkSize-64);
          var y = Phaser.Math.RND.integerInRange(64, this.chunkSize-64);
          var player = new Player(this, channel.playerId, x,y);
          player.setVelocity(0.000001,0.00001);

          this.playersGroup.add(player)
        }
      })

      channel.emit('ready')
    })
  }

  UpdateArea(layer, area, newState){

    var result = 0;
    if(this.ground == null || this.ground.length == 0)
      return 0
    else
    {
      var before = this.ground[layer].area(function(data1) { 
        return !data1.dataIsVisible;
      })
      this.ground[layer].modifyByRectangle(area,newState,false);
      var after = this.ground[layer].area(function(data1 ) { 
        return !data1.dataIsVisible;
      })
      result = after - before;
      return result;
    } 
  }

  update() {
    let updates = [];
    this.playersGroup.children.iterate(player => {

      let deadUpdated = player.dead != player.prevDead
      let xUpdated = player.body.velocity.x != 0 ? true : false
      let yUpdated = player.body.velocity.y != 0 ? true : false
      
      if (xUpdated || yUpdated || deadUpdated) {
        if (deadUpdated || !player.dead) {

          var playerRectangle = new Phaser.Geom.Rectangle(player.x-player.body.width/2, player.y-player.body.width/2, player.body.width, player.body.width);
          var i = 0;
          this.ground.forEach(layer => {
            var collide = layer.dataBody.RectangleToRectangle(layer.dataRect,playerRectangle)
           

            if(collide){
              var Statehide = FkDstrGridData.getStateHide();
              var area = this.UpdateArea(i,playerRectangle,Statehide )
            
              area = area * 4 * this.chunkSize;
              if(area > 0){
                player.MineMaterial(area, this.ground[i].dataRenderTexture)
              }
            }
            i++;
          })

          updates.push(this.prepareToSync(player))
        }
      }
      player.postUpdate()
    })

   
    if (updates.length > 0) {
      //console.log(updates)    
      this.io.room().emit('updatePlayers', updates)
    }    
    
  }
}
