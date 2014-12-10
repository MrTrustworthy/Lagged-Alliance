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
			this.map.get(qp.getRandomInt(0, 50), qp.getRandomInt(0, 50)).placeContent(obj);
		} catch (e) {
			console.warn("Can't place tree here:", e);
		}
	}

	console.log("Finished Map loading", this.map);

}

//------------------------------------------------------------------------------
//----------------------Unit Movement-------------------------------------------
//------------------------------------------------------------------------------

/**
 * Calculates a path
 */
GameWorld.prototype.moveTo = function(actor, target) {
	var path;

	try {
		path = this.map.findPath(actor.placedOn, target);
	} catch (e) {
		if (!supressWarning) console.error("no path could be found");
		return;
	}

	if (path.length > 0) {

		this._moveAlongPath(
			actor,
			path,
			//update
			function(actor, field) {

				console.log("field reached", field.fieldType);
				return !(field.fieldType.name === "water");
			},
			//ondone
			function() {
				console.log("end reached");
			});
	}

}



/**
 * moves the object to the next node until it reaches the target node.
 * calls onUpdate after each step and only continues execution if onUpdate
 * returns true. calls onDone at the end.
 */
GameWorld.prototype._moveAlongPath = function(actor, path, onUpdate, onDone) {


	onUpdate = onUpdate instanceof Function ? onUpdate : function() {
		return true
	};
	onDone = onDone instanceof Function ? onDone : function() {
		return true
	};

	var move_to_next = function() {

		//no futher fields available -> end loop
		if (path.length === 1) {
			onDone();

			// go on if there are still fields to move to
		} else {
			var curr_field = path.pop();
			curr_field.removeContent();

			var end_field = path[path.length - 1];

			// call the animation function.
			// if the onUpdate function that gets executed afterwards
			// returns true, we go on
			this._animateMove(actor, end_field, function() {
				var canGoOn = onUpdate(actor, end_field);
				if (canGoOn) move_to_next()
			});


		}

	}.bind(this);

	move_to_next();

}

/**
 * Moves an actor towards a certain point over time. gets called by
 * _moveAlongPath to do the move animation
 */
GameWorld.prototype._animateMove = function(actor, field_b, onDone) {


	//Those two need to be elsewhere
	var speed = 0.3;
	var delay = 20;

	var difference = new THREE.Vector3(0, 0, 0).subVectors(field_b.model.position, actor.model.position);

	var iteration_steps = Math.floor(difference.length()) / speed;
	var i = 0;

	var animateMovement = function() {

		if (i < iteration_steps) {
			actor.model.position.x += difference.x / iteration_steps;
			actor.model.position.y += difference.y / iteration_steps;
			i++;

		} else {
			field_b.placeContent(actor);
			game.scene.removeEventListener("tick", animateMovement);
			onDone();
		}
	}.bind(this);

	game.scene.addEventListener("tick", animateMovement);

}