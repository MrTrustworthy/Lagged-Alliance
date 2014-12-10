var PlayerController = function() {

	this.playerCharacters = [];

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


	this.camera = new THREE.PerspectiveCamera(75, game.WIDTH / game.HEIGHT, 0.1, 1000);
	this.camera.position.x = 70;
	this.camera.position.y = 0;
	this.camera.position.z = 70;
	this.camera.rotateX(1 / 3);

	this.inputHandler = new InputHandler();

	this.actionBar = new ActionBar();
}


/**
 * adds a random playeractor to the game
 */
PlayerController.prototype.addPlayer = function() {

	var player = new PlayerActor("one");
	game.world.map.getRandomField().placeContent(player);
	this.playerCharacters.push(player);
}

/**
 * sets a given item as "selected"
 */
PlayerController.prototype.select = function(element) {

	if (element) {

		this.selected = element;
		this.actionBar.select(element.name);
	} else {
		throw new Error("No item to set selected");
	}

}

/**
 * Removes the current selection
 */
PlayerController.prototype.deselect = function() {
	this.selected = null;
	this.actionBar.select("Nothing");
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
			this.camera.position.z -= input.scroll;
			i++;
		}.bind(this);
		game.scene.addEventListener("tick", scrollFunc);
	}

	switch (input.state) {

		case input.states.DEFAULT:
			if (!!this.selected) {
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
			this.camera.position.x += difference.x / 10;
			this.camera.position.y -= difference.y / 10;
			break;

		case input.states.CLICKED:
			var objects = this._getObjectsOnMousePos(input.currMousePos);
			var actor = this._checkForActors(objects);

			if (!!actor) {
				this.select(actor);
			} else if (!!this.selected) {
				var field = this._checkForField(objects);
				if (!!field) {
					game.world.moveTo(this.selected, field);
					this.deselect();
				}
			}
			break;
	}

	this.inputHandler.reset();

}

/**
 * checks if an actor can be found in the given gameobjects and returns it
 */
PlayerController.prototype._checkForActors = function(gameObjects) {

	actors = [];
	gameObjects.forEach(function(element, index) {
		if (element.type === "actor") {
			actors.push(element);
		} else if (element instanceof Field &&
			!!element.occupant &&
			element.occupant instanceof PlayerActor) {

			actors.push(element.occupant);
		}
	});

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
	).unproject(this.camera).sub(this.camera.position).normalize();


	var ray = new THREE.Raycaster(
		this.camera.position,
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