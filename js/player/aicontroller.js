/**
 * The player controller gets initialized and filled with players
 * BEFORE the world is created!
 */
var AIController = function() {

	this.actors = [];

}



/**
 * adds a playeractor to this instance
 */
AIController.prototype.addActor = function(actor) {
	this.actors.push(actor);
}

/**
 * returns all actors in a list
 */
AIController.prototype.getActors = function() {
	return this.actors;
}


/**
 * Takes the given input and updates the actor according to it
 */
AIController.prototype.startTurn = function() {

		//cloning the list
		var charList = this.actors.filter(function(actor) {
			return actor.isAlive;
		});

		var world = window.game.world;
		var cam = window.game.playerController.camera;

		var moveFunc = function() {
			if (charList.length === 0) {
				cam.unstick();
				game.endTurn();
				return;
			}
			var actor = charList.shift();

			cam.stick(actor);

			// move the actor, then call this function again
			world.moveTo(actor, world.map.getFreeField()).then(moveFunc);
		}

		moveFunc();
		return;

	}
	/**
	 * Re-fills action-points
	 */
AIController.prototype.endTurn = function() {

	this.actors.forEach(function(character) {
		character.AP.fill();
	});
}

/**
 * Takes the given input and updates the player according to it
 */
AIController.prototype.update = function() {


	return;

}