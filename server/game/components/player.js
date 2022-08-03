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

    this.name = "";
    this.mass = 100;
    this.scale =  1;
    this.zoom = 1;
    this.playersize = 56;
    this.playerspeed = 5000;
    this.health = 100;
    this.fuel = 10000;
    this.prevfuel = 10000;
    this.fuelMax = 10000;
    this.fuelDrainRate = 0;
    this.fuelDrainTimer = 0;
    this.playeravatartype = "player1";
    this.playeravatarcolor = "#ff00ff";

    this.movementEnabled = true;

    this.body.setSize(56,56, true)
    this.body.setMass(this.mass)
    this.body.setDrag(0.025, 1)
    this.body.setMaxVelocityX(2500)
    this.body.setMaxVelocityY(5000)
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
    this.fuel = 1000;
    this.fuelMax = 1000;
  }

  setMove(data) {
    this.inputValues = data;
    if(this.movementEnabled){
      this.prevVelocity = this.body.velocity;
      var velocityX = 0;
      var velocityY = 0;         

      if(this.inputValues.a == true )
      {
        this.fuelDrainRate = 20;
        velocityX -= 250;
      }
    
      
      if(this.inputValues.d == true )
      {
        this.fuelDrainRate = 20;
        velocityX += 250;
      }

      if(this.inputValues.w == true ){
        this.fuelDrainRate = 50;
        velocityY -= 1175;
      }

      if(this.inputValues.w == false &&
        this.inputValues.a == false &&
        this.inputValues.d == false
      ){
        this.fuelDrainRate = 0;
      }

      //if(this.inputValues.s == true )
      //velocityY += 0;
      
      if(this.body.velocity.x == 0)
      this.setVelocityX(velocityX/4)

      this.setAccelerationX(velocityX)
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

    if (material < 16 || material >= 30) // dirt & stone discarded, explosives explode, and lava is lava
    {
      massbonus = 0;
    }else if (material == 19)
    {
        massbonus = 100; // obsidian
    }else if (material == 20)
    {
        massbonus = 75; // copper
    }
    else if (material == 21)
    {
        massbonus = 50; // tin
    }
    else if (material == 22)
    {
        massbonus = 100; // silver
    }
    else if (material == 23)
    {
        massbonus = 200; // gold
    }
    else if (material == 24)
    {
        massbonus = 20; // diamond
    }
    else if (material == 25)
    {
        massbonus = 20; // emerald
    }
    else if (material == 26)
    {
        massbonus = 20; // ruby
    }
    else if (material == 27)
    {
        massbonus = 10; // loparite
    }
    else if (material == 28)
    {
        massbonus = 200; // treasure 1
    }
    else if (material == 29)
    {
        massbonus = 200; // treasure 2
    }


    this.prevfuel = this.fuel;
    this.fuel -= 50;

    this.mass += massbonus;
    this.body.setMass(this.mass)

  }
  update(time, delta) {
    this.fuelDrainTimer += delta


    if(this.fuelDrainTimer > 500){
      this.fuelDrainTimer = 0;
      this.prevfuel = this.fuel;
      this.fuel -= (this.fuelDrainRate + 1)
    }
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
