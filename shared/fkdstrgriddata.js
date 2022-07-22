
export class FkDstrGridData  {
     dataIsVisible;

     constructor( _isVisible  ) {
        this.dataIsVisible = _isVisible;
    }

     static getStateVisible() {
        return new FkDstrGridData( true );
    }

     static getStateHide() {
        return new FkDstrGridData( false );
    }
}