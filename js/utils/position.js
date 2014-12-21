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

Position.prototype.equals = function(other) {
	return this.x === other.x && this.y === other.y;
}

Position.prototype.diff = function(other) {
	return new Position(
		other.x - this.x,
		other.y - this.y
	);
}

Position.prototype.length = function(){

	return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
}

Position.prototype.clone = function() {
	return new Position(this.x, this.y);
}

/**
 * if two positions are aligned horizontally, the cost is 1
 * if they are aligned diagonally, the cost is ~1.41
 *
 */
Position.prototype.calcAlignmentCost = function(otherPos) {
	return ((this.x === otherPos.x) || (this.y === otherPos.y)) ? 1 : 2; 
}

Position.prototype.distanceTo = function(otherPos, variant) {

	variant = variant || Position.distances.MANHATTAN;

	if (variant === Position.distances.MANHATTAN) {
		//manhattan distance
		var d_x = Math.abs(otherPos.x - this.x);
		var d_y = Math.abs(otherPos.y - this.y);
		return d_x + d_y;

	} else if (variant === Position.distances.LINEOFSIGHT) {
		// airline-distance
		var v1 = new THREE.Vector2(this.x, otherPos.y);
		var v2 = new THREE.Vector2(this.x, otherPos.y);
		return v1.distanceTo(v2);
	}



}