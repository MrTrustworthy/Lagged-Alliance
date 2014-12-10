
/**
 * Path score:
 * F = G + H
 * G = movement costfrom the starting point to this field
 * H = estimated cost from here to target
 */
var PathNode = function(field) {

	this.position = field.position;
	this.field = field;
	this.parent = null;
	this.astar_f = 0;
	this.astar_g = 0;
	this.astar_h = 0;

}

PathNode.prototype.equals = function(other) {
	return this.position.equals(other.position);
}