/**
 * The player controller gets initialized and filled with players
 * BEFORE the world is created!
 */
var PlayerController = function() {

	this.team = null;

	this.camera = null;

	this.inputHandler = null;

	this.actionBar = null;

	this.selected = null;
}

/**
 * Loads the camera, the input handler and the action bar
 * which is all used to represent a players intention
 */
PlayerController.prototype.loadController = function() {


	this.camera = new GameCamera();

	this.inputHandler = new InputHandler();

	this.actionBar = new ActionBar();
}

/**
 * adds a playeractor to this instance
 */
PlayerController.prototype.switchTeam = function(team) {
	this.team = team;
}

/**
 * removes all actors for cleanup purposes
 */
PlayerController.prototype.removeTeam = function() {
	this.deselect();
	this.team = null;
}

/**
 * returns all actors in a list
 */
PlayerController.prototype.getTeam = function() {
	return this.team;
}

/**
 * Function that gets executed at the start of a turn
 */
PlayerController.prototype.startTurn = function() {

	//discard the input that happened in absence
	this.inputHandler.getInput();

	this.camera.loadPosition("playerController");
}

/**
 * Function that gets executed at the start of a turn
 */
PlayerController.prototype.endTurn = function() {
	this.team.forEach(function(character) {
		character.AP.fill();
	});
	this.camera.savePosition("playerController");
}



/**
 * sets a given item as "selected"
 */
PlayerController.prototype.select = function(actor) {

	if (!actor) throw new Error("No item to set selected");

	this.selected = actor;
	//var info = (this.isMember(actor) ? actor.name : "Enemy " + actor.name) + " - " + actor.actionPoints.toString();
	this.actionBar.select(actor);

}


/**
 * Removes the current selection
 */
PlayerController.prototype.deselect = function() {
	this.selected = null;
	this.actionBar.select(null);
}


/**
 * Takes the given input and updates the player according to it
 */
PlayerController.prototype.update = function() {

	var input = this.inputHandler.getInput();

	if (input.scroll !== 0) {
		var i = 0;
		var scrollFunc = function() {
			if (i === 15) {
				game.scene.removeEventListener("tick", scrollFunc);
			}
			this.camera.move(0, 0, -input.scroll / 2);
			i++;
		}.bind(this);
		game.scene.addEventListener("tick", scrollFunc);
	}

	switch (input.state) {

		// when nothing was clicked and the mouse is just moving around
		case input.states.DEFAULT:
			if (!!this.selected && this.isMember(this.selected)) {
				var objects = this._getObjectsOnMousePos(input.currMousePos);
				var field = this._checkForField(objects);
				if (!!field) {
					try {
						var path = game.world.map.findPath(this.selected.placedOn, field);
						path.forEach(function(element, index) {
							element.blink(20);
						});
					} catch (e) {
						console.warn("no path to display");
					}
				}
			}
			break;

		case input.states.RIGHTCLICKED:
			this.deselect();
			break;

		case input.states.DRAGGING:
			var difference = input.currMousePos.diff(input.lastMousePos);
			this.camera.move(difference.x / 10, -difference.y / 10, 0);
			break;

		case input.states.CLICKED:

			var objects = this._getObjectsOnMousePos(input.currMousePos);
			var actor = this._checkForActors(objects);
			var field = this._checkForField(objects);

			//this is where we actually do something

			//if we don't have anything selected right now
			if (!this.selected) {

				if (!!actor) this.select(actor);
				else this.deselect();

				// if we have something selected already,
				// we need to check if that actor belongs to us 
			} else if (!!this.selected) {

				//if the currently selected item belongs to us
				if (this.isMember(this.selected)) {

					// if we clicked on an actor
					if (!!actor && actor.isAlive) {

						//ATTACK!
						if (!this.isMember(actor)) {
							this.selected.attack(actor);
						} else {
							this.select(actor);
						}

						//if we clicked just on a field
					} else if (!!field) {
						game.world.moveTo(this.selected, field);
						this.deselect();
					} else {
						//????
					}
				} else {
					this.deselect();
				}
			}
			break;
	}

	this.inputHandler.reset();

}

/**
 * checks whether the passed actor is registered here
 */
PlayerController.prototype.isMember = function(actor) {

	var isMember = false;
	this.team.forEach(function(element, index) {
		if (element.name === actor.name) isMember = true;
	});

	return isMember;
}


/**
 * checks if an actor can be found in the given gameobjects and returns it
 */
PlayerController.prototype._checkForActors = function(gameObjects) {

	actors = [];
	gameObjects.forEach(function(element, index) {

		if (element instanceof PlayerActor) {

			actors.push(element);

		} else if (element instanceof Field &&
			!!element.occupant &&
			element.occupant instanceof PlayerActor) {

			actors.push(element.occupant);
		}
	}.bind(this));

	return actors[0];
}

/**
 * checks if a field can be found in the given gameobjects and returns it
 */
PlayerController.prototype._checkForField = function(gameObjects) {

	fields = [];
	gameObjects.forEach(function(element, index) {
		if (element instanceof Field) {
			fields.push(element);
		}
	});

	return fields[0];
}


/**
 * Returns all elements under a given mouse-position
 */
PlayerController.prototype._getObjectsOnMousePos = function(position) {

	var magicVector = new THREE.Vector3(
		(position.x / game.WIDTH) * 2 - 1, -(position.y / game.HEIGHT) * 2 + 1,
		0.5
	).unproject(this.camera.getCamera()).sub(this.camera.getPosition()).normalize();


	var ray = new THREE.Raycaster(
		this.camera.getPosition(),
		magicVector,
		0,
		5000
	);

	var selectedElements = [];

	// determine collisions
	ray.intersectObjects(game.scene.children).forEach(function(element, index) {
		selectedElements.push(element.object.userData);
	});

	// return the results
	return selectedElements
}