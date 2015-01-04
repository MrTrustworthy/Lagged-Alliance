var Position = function(x, y) {

	this.x = x;
	this.y = y;
}

Position.alignment = {
	HORIZONTAL: 1,
	DIAGONAL: 2
}
Position.distances = {
	MANHATTAN: 0,
	LINEOFSIGHT: 1
}

Position.convert = function(something){
	return new Position(something.x, something.y);
}

Position.prototype.equals = function(other) {
	return this.x === other.x && this.y === other.y;
}

Position.prototype.diff = function(other) {
	return new Position(
		other.x - this.x,
		other.y - this.y
	);
}

Position.prototype.by = function(amount){
	return new Position(this.x/amount, this.y/amount);
}

Position.prototype.length = function(){

	return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
}

Position.prototype.clone = function() {
	return new Position(this.x, this.y);
}

Position.prototype.times = function(amount){
	return new Position(this.x * amount, this.y * amount);
}


Position.prototype.add = function(position){
	return new Position(this.x + position.x, this.y + position.y);
}

/**
 * if two positions are aligned horizontally, the cost is 1
 * if they are aligned diagonally, the cost is ~1.41
 *
 */
Position.prototype.calcAlignmentCost = function(otherPos) {
	return ((this.x === otherPos.x) || (this.y === otherPos.y)) ? 1 : 1.5; 
}

/**
* calculates the distance of two positions.
* uses LOS-distance by default, can also use manhattan
*/
Position.prototype.distanceTo = function(otherPos, variant) {

	variant = variant || Position.distances.LINEOFSIGHT;

	if (variant === Position.distances.MANHATTAN) {
		//manhattan distance
		var d_x = Math.abs(otherPos.x - this.x);
		var d_y = Math.abs(otherPos.y - this.y);
		return d_x + d_y;

	} else if (variant === Position.distances.LINEOFSIGHT) {
		// airline-distance
		var v1 = new THREE.Vector2(this.x, this.y);
		var v2 = new THREE.Vector2(otherPos.x, otherPos.y);
		return v1.distanceTo(v2);
	}
}