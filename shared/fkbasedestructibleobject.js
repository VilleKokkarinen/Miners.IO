import * as _ from "lodash-es"
import Phaser from "phaser";
import FkQuadTree from "./fkquadtree.js";


export class FkBaseDestructibleObject {
	dataBody;
	dataPos;

	constructor(//_game,
		_posX , _posY , 
		_maxWidth , _maxHeight , depth,
		_draw,
		_initState) {

		this.dataPos = new Phaser.Geom.Point( _posX, _posY );
		this.dataBody = new FkQuadTree( 0, 0,
			_maxWidth, _maxHeight, depth, 
			_initState );
	}

	
	draw( _triggerDraw ) {
		this.dataBody.draw( _triggerDraw );
	}

	area( _matchFunc )  {
		return this.dataBody.area( 1, _matchFunc );
	}

	modifyByDstrObject( _g, _stateToChangeFromSource, _stateNewOnTarget) {
		this.dataBody.updateWithQuadTree( _g.dataBody, ( _data ) => {
			if ( _.isEqual( _data, _stateToChangeFromSource ) )
				return _stateNewOnTarget;
			else
				return null;
		} );
	}

	modifyByRectangle( _g , _sNew, _isRelative  = false ) { 
		if ( _isRelative )
		this.dataBody.updateWithRectangle( _g, _sNew );
		else{
			this.dataBody.updateWithRectangle( 
				new Phaser.Geom.Rectangle( 
					_g.x - this.dataPos.x,
					_g.y - this.dataPos.y, 
					_g.width,
					_g.height
					), _sNew );
		}
	}


	collisionWithPoint( _g , _sData )  {
    	return this.dataBody.collisionWithPhaser.Geom.Point( 
    		new Phaser.Geom.Point( _g.x - this.dataPos.x, _g.y - this.dataPos.y ), _sData );
    }


	collisionWithMovingRectangle( _g1 , _sData )  {
		var rect = new Phaser.Geom.Rectangle( 
			_g1.x - this.dataPos.x,
			_g1.y - this.dataPos.y, 
			_g1.width,
			_g1.height
			)


    	var p = this.dataBody.collisionWithRectangle( rect, _sData );
		return p;
    }

	collisionWithDstrObject( _g , _sData )  {
    	return this.dataBody.collisionWithQuadTree( 
    		new Phaser.Geom.Point( _g.dataPos.x - this.dataPos.x, _g.dataPos.y - this.dataPos.y ),
    		_g.dataBody, _sData );
    }

     collisionWithMovingDstrObject( _g1 , _p2 , _sData ) {
    	return this.dataBody.collisionWithMovingQuadTree( 
    		new Phaser.Geom.Point( _g1.dataPos.x - this.dataPos.x, _g1.dataPos.y - this.dataPos.y ),
    		new Phaser.Geom.Point( _p2.x - this.dataPos.x, _p2.y - this.dataPos.y ),
    		_g1.dataBody, _sData );
    }

	saveToString() {
    	return "";
    }

	loadFromString() {
    	return "";
    }
}