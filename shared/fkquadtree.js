import * as _ from "lodash-es"
import Phaser from "phaser";

export default class FkQuadTree{
	depth 
	dataNode;
	dataRect;
	dataSubTree;

	constructor( _x , _y , _w , _h , _depth , _data  ) {
		this.depth = _depth;
		this.dataNode = _data;
		this.dataRect = new Phaser.Geom.Rectangle( _x, _y, _w, _h );
		this.dataSubTree = null;
	}

	area( _fraction , _matchFunc )  {
		if ( _matchFunc == null )
			return 0;
		if ( this.dataSubTree == null )
			return _matchFunc(this.dataNode) ? _fraction : 0;
		else {
			var sum  = 0;
			for( var i = 0; i < this.dataSubTree.length; i++ ) {
				var t = this.dataSubTree[i];
				sum += t.area( _fraction * 0.25, _matchFunc );
			}
			return sum;
		}
	}

	replaceBody (newTree){
		newTree.draw = this.draw;
		this.dataSubTree = newTree;
	}

	RectangleToRectangle( r1, r2)
	{
		// The rectangles don't overlap if
		// one rectangle's minimum in some dimension 
		// is greater than the other's maximum in
		// that dimension.

		var noOverlap = r1.x >= r2.x + r2.width ||
							r2.x >= r1.x + r1.width ||
							r1.y >= r2.y + r2.height ||
							r2.y >= r1.y + r1.height;

		return !noOverlap;
	}
	ContainsRect( R1, R2)
	{
		if ((R2.x + R2.width) <= (R1.x + R1.width)
			&& (R2.x) >= (R1.x)
			&& (R2.y) >= (R1.y)
			&& (R2.y + R2.height) <= (R1.y + R1.height)
			)
		{
			return true;
		}
		else
		{
			return false;
		}
	}

	updateWithRectangle( _g , _dataChangeOnContain  ) {
		if ( this.ContainsRect( _g, this.dataRect ) ) {
			this.foldSubTreesToParent( _dataChangeOnContain );
			return;
		}
		if ( this.RectangleToRectangle( this.dataRect, _g )
			|| ( this.ContainsRect( this.dataRect, _g ) ) ) {
			this.updateSubtrees( _dataChangeOnContain, function( _tree , _data  ) {
				_tree.updateWithRectangle( _g, _data );
			})
		}
	}

	updateWithQuadTree22( _g, _sData) {
		if(_sData == null){
			_sData = new FkQuadTree(_g.dataRect.x, _g.dataRect.y, _g.dataRect.width, _g.dataRect.height, _g.depth,_g.dataNode);
			_sData.dataSubTree = null;
		}
		if(_g.dataSubTree == null){
			return _sData;
		}
		else {	
			_sData.dataSubTree = [];
			for( var i = 0; i < _g.dataSubTree.length; i++ ) {
				var subtreenode = _sData.updateWithQuadTree22( _g.dataSubTree[i], null )
				_sData.dataSubTree.push(subtreenode)
			}			
			return _sData;
		}
	}

	updateWithQuadTree( _g, _updateDataFunc ) {
		if ( _g.dataSubTree == null ) {
			var data = _updateDataFunc( _g.dataNode );
			if ( data != null )
				this.updateWithRectangle( _g.dataRect, data );
		}
		else {
			for( var i = 0; i < _g.dataSubTree.length; i++ ) {
				var t = _g.dataSubTree[i];
				this.updateWithQuadTree( t, _updateDataFunc );
			}
		}
	}
	updateSubtrees( _dataToUpdate , 
		_callback ) {
		if ( this.depth > 0 ) {
			if ( this.dataSubTree == null )
				this.createAllSubTrees();
			for( var i = 0; i < this.dataSubTree.length; i++ ) {
				var t = this.dataSubTree[i];
				_callback( t, _dataToUpdate );
			}
			// At this point, all sub trees has been updated.
			// Check whether all subtrees hold the same value
			// If they do, they are redundant and can be represent by using only parent tree. 
			// So fold them back to parent tree
			this.clearRedendantSubTrees();
		}
		else
			this.foldSubTreesToParent( _dataToUpdate );
	}

	draw( _triggerDraw ) {
		var self = this;
		if ( this.dataSubTree != null ) {
			this.dataSubTree.forEach( function(q) {
				q.draw( _triggerDraw );
			})
		}
		else _triggerDraw( self.dataRect, self.dataNode );
	}	


	collisionWithPoint( _g, _sData  )  {
		if(!this.ContainsRect(new Phaser.Geom.Rectangle(this.dataRect.x, this.dataRect.y ,this.dataRect.width,this.dataRect.height),
		new Phaser.Geom.Rectangle(_g.x, _g.y ,1,1)))
			return false;
		if ( this.dataSubTree != null ) {
			var b = false;
			for ( var i = 0; i < this.dataSubTree.length; i++ ) {
				b = b || this.dataSubTree[i].collisionWithPoint( _g, _sData );
			}
			return b;
		}
		else
			return _.isEqual( this.dataNode, _sData );
	}

	collisionWithRectangle( _g1 , _sData  ) {
		
		var intersects = this.RectangleToRectangle(this.dataRect, _g1);

		if ( this.dataSubTree == null ) {
			if ( _sData.dataIsVisible == this.dataNode.dataIsVisible && intersects){
				return true;
			}
		}
		else if ( _sData.dataIsVisible != this.dataNode.dataIsVisible || !intersects){
			return false;
		}
		else {
			for ( var j = 0; j < this.dataSubTree.length; j++ ) {
				var st = this.dataSubTree[j];
				var tmpP = st.collisionWithRectangle( _g1, _sData );
				
				if(tmpP == true){
					return true
				}
			}
			return false;
		}
	}

	collisionWithQuadTree( _offset , _g , _sData  ) {
		return false;
	}

	collisionWithMovingQuadTree( _offset1 , _offset2 , _g , _sData  ) {
		return null;
	}

	foldSubTreesToParent( _data  ) {
		this.dataSubTree = null;
		this.dataNode = _data;
	}

	createAllSubTrees() {
		var wh = [ 
			{ w: 0, h: 0 },
			{ w: 1, h: 0 },
			{ w: 0, h: 1 },
			{ w: 1, h: 1 },
		]
		this.dataSubTree = [];
		for( var i = 0; i < wh.length; i++ ) {
			var o = wh[i];
			this.dataSubTree.push( new FkQuadTree( 
				this.dataRect.x + ( this.dataRect.width/2 * o.w ), 
				this.dataRect.y + ( this.dataRect.height/2 * o.h ), 
				this.dataRect.width/2, this.dataRect.height/2, 
				this.depth - 1, this.dataNode ) );
		}
	}

	clearRedendantSubTrees() {
		var toCompare  = null;
		for( var i = 0; i < this.dataSubTree.length; i++ ) {
			var t = this.dataSubTree[i];
			if ( t.dataSubTree != null )
				return;
			if ( toCompare == null )
				toCompare = t.dataNode;
			else if ( !_.isEqual( toCompare, t.dataNode ) )
				return;
		}
		// All sub trees don't contain any sub-sub trees and have the same node data.
		this.foldSubTreesToParent( toCompare );
	}
}