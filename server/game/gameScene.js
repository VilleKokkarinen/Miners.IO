import geckos from '@geckos.io/server'
import { iceServers } from '@geckos.io/server'
import { Guid } from '../../shared/Guid.js'
import pkg from 'phaser'
const { Scene } = pkg

import { Player } from './components/player.js'
import {world} from '../../shared/world.js'
import PNGImage from '../../shared/PNGImage.js';
import * as fs from 'fs';

export class GameScene extends Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.playerId = Guid.newGuid();
    this.ground = [];
    this.groundMapData = [,]
    this.chunkSize = world.getChunkSize();
    this.worldSize = world.getWorldSize();
    this.tiles = world.tiles;
    this.groundTileCount = 8*3;
  }

  init() {
    this.io = geckos({
      iceServers: process.env.NODE_ENV === 'production' ? iceServers : []
    })
    this.io.addServer(this.game.server)
  }

  preload() {
    this.load.image('base_tiles', '../../../../shared/tileSet-extruded.png')
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
      dead: player.dead === true ? 1 : 0,
      fuel:player.fuel,
      fuelMax: player.fuelMax
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

  updateTileConnections(x,y){

  }

  create() {
    var self = this;
    this.playersGroup = this.add.group()

    // top of world is in "negatives" 

    this.physics.world.setBounds(0,-2048, this.chunkSize*this.worldSize.width, this.chunkSize*this.worldSize.height + 2048);
    this.physics.world.gravity.y = 1000;



    this.physics.add.collider(this.playersGroup,this.playersGroup, function(player, other){
      if(player.dead === false && other.dead === false){
      
        var playermass = (player.body.mass);
        var othermass = (other.body.mass);
        
        var dmgPlayer = Math.floor((othermass/playermass)*10)
        var dmgOther = Math.floor((playermass/othermass)*10)

        player.health -= dmgPlayer;
        other.health -= dmgOther;
        
        if(player.health <= 0){
          other.mass += Math.floor(player.mass/4)
          player.kill();
          player.disableBody(true, true);
          self.time.addEvent({
            delay: 1500,
              callback:function() {
                player.revive(player.playerId, Phaser.Math.RND.integerInRange(64, self.chunkSize-64), Phaser.Math.RND.integerInRange(64, -128));
                player.movementEnabled = true;
                player.postUpdate();
                player.enableBody(true, player.x, player.y, true, true);
              }
            });
        }

        if(other.health <= 0){
          player.mass += Math.floor(other.mass/4)
          other.kill();
          other.disableBody(true, true);
          self.time.addEvent({
            delay: 1500,
              callback:function() {
                other.revive(other.playerId,Phaser.Math.RND.integerInRange(64, self.chunkSize-64), Phaser.Math.RND.integerInRange(64, -128));
                other.movementEnabled = true;
                other.postUpdate();
                other.enableBody(true, other.x, other.y, true, true);
              }
            });
        }

      if(player.dead === false && other.dead === false){
        player.movementEnabled = false;
        other.movementEnabled = false;
        
        var otherForceX = (othermass/playermass)*300
        var playerForceX = (playermass/othermass)*300
        var otherForceY = (othermass/playermass)*300
        var playerForceY = (playermass/othermass)*300

        otherForceX = Math.min(5000, otherForceX); // clamp down to 5000 max
        playerForceX = Math.min(5000, playerForceX); 
        otherForceY = Math.min(5000, otherForceY); 
        playerForceY = Math.min(5000, playerForceY); 
        
        player.body.setDamping(true);
        other.body.setDamping(true);

        player.body.setDrag(0.1,0.1)
        other.body.setDrag(0.1,0.1)

        if(player.body.touching.left && other.body.touching.right){

          player.body.setVelocityX(player.prevVelocity.x + otherForceX)
  
          other.body.setVelocityX(other.prevVelocity.x - playerForceX)      
        } 
        else if(player.body.touching.right && other.body.touching.left){
         
          player.body.setVelocityX(player.prevVelocity.x - otherForceX)
  
          other.body.setVelocityX(other.prevVelocity.x + playerForceX)
        } 
        else if (player.body.touching.up && other.body.touching.down){
         
          player.body.setVelocityY(player.prevVelocity.y + otherForceY)
  
          other.body.setVelocityY(other.prevVelocity.y - playerForceY)
        } 
        else if (player.body.touching.down && other.body.touching.up){
  
          player.body.setVelocityY(player.prevVelocity.y - otherForceY)
  
          other.body.setVelocityY(other.prevVelocity.y + playerForceY)
        }

        self.time.addEvent({
          delay: 1000/60*10, // 10 frames of no inputting
            callback:function() {
            player.movementEnabled = true;
            other.movementEnabled = true;
  
              if(player.body.position.x < 0){
                player.body.position.x = 0 + player.playersize/2
              }
  
              if(player.body.position.x > self.worldSize.width*self.chunkSize){
                player.body.position.x = self.worldSize.width*self.chunkSize - player.playersize/2
              }
  
              if(player.body.position.y < 0){
                player.body.position.y = 0 + player.playersize/2
              }
  
              if(player.body.position.y > self.worldSize.height*self.chunkSize ){
                player.body.position.x = self.worldSize.width*self.chunkSize - player.playersize/2
              }
  
  
              if(other.body.position.x < 0){
                other.body.position.x = 0 + other.playersize/2
              }
  
              if(other.body.position.x > self.worldSize.width*self.chunkSize){
                other.body.position.x = self.worldSize.width*self.chunkSize - other.playersize/2
              }
  
              if(other.body.position.y < 0){
                other.body.position.y = 0 + other.playersize/2
              }
  
              if(other.body.position.y > self.worldSize.height*self.chunkSize ){
                other.body.position.x = self.worldSize.width*self.chunkSize - other.playersize/2
              }
  
              player.body.setDrag(0,0)
              other.body.setDrag(0,0)
            },
            callbackScope: this,
            loop: false
          });
      }

      
      }
      else{
        // one of them is dead so do something?
      }
    })
      

    var tilestypes = [
      "#ffffff",  //air
      "#87600c",  //dirt
      "#6e6759",  //stone
      "#4a463d",  //obsidian
      "cc802f",   //copper
      "adaba8",   //tin
      "#757575",  //silver
      "#ffe600",  //gold
      "#9dced1",  //diamond
      "#00ff00",  //emerald
      "#ff0000",  //ruby
      "#3b3b27",  //loparite
      "#f700ff",  //treasure1
      "#c802cf",  //treasure2
      "#f5384b",  //lava
      "#830087"   //exploding // can be anything,
    ]
    var tilechances = [
      [
        700,  //air
        1000,  //dirt,
        0,  //stone
        0,  //obsidian
        20, //copper
        10, //tin
        10, //silver
        0,  //gold
        0,  //diamond
        0,  //emerald
        0,  //ruby
        0,  //loparite
        0,  //treasure1
        0,  //treasure2
        0,  //lava
        0,  //exploding // can be anything
      ],
      [
        400,  //air
        500,  //dirt,
        0,  //stone
        0,  //obsidian
        200, //copper
        200, //tin
        100, //silver
        25,  //gold
        0,  //diamond
        0,  //emerald
        0,  //ruby
        0,  //loparite
        1,  //treasure1
        1,  //treasure2
        0,  //lava
        0,  //exploding // can be anything
      ],
      [
        200,  //air
        500,  //dirt,
        100,  //stone
        50,  //obsidian
        50, //copper
        50, //tin
        250, //silver
        100,  //gold
        5,  //diamond
        1,  //emerald
        0,  //ruby
        0,  //loparite
        1,  //treasure1
        1,  //treasure2
        1,  //lava
        0,  //exploding // can be anything
      ],
      [
        75,  //air
        100,  //dirt,
        500,  //stone
        250,  //obsidian
        25, //copper
        25, //tin
        150, //silver
        150,  //gold
        25,  //diamond
        5,  //emerald
        1,  //ruby
        0,  //loparite
        0,  //treasure1
        0,  //treasure2
        20,  //lava
        1,  //exploding // can be anything
      ],
      [
        25,  //air
        25,  //dirt,
        500,  //stone
        350,  //obsidian
        0, //copper
        0, //tin
        10, //silver
        25,  //gold
        50,  //diamond
        10,  //emerald
        5,  //ruby
        1,  //loparite
        0,  //treasure1
        0,  //treasure2
        50,  //lava
        25,  //exploding // can be anything
      ],
      [
        25,  //air
        25,  //dirt,
        400,  //stone
        350,  //obsidian
        0, //copper
        0, //tin
        0, //silver
        0,  //gold
        20,  //diamond
        5,  //emerald
        5,  //ruby
        2,  //loparite
        0,  //treasure1
        0,  //treasure2
        150,  //lava
        50,  //exploding // can be anything
      ],
      [
        0,  //air
        0,  //dirt,
        100,  //stone
        350,  //obsidian
        0, //copper
        0, //tin
        0, //silver
        0,  //gold
        5,  //diamond
        5,  //emerald
        5,  //ruby
        2,  //loparite
        0,  //treasure1
        0,  //treasure2
        700,  //lava
        250,  //exploding // can be anything
      ]
  ]
   
    
    var arrayShuffle = function(array) {
      for ( var i = 0, length = array.length, swap = 0, temp = ''; i < length; i++ ) {
        swap        = Math.floor(Math.random() * (i + 1));
        temp        = array[swap];
        array[swap] = array[i];
        array[i]    = temp;
      }
      return array;
    };
    
    var percentageChance = function(values, chances) {
        for ( var i = 0, pool = []; i < chances.length; i++ ) {
          for ( var i2 = 0; i2 < chances[i]; i2++ ) {
              pool.push(i);
          }
        }
        return values[arrayShuffle(pool)['0']];
    };



     
    this.ground = Array.from(Array(this.worldSize.width*this.tiles), () => new Array(this.worldSize.height*this.tiles))
    
    for(var i = 0; i < this.groundTileCount-1; i ++){
      for(var j = 0; j < tilechances.length; j ++)
      tilechances[j].splice(1,0,0)
      tilestypes.splice(1,0,"#ffffff")
    }

   
      for(var y = 0; y < this.worldSize.height; y ++){
        for(var yy = 0; yy < this.tiles; yy++){
          for(var x = 0; x < this.worldSize.width*this.tiles; x ++){
            //const image = new PNGImage(this.tiles, this.tiles, 16, "#000000");
                  
            var color = percentageChance(tilestypes, tilechances[y]);
            //color = image.createColor(color)

            if(color > 0){
              color = color + this.groundTileCount;
            }

            this.ground[x][y*this.worldSize.height + yy] = tilestypes.indexOf(color);
            //image.setPixel(x,y,color)
        }
      
      }
    }
   
      for(var y = 0; y < this.worldSize.height*this.tiles; y ++){
        for(var x = 0; x < this.worldSize.width*this.tiles; x ++){
        var tile = this.ground[y][x];

        if(tile == 0){
          
          var surroundingTiles = {
            tl: null,
            t: null,
            tr: null,
            l: null,
            r: null,
            bl: null,
            b: null,
            br: null
          }

          if(x > 0){
            surroundingTiles.l = this.ground[y][x-1]
          }

          if(x < this.worldSize.width*this.tiles-1){
            surroundingTiles.r = this.ground[y][x+1]
          }

          
          if(y > 0){
            surroundingTiles.t = this.ground[y-1][x]
          }

          if(y < this.worldSize.height*this.tiles-1){
            surroundingTiles.b = this.ground[y+1][x]
          }

          if(x > 0 && y > 0){
            surroundingTiles.tl = this.ground[y-1][x-1]
          }

          if(x < this.worldSize.width*this.tiles-1 && y > 0){
            surroundingTiles.tr = this.ground[y-1][x+1]
          }

          if(y < this.worldSize.height*this.tiles-1 && x > 0)
          {
            surroundingTiles.bl = this.ground[y+1][x-1]
          }

          if(y < this.worldSize.height*this.tiles-1 && x < this.worldSize.width*this.tiles-1 )
          {
            surroundingTiles.br = this.ground[y+1][x+1]
          }
        
          var countOfAirAround = 0;

          Object.values(surroundingTiles).forEach(value => {
            if(value < this.groundTileCount){
              countOfAirAround++;
            }
          })


         

          if(surroundingTiles.t >= this.groundTileCount && surroundingTiles.b < this.groundTileCount && y > 1){
            this.ground[y][x] = 7;
         
          }

          if(surroundingTiles.b >= this.groundTileCount && surroundingTiles.t < this.groundTileCount){
            this.ground[y][x] = 6;
          }

          if(surroundingTiles.r >= this.groundTileCount && surroundingTiles.l < this.groundTileCount ){
            this.ground[y][x] = 5;
          }

          if(surroundingTiles.l >= this.groundTileCount && surroundingTiles.r < this.groundTileCount ){
            this.ground[y][x] = 4;
          }
      
          if( surroundingTiles.l >= this.groundTileCount && surroundingTiles.r >= this.groundTileCount && (surroundingTiles.t < this.groundTileCount || surroundingTiles.t == null) && surroundingTiles.b < this.groundTileCount){
            this.ground[y][x] = 3;
          }

          if(surroundingTiles.t >= this.groundTileCount && surroundingTiles.b >= this.groundTileCount&& surroundingTiles.r < this.groundTileCount && surroundingTiles.l < this.groundTileCount){
            this.ground[y][x] = 2;
          }
          

          if(surroundingTiles.t < this.groundTileCount &&
            surroundingTiles.r < this.groundTileCount &&
            surroundingTiles.b >= this.groundTileCount &&
            surroundingTiles.l >= this.groundTileCount ){
            this.ground[y][x] = 12;
          }

          if(surroundingTiles.t >= this.groundTileCount &&
            surroundingTiles.r < this.groundTileCount &&
            surroundingTiles.b < this.groundTileCount &&
            surroundingTiles.l >= this.groundTileCount ){
            this.ground[y][x] = 13;
          }

          if(surroundingTiles.t >= this.groundTileCount &&
            surroundingTiles.r >= this.groundTileCount &&
            surroundingTiles.b < this.groundTileCount &&
            surroundingTiles.l < this.groundTileCount ){
            this.ground[y][x] = 14;
          }

          if(surroundingTiles.t < this.groundTileCount &&
            surroundingTiles.r >= this.groundTileCount &&
            surroundingTiles.b >= this.groundTileCount &&
            surroundingTiles.l < this.groundTileCount ){
            this.ground[y][x] = 15;
          }

          //16 = bottom + top corners

          if(surroundingTiles.t < this.groundTileCount &&
            surroundingTiles.r < this.groundTileCount &&
            surroundingTiles.b >= this.groundTileCount &&
            surroundingTiles.l < this.groundTileCount &&
            surroundingTiles.tl >= this.groundTileCount &&
            surroundingTiles.tr >= this.groundTileCount){
            this.ground[y][x] = 16;
          }

          if(surroundingTiles.t < this.groundTileCount &&
            surroundingTiles.r < this.groundTileCount &&
            surroundingTiles.b < this.groundTileCount &&
            surroundingTiles.l >= this.groundTileCount &&
            surroundingTiles.tr >= this.groundTileCount &&
            surroundingTiles.br >= this.groundTileCount){
            this.ground[y][x] = 17;
          }

          if(surroundingTiles.t >= this.groundTileCount &&
            surroundingTiles.r < this.groundTileCount &&
            surroundingTiles.b < this.groundTileCount &&
            surroundingTiles.l < this.groundTileCount &&
            surroundingTiles.bl >= this.groundTileCount &&
            surroundingTiles.br >= this.groundTileCount){
            this.ground[y][x] = 18;
          }

          if(surroundingTiles.t < this.groundTileCount &&
            surroundingTiles.r >= this.groundTileCount &&
            surroundingTiles.b < this.groundTileCount &&
            surroundingTiles.l < this.groundTileCount &&
            surroundingTiles.bl >= this.groundTileCount &&
            surroundingTiles.tl >= this.groundTileCount){
            this.ground[y][x] = 19;
          }

          if(surroundingTiles.r >= this.groundTileCount &&
            surroundingTiles.b >= this.groundTileCount &&
            surroundingTiles.l < this.groundTileCount &&
            surroundingTiles.t < this.groundTileCount &&
            surroundingTiles.tl >= this.groundTileCount ){
            this.ground[y][x] = 23;
          }

          if(surroundingTiles.r >= this.groundTileCount &&
            surroundingTiles.b < this.groundTileCount &&
            surroundingTiles.l < this.groundTileCount &&
            surroundingTiles.t >= this.groundTileCount&&
            surroundingTiles.bl >= this.groundTileCount  ){
            this.ground[y][x] = 22;
          }

          if(surroundingTiles.r < this.groundTileCount &&
            surroundingTiles.b < this.groundTileCount &&
            surroundingTiles.l >= this.groundTileCount &&
            surroundingTiles.t >= this.groundTileCount&&
            surroundingTiles.br >= this.groundTileCount  ){
            this.ground[y][x] = 21;
          }

          if(surroundingTiles.r < this.groundTileCount &&
            surroundingTiles.b >= this.groundTileCount &&
            surroundingTiles.l >= this.groundTileCount &&
            surroundingTiles.t < this.groundTileCount&&
            surroundingTiles.tr >= this.groundTileCount  ){
            this.ground[y][x] = 20;
          }


          
          if(surroundingTiles.t >= this.groundTileCount && surroundingTiles.r >= this.groundTileCount && surroundingTiles.b >= this.groundTileCount && surroundingTiles.l < this.groundTileCount){
            this.ground[y][x] = 8;
          }

          if(surroundingTiles.l >= this.groundTileCount && surroundingTiles.r >= this.groundTileCount && surroundingTiles.b >= this.groundTileCount  && surroundingTiles.t < this.groundTileCount){
            this.ground[y][x] = 9;
          }

          if(surroundingTiles.l >= this.groundTileCount && surroundingTiles.t >= this.groundTileCount && surroundingTiles.b >= this.groundTileCount  && surroundingTiles.r < this.groundTileCount){
            this.ground[y][x] = 10;
          }

          if(surroundingTiles.l >= this.groundTileCount && surroundingTiles.t >= this.groundTileCount && surroundingTiles.r >= this.groundTileCount  && surroundingTiles.b < this.groundTileCount){
            this.ground[y][x] = 11;
          }
          

         
          // 19 = long right, left corners
          // 18 = long top, bottom corners
          // 17 = long left, right corners
          // 16 = long bottom, top corners


          if(countOfAirAround == 0){
            this.ground[y][x] = 1;
          }
        }
      }
    }


    
    this.map = this.make.tilemap({ data: this.ground, tileWidth: 64, tileHeight: 64, })
    this.tileset = this.map.addTilesetImage('base_tiles', 'base_tiles', 64,64,1,2)
    this.layer = this.map.createLayer(0,this.tileset,0,0)
    
    this.map.setCollisionBetween(this.groundTileCount,tilestypes.length)
    this.physics.add.collider(this.playersGroup, this.layer, function(player,layer){
    });

    /*
    fs.writeFile('map.png', base64, 'base64', function(err){
      if (err) throw err
    })
    */
    console.log("done")

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
          var y = Phaser.Math.RND.integerInRange(-64, -128);
          
          var player = new Player(this, channel.playerId, x,y);
          player.setVelocity(2,2);
         
          this.playersGroup.add(player)
        }
      })

      channel.emit('ready')
    })
  }

  UpdateArea(damage, layer, area, newState){

    var result = 0;
    if(this.ground == null || this.ground.length == 0)
      return 0
    else
    {
      var before = this.ground[layer].area(function(data1) { 
        return !data1.tileId == 0;
      })
      this.ground[layer].modifyByRectangle(damage, area,newState,false);
      var after = this.ground[layer].area(function(data1 ) { 
        return !data1.tileId == 0;
      })
      result = after - before;
      return result;
    } 
  }


  RemoveTile(player, tile){
     // remove the tile from the map
     this.map.removeTileAt(tile.x,  tile.y);
    
     player.body.setDrag(1,1)
     player.body.setVelocityX(32 - (player.x - tile.x*64)); // center horiz
     player.body.setVelocityY(tile.y*64 - Math.floor(player.y/64)*64 ); // to tile bottom
     player.body.setAllowGravity(false);
     player.body.checkCollision.none = true;
     player.movementEnabled = false;

     var self = this;

     this.time.addEvent({
       delay: 1000/60*60, // 1s of no inputting => depending on material digging
         callback:function() {
           player.MineMaterial(tile.index)
           player.movementEnabled = true;
           player.body.setAllowGravity(true);
           player.body.setDrag(0.025, 1)
           player.body.setVelocityY(0);
           player.body.setAccelerationY(0);
           player.body.setVelocityX(0);
           player.body.setAccelerationX(0);
           //player.setPosition(Math.floor(player.x), Math.floor(player.y));
           player.body.checkCollision.none = false;

           self.io.room().emit('tileMined', {
             x: tile.x,
             y: tile.y
           })
         }
     });
  }

  update() {
    let updates = [];
    
    //var Statehide = FkDstrGridData.getStateHide();
    //var stateVisible = FkDstrGridData.getStateDirt();

    this.playersGroup.children.iterate(player => {

      let deadUpdated = player.dead != player.prevDead;
      let fuelUpdated = player.fuel != player.prevfuel;
      //let inputUpdated = player.inputValues != player.prevInputValues
      let isMovingX = false
      let isMovingY = false


      var dx = player.body.velocity.x
      var dy = player.body.velocity.y
  
      if(dx > -1 && dx < 1){
        player.body.setVelocityX(0);
        player.body.setAccelerationX(0);
      }

      dx = player.body.velocity.x
      dy = player.body.velocity.y
      
      if(dx != 0){
        isMovingX = true;
      }

      if(dy != 0){
        isMovingY = true;
      }

      let isMoving = false;

      var x = player.x
      var px = player.prevX

      var y = player.y
      var py = player.prevY

      if(isMovingX || isMovingY)
        isMoving = true;
      
      if (isMoving || deadUpdated || ( x != px || y != py) || fuelUpdated) {
        if (deadUpdated || !player.dead) {
          updates.push(this.prepareToSync(player))
          player.postUpdate()
        }
      }

      if(!player.dead){
        if(player.movementEnabled && (player.body.velocity.x < 50 && player.body.velocity.x > -50 ) && (player.body.velocity.y == 0)){


          var nearestPlayerTileCoordsX = Math.floor((player.x-player.playersize/2)/64)
          var nearestPlayerTileCoordsY = Math.floor((player.y-player.playersize/2)/64)

          var offset = 32;

          var flooredPlayerx = Math.floor(player.x);
          var flooredPlayery = Math.floor(player.y);



          if(player.inputValues.left == true && player.inputValues.w == false) // holding mouse left + not flying
          {
            if(player.inputValues.s == true){ // trying to dig down, always do this even if holding left / right aswell
              // find closest tile and check if we're up against one.

              var TileidxsUnderPlayer = [];
              nearestPlayerTileCoordsY += 1 // so we get the row below the player

              if(flooredPlayerx > offset && flooredPlayerx < this.chunkSize*this.worldSize.width - offset){ // player is not against a edge of map
                TileidxsUnderPlayer.push(this.map.getTileAt(nearestPlayerTileCoordsX,nearestPlayerTileCoordsY))
                TileidxsUnderPlayer.push(this.map.getTileAt(nearestPlayerTileCoordsX-1,nearestPlayerTileCoordsY))
                TileidxsUnderPlayer.push(this.map.getTileAt(nearestPlayerTileCoordsX+1,nearestPlayerTileCoordsY))
              }
              else if(flooredPlayerx == this.chunkSize*this.worldSize.width - offset){ // against right border
                TileidxsUnderPlayer.push(this.map.getTileAt(nearestPlayerTileCoordsX,nearestPlayerTileCoordsY))
                TileidxsUnderPlayer.push(this.map.getTileAt(nearestPlayerTileCoordsX-1,nearestPlayerTileCoordsY))
              }
              else if(flooredPlayerx == offset){ // against left border
                TileidxsUnderPlayer.push(this.map.getTileAt(nearestPlayerTileCoordsX,nearestPlayerTileCoordsY))
                TileidxsUnderPlayer.push(this.map.getTileAt(nearestPlayerTileCoordsX+1,nearestPlayerTileCoordsY))
              }

            
              if(TileidxsUnderPlayer.length > 0){

                TileidxsUnderPlayer = TileidxsUnderPlayer.filter(tile => tile != null && tile.index >= this.groundTileCount); // no airblocks

                var closest = TileidxsUnderPlayer[0];

                if(closest != null && closest != undefined){
                  for(var i = 1; i < TileidxsUnderPlayer.length; i ++){
  
                    var centerOfTileX = TileidxsUnderPlayer[i].x*64+offset
        
                    var x1 = Math.abs(Math.floor(player.x - centerOfTileX))
                    var x2 = Math.abs(Math.floor(player.x - (closest.x*64+offset)))
                   
                    if(x1 < x2){
                      closest = TileidxsUnderPlayer[i];
                    }
                  }

                  if(closest != null && closest.index >= this.groundTileCount)
                    this.RemoveTile(player, closest);

                  return;
                }
              }
            }

            if(player.inputValues.a == true) // trying to dig left
            {
              if(flooredPlayerx > offset){ // not colliding with left world border
              
                var tileUnderPlayer = this.map.getTileAt(nearestPlayerTileCoordsX,nearestPlayerTileCoordsY+1);
                var tile = this.map.getTileAt(nearestPlayerTileCoordsX-1,nearestPlayerTileCoordsY)
               
                if(tile != null && tile.index >= this.groundTileCount && tileUnderPlayer != null && tileUnderPlayer.index >= this.groundTileCount)
                  this.RemoveTile(player, tile);

                return;
              }
            }

            if(player.inputValues.d == true) // trying to dig left
            {
              if(flooredPlayerx < this.chunkSize*this.worldSize.width - offset){ // not colliding with right world border
                
                            
                var tileUnderPlayer = this.map.getTileAt(nearestPlayerTileCoordsX,nearestPlayerTileCoordsY+1);
                var tile = this.map.getTileAt(nearestPlayerTileCoordsX+1,nearestPlayerTileCoordsY)    

                if(tile != null && tile.index >= this.groundTileCount && tileUnderPlayer != null && tileUnderPlayer.index >= this.groundTileCount)
                this.RemoveTile(player, tile);

                return;
              }
            }
          }
        }
      }
    
    })


    

   
   
    if (updates.length > 0) {
      this.io.room().emit('updatePlayers', updates)
    }    
    
  }
}
