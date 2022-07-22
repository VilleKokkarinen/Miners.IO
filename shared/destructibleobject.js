import * as _ from "lodash-es"
import Phaser from "phaser";
import { FkBaseDestructibleObject } from "./fkbasedestructibleobject.js";
import { FkDstrGridData } from "./fkdstrgriddata.js";


export class FkDestructibleObject extends FkBaseDestructibleObject {
    constructor( _game, _posX , _posY , _maxWidth, _maxHeight, _renderTexture, _renderColor = null, depth) {

        super(_posX, _posY, _maxWidth, _maxHeight, depth,
            ( _rect, _data ) => { }, 
            FkDstrGridData.getStateVisible()  );

        this.IS_DEBUG = true;
        this.FRAME_COLOR = 0x1c100a;
        this.BG_COLOR = 0x2b1910;
        this.FRAME_FILL_COLOR_DIRT = [
            0xa3713b,
            0x916534,
            0x7d572c,
            0x664724
        ]
        this.FRAME_FILL_COLOR = {
            dirt: this.FRAME_FILL_COLOR_DIRT,
            gold: this.FRAME_FILL_COLOR_DIRT
        }
        this.FRAME_COLOR_HIDDEN = 0xa76947
        this.FRAME_WIDTH = 6;
        this.layerGridEdge = null;
        this.layerTexture = null;
        this.debugDrawCounter = 0;
        this.dataRect = new Phaser.Geom.Rectangle( _posX, _posY, _maxWidth, _maxHeight );
        this.dataRenderTexture = _renderTexture;
        this.dataRenderColor = _renderColor;

        if ( this.dataRenderTexture != null ) {          
            this.layerGridEdge = _game.add.graphics();
            this.layerGridEdge.setX( _posX );
            this.layerGridEdge.setY( _posY );
            this.layerTexture = _game.add.tileSprite( _posX, _posY, _maxWidth*2/128, _maxHeight*2/128, this.dataRenderTexture ).setScale(128).setDepth(1);
            //console.log(this.layerTexture)
            
            this.layerTexture.setMask( this.layerGridEdge.createGeometryMask() );
        }
        else {
            this.layerGridEdge = _game.add.graphics();
            this.layerGridEdge.setX( _posX );
            this.layerGridEdge.setY( _posY );
        }
    }

    material(){
        return this.dataRenderTexture;
    }

    drawDstrObject() {
        this.layerGridEdge.clear();
        this.debugDrawCounter = 0;
        this.draw( ( _rect, _data ) => { this.render( _rect, _data ); } );
        //console.log( "Draw: " + this.debugDrawCounter + " rects" );
    }

    render(  _rect, _data ) {
        if ( this.dataRenderTexture != null ) {
            this.renderTexture( _rect, _data );
            return;
        }
        this.renderFrame( _rect, _data );
        return;
    }

    renderTexture( _rect, _data){
        if ( _data.dataIsVisible ) {
            this.debugDrawCounter++;
            //this.layerGridEdge.lineStyle(this.FRAME_WIDTH, this.FRAME_COLOR, 1);
            //this.layerGridEdge.fillStyle(this.FRAME_FILL_COLOR, 1 );
            this.layerGridEdge.fillRect( _rect.x, _rect.y, _rect.width, _rect.height );
        }else{
            //console.log("hidden texture");
        }
    }
    renderFrame( _rect, _data) {
        if ( _data.dataIsVisible ) {
            this.debugDrawCounter++;
            this.layerGridEdge.fillStyle(  this.FRAME_FILL_COLOR["dirt"][this.dataRenderColor] );
            this.layerGridEdge.fillRectShape( _rect );
           // this.layerGridEdge.lineStyle(this.FRAME_WIDTH, this.FRAME_COLOR, 1);
            this.layerGridEdge.strokeRect( _rect.x, _rect.y, _rect.width, _rect.height );
        }
        else {
            //console.log("hidden frame");
            if ( this.IS_DEBUG ) {
                this.debugDrawCounter++;
                //this.layerGridEdge.lineStyle(this.FRAME_WIDTH, this.FRAME_COLOR_HIDDEN, 1);
                this.layerGridEdge.strokeRect( _rect.x, _rect.y, _rect.width, _rect.height );
            }
        }
    }

     static CollideWithRectangle( _obj , _rect , _sData )  {
       
        var pp = _obj.collisionWithMovingRectangle( _rect, _sData );
        return pp;
    }
}
