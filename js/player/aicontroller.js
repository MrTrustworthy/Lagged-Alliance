

/**
* The player controller gets initialized and filled with players
* BEFORE the world is created!
*/
var AIController = function() {

	this.characters = [];

	this.hasTriggered

}



/**
 * adds a random playeractor to the game
 */
AIController.prototype.addActor = function(player) {

	this.characters.push(player);
}

/**
 * Takes the given input and updates the player according to it
 */
AIController.prototype.startTurn = function() {

	setTimeout(function(){
		game.endTurn();
	}, 1500);
	return;

}

/**
 * Takes the given input and updates the player according to it
 */
AIController.prototype.update = function() {

	
	return;

}

