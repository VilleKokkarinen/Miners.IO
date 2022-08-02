
export class world {

    static tilesize = 64;
    static tiles = 256;
    static chunkSize = this.tilesize*this.tiles;
    static chunksWidth = 1;
    static chunksHeight = 1;


    static getChunkSize() {
        return this.chunkSize;
    }

    static getWorldSize() {
        return {
            width: this.chunksWidth,
            height: this.chunksHeight,
            chunkSize: this.chunkSize
            };
    }

}