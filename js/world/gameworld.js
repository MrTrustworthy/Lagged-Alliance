"use strict";

var GameWorld = function() {

	this.map = null;

	this.ambientLight = new THREE.AmbientLight(0x909090);


}

GameWorld.objAmount = 50;

/**
 * Creates the gameworld
 */
GameWorld.prototype.createWorld = function() {

	console.log("Loading up GameWorld", this);

	game.scene.add(this.ambientLight);

	this.map = new GameMap(50);

	//load random trees
	for (var i = 0; i < GameWorld.objAmount; i++) {
		var obj = new Tree();
		try {
			this.map.get(GUtil.getRandomInt(0, 24), GUtil.getRandomInt(0, 24)).placeContent(obj);
		} catch (e) {
			console.warn("Can't place tree here:", e);
		}
	}

	console.log("Finished Map loading", this.map);

}

/**
 * Calculates a path
 */
GameWorld.prototype.moveTo = function(actor, target) {

	var path = this.getPath(actor, target);
	if (path.length > 0) {

		this.map.moveAlongPath(actor, path);
	}

}

GameWorld.prototype.getPath = function(actor, target) {
	try {
		return this.map.findPath(actor.placedOn, target);
	} catch (e) {
		// console.log("Error!", e.stack);
		return [];
	}
}