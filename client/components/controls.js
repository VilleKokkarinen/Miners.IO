export default class Controls {
  constructor(scene, channel) {
    this.scene = scene
    this.channel = channel
    this.x = null;
    this.y = null;
    //this.player = player

    

    // add a second pointer
    this.scene.input.addPointer()
    //this.scene.cameras.main.startFollow(this.player);
    this.scene.events.on('update', this.update, this)
  }

  setCoords(x,y){
    this.x = x;
    this.y = y;
  }

  zoomTo(amount){
    this.scene.cameras.main.zoomTo(amount,350, Phaser.Math.Easing.Cubic.InOut, false)
  }

  update() {

    if(this.scene != undefined && this.scene.input.activePointer != undefined){    
      var dx = this.scene.input.activePointer.worldX;
      var dy = this.scene.input.activePointer.worldY;
      
      //console.log(dx, dy)
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
  
  }
}