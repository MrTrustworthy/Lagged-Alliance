/**
 * This class represents a simple 2D map
 * this is used as a base for the gamemap and worldmap
 */
var Map2D = function(size) {

	if (!size) throw new Error("No size omitted!");

	this.length = size;
	this.sizeX = size;
	this.sizeY = this.sizeX;

	this._map = [];
	for (var x = 0; x < this.sizeX; x++) {
		this._map[x] = [];
		this._map[x].length = this.sizeY;
	}

};

Map2D.prototype.forEach = function(callback_func) {

	var lengthX = this._map.length;
	var lengthY = this._map[0].length;

	for (var x = 0; x < lengthX; x++) {
		for (var y = 0; y < lengthY; y++) {
			callback_func(this._map[x][y], x, y);
		}
	}
};

// type-error-safe version of array[x][y]
Map2D.prototype.get = function(x, y) {
	//transform position into x/y if needed
	if (arguments.length === 1) {
		var pos = x;
		x = pos.x;
		y = pos.y;
	}

	try {
		return this._map[x][y];
	} catch (e) {
		return null;
	}
};

Map2D.prototype.getRandom = function() {
	return this.get(
		qp.getRandomInt(0, this.sizeX - 1),
		qp.getRandomInt(0, this.sizeY - 1)
	);
};