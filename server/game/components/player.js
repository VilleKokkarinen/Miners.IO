export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, playerId, x = 64, y = 64) {
    super(scene, x, y, '')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.scene = scene

    this.prevX = -1
    this.prevY = -1

    this.dead = false
    this.prevDead = false

    this.playerId = playerId
    this.move = {}

    this.name = "";
    this.mass = 1;
    this.scale=  1;
    this.zoom = 1;
    this.playermassrequiredtogrow = 32;
    this.playerspeed = 1000;
    this.playersize = 32;
    this.health = 100;
    this.playeravatartype = "player1";
    this.playeravatarcolor = "#ff00ff";

    this.body.setSize(32,32)

    this.prevNoMovement = true

    this.setCollideWorldBounds(true)

    scene.events.on('update', this.update, this)
  }


  kill() {
    this.dead = true
    this.setActive(false)
  }

  revive(playerId) {
    this.playerId = playerId
    this.dead = false
    this.setActive(true)
    this.setVelocity(0)
  }

  setMove(data) {
    
    let move = {    
      dx:data.dx,
      dy:data.dy
    }
   
    this.setVelocity(move.dx-this.x, move.dy-this.y)
    this.move = move
  }

  MineMaterial(amount, material){
    var massbonus = 0;

    var speedbonus = 0;
    var speedbonusduration = 0;

    var visionbonus = 0;
    var visionbonusduration = 0;

    var healthbonus = 0;


    if (material == "dirt")
    {
        massbonus = 5;
    }

    if (material == "gold")
    {
        massbonus = 10;
    }


    if (this.scale <= 60)
    {

        this.mass += massbonus * amount;

        var currMassFloored = this.mass / 32 * 32;

        if (currMassFloored > this.playermassrequiredtogrow)
        {
          this.playermassrequiredtogrow = (100 + this.playermassrequiredtogrow * 1.25);

          this.playersize += 32;

          var zoomamount = 1 - this.scale * 0.9 * (1 / 32);

          if (zoomamount < 0.1)
          {
              zoomamount = 0.1;
          }
          else if (zoomamount > 1)
          {
              zoomamount = 1;
          }
          this.zoom = zoomamount;
          this.playerspeed -= 20;
          this.scale++;
        }
    }
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
  }
}
