export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, playerId, x = 64, y = 64) {
    super(scene, x, y, '')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.scene = scene

    this.prevX = -1
    this.prevY = -1

    this.prevVelocity = {x:0,y:0}

    this.dead = false
    this.prevDead = false

    this.mouseDirection = 0;
    this.inputValues = {
      w: false,
      a: false,
      s: false,
      d: false,
      e: false,
      shift: false,
      ctrl: false,
      left: false, // mouse left & right
      right: false,
    }

    this.prevInputValues = this.inputValues;


    this.playerId = playerId
    this.move = {}

    this.collidingTiles = [];

    this.name = "";
    this.mass = 100;
    this.scale =  1;
    this.zoom = 1;
    this.playersize = 56;
    this.playerspeed = 5000;
    this.health = 100;
    this.playeravatartype = "player1";
    this.playeravatarcolor = "#ff00ff";

    this.movementEnabled = true;

    this.body.setSize(56,56, true)
    this.body.setMass(this.mass)
    this.body.setDrag(0.025, 1)
    this.body.setMaxVelocityX(250)
    this.body.setMaxVelocityY(500)
    this.body.setDamping(true)
    this.setCollideWorldBounds(true)

    scene.events.on('update', this.update, this)
  }


  kill() {
    this.dead = true
    this.setActive(false)
  }

  revive(playerId, x, y) {
    this.playerId = playerId
    this.dead = false
    this.mass = 1;
    this.zoom = 1;
    this.playerspeed = 5000;
    this.playersize = 64;
    this.health = 100;
    this.setActive(true)
    this.setVelocity(0,0)
    this.body.setSize(56,56, true)
    this.body.setMass(this.mass)
    this.body.setDrag(0.025, 1)
    this.body.setMaxVelocityX(250)
    this.body.setMaxVelocityY(500)
    this.body.setDamping(true)
    this.setCollideWorldBounds(true)
    this.setPosition(x,y)
  }

  setMove(data) {
    this.inputValues = data;
    if(this.movementEnabled){
      this.prevVelocity = this.body.velocity;
      var velocityX = 0;
      var velocityY = 0;

      if(this.inputValues.w == true )
      velocityY -= 1175;

      if(this.inputValues.a == true )
      velocityX -= 250;
      
      if(this.inputValues.d == true )
      velocityX += 250;

      if(this.inputValues.s == true )
      velocityY += 0;
      
      if(this.body.velocity.x == 0)
      this.setVelocityX(velocityX/4)

      this.setAccelerationX(velocityX)


      if(velocityY < 0){
        this.collidingTiles = [];
      }

      this.setAccelerationY(velocityY)
    }
  }

  MineMaterial(material){
    var massbonus = 0;

    var speedbonus = 0;
    var speedbonusduration = 0;

    var visionbonus = 0;
    var visionbonusduration = 0;

    var healthbonus = 0;

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
      "#830087"   //exploding // can be anything
    ]

    if (material <= 2 || material >= 14) // dirt & stone discarded, explosives explode, and lava is lava
    {
      massbonus = 0;
    }else if (material == 3)
    {
        massbonus = 100; // obsidian
    }else if (material == 4)
    {
        massbonus = 75; // copper
    }
    else if (material == 5)
    {
        massbonus = 50; // tin
    }
    else if (material == 6)
    {
        massbonus = 100; // silver
    }
    else if (material == 7)
    {
        massbonus = 200; // gold
    }
    else if (material == 8)
    {
        massbonus = 20; // diamond
    }
    else if (material == 9)
    {
        massbonus = 20; // emerald
    }
    else if (material == 10)
    {
        massbonus = 20; // ruby
    }
    else if (material == 11)
    {
        massbonus = 10; // loparite
    }
    else if (material == 12)
    {
        massbonus = 200; // treasure 1
    }
    else if (material == 13)
    {
        massbonus = 200; // treasure 2
    }



    this.mass += massbonus;
    this.body.setMass(this.mass)

  }
  update() {
    //this.setPosition(this.move.x, this.move.y)
    //this.setVelocity(this.move.dx, this.move.dy)
    //this.setMaxVelocity(this.playerspeed,this.playerspeed);
  }

  postUpdate() {
    this.prevX = this.x
    this.prevY = this.y
    this.prevDead = this.dead
    this.prevInputValues = this.inputValues;  
  }
}
