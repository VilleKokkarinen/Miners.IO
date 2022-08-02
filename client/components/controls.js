export default class Controls {
  constructor(scene, channel) {
    this.scene = scene
    this.channel = channel
    this.x = null;
    this.y = null;  

    this.input = {
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

    var self = this;
    this.scene.events.on('update', this.update, this)

    this.scene.input.keyboard.on('keydown', function(event){

      if(Object.keys(self.input).includes(event.key)){
        self.input[event.key] = true;
        self.channel.emit('playerMove', self.input);
      }
    })

    this.scene.input.keyboard.on('keyup', function(event){

      if(Object.keys(self.input).includes(event.key)){
        self.input[event.key] = false;
        self.channel.emit('playerMove', self.input);
      }
    })
    
    this.scene.input.on('pointerdown', function (pointer) {
      var key = pointer.button;

      if(key == 0){ // left
        self.input.left = true;
        self.channel.emit('playerMove', self.input);
      }else if(key == 2){ // right
        self.input.right = true;
        self.channel.emit('playerMove', self.input);
      }
    });

    this.scene.input.on('pointerup', function (pointer) {
      var key = pointer.button;

      if(key == 0){ // left
        self.input.left = false;
        self.channel.emit('playerMove', self.input);
      }else if(key == 2){ // right
        self.input.right = false;
        self.channel.emit('playerMove', self.input);
      }
    });


  }

  setCoords(x,y){
    this.x = x;
    this.y = y;
  }

  zoomTo(amount){
    this.scene.cameras.main.zoomTo(amount,350, Phaser.Math.Easing.Cubic.InOut, false)
  }
  

  update() {

    /*
    if(this.scene != undefined && this.scene.input.activePointer != undefined){    

      var dx = this.scene.input.activePointer.worldX;
      var dy = this.scene.input.activePointer.worldY;
      
      this.scene.input.activePointer.updateWorldPoint(this.scene.cameras.main);

      if(this.x != null && this.y != null){
        var negatedx = dx-this.x;
        var negatedy = dy-this.y;


        if((negatedx < -35 || negatedx > 35) || (negatedy < -35 || negatedy > 35))
        {
          this.channel.emit('playerMove', {
              dx:dx,
              dy:dy,
          })
        }
        else{
          this.channel.emit('playerMove', {
            dx:this.x,
            dy:this.y,
        })
        }
    }
    

   
    }
  */
  }
}