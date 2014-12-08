var Position = function(x, y) {

	this.x = x;
	this.y = y;
}

Position.alignment = {
	HORIZONTAL: 1,
	DIAGONAL: 2
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

Position.prototype.clone = function() {
	return new Position(this.x, this.y);
}

Position.prototype.calcAlignment = function(otherPosition) {
	if ((this.x === otherPosition.x) ||
		(this.y === otherPosition.y)) {
		return Position.alignment.HORIZONTAL;
	}
	return Position.alignment.DIAGONAL;
}