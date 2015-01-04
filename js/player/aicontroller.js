/**
 * The player controller gets initialized and filled with players
 * BEFORE the world is created!
 */
var AIController = function() {


}

AIController.prototype = Object.create(PlayerController.prototype);



/**
 * Takes the given input and updates the actor according to it
 */
AIController.prototype.startTurn = function() {

		//cloning the list
		var charList = this.team.filter(function(actor) {
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

	this.team.forEach(function(character) {
		character.AP.fill();
	});
}

/**
 * Takes the given input and updates the player according to it
 */
AIController.prototype.update = function() {


	return;

}