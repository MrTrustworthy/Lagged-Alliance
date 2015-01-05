var GameWorld = function() {

	// TODO: make map generic  and inherit
	this.sizeX = size || 8;
	this.sizeY = this.sizeX;

	this._map = [];
	for (var x = 0; x < this.sizeX; x++) {
		this._map[x] = [];
		this._map[x].length = this.sizeY;
	}


}

