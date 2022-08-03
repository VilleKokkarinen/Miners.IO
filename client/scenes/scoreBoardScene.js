import { Scene } from 'phaser'
import eventsCenter from '../components/eventcenter.js'

export default class BootScene extends Scene {
  constructor() {
    super({ key: 'ScoreBoardScene' })
  }
  preload() {
    this.load.bitmapFont(
        "arcade",
        "./assets/arcade.png",
        "./assets/arcade.xml"
      );
      this.load.image("scoreboardbg", "./assets/scoreboardbg.png");
  }

  create() {
    this.scene.bringToTop();
    this.width = 512;
    this.height = 256;

    this.padding = 5;
    this.topPadding = 5;
    
    var color = 0xdbdbd9;
    var alpha = 0.25;

    this.add.rectangle(0,0,512,256,color, alpha);

    this.playerText = this.add
    .bitmapText(this.padding, this.topPadding, "arcade", "",20)
    .setTint(0xe6de10);

    this.healthText = this.add
    .bitmapText(this.padding, 35 + this.topPadding, "arcade", "hp: ",18)
    .setTint(0xe6de10);

    this.fuelText = this.add
    .bitmapText(this.padding, 70 + this.topPadding, "arcade", "fuel: ",18)
    .setTint(0xebebeb);


    this.massText = this.add
    .bitmapText(this.padding, 105 + this.topPadding, "arcade", "mass: ",18)
    .setTint(0xebebeb);

    

    eventsCenter.on("updateName", this.updateName, this);
    eventsCenter.on("updateMass", this.updateMass, this);
    eventsCenter.on('updateHealth', this.updateHealth, this)
    eventsCenter.on('updateFuel', this.updateFuel, this)

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
        eventsCenter.off('updateName', this.updateName, this)
        eventsCenter.off('updateMass', this.updateMass, this)
        eventsCenter.off('updateHealth', this.updateHealth, this)
        eventsCenter.off('updateFuel', this.updateFuel, this)
    })
  }

  updateName(name) {
    this.playerText.setText(name.substring(0,10));
  }

  updateHealth(health){
    this.healthText.setText("hp: "+health);
  }

  updateFuel(obj){

    var percentage = Math.floor(obj.fuel / obj.fuelMax * 100);

    this.fuelText.setText("fuel: " + percentage + " %");
  }

  nFormatter(num, digits) {
    const lookup = [
      { value: 1, symbol: "" },
      { value: 1e3, symbol: "k" }, // thousands
      { value: 1e6, symbol: "m" }, // millions
      { value: 1e9, symbol: "b" },  // billions
      { value: 1e12, symbol: "t" },  // trillions
      { value: 1e15, symbol: "p" },
      { value: 1e18, symbol: "e" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var item = lookup.slice().reverse().find(function(item) {
      return num >= item.value;
    });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
  }

  updateMass(mass) {
    var result = this.nFormatter(mass, 2)
    this.massText.setText("mass: "+result);
  }

  update(time, delta) {    

  }
}
