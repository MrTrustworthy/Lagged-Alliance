"use strict";

var GameWorld = function() {

	this.map = null;

	this.ambientLight = null;


}

GameWorld.objAmount = 50;

/**
 * Creates the gameworld
 */
GameWorld.prototype.createWorld = function(blueprint) {

	// if there has been a map loaded previously, 
	// remove everything from the scene before loading
	if (!!this.map) game.scene.children = [];

	this.ambientLight = new THREE.AmbientLight(0x909090);

	game.scene.add(this.ambientLight);

	this.map = new GameMap(50);

	if (!!blueprint) this.map.loadMapFromBlueprint(blueprint);
	else this.map.loadRandomMap();

}

//------------------------------------------------------------------------------
//----------------------World population----------------------------------------
//------------------------------------------------------------------------------

/**
 * Loads the actors from the given controllers into the game
 */
GameWorld.prototype.loadActors = function(playerController, aiController) {

	var objs = playerController.characters.concat(aiController.characters);

	objs.forEach(function(actor) {
		actor.placeOn(this.map.getFreeField(), true);
	}.bind(this));

}




GameWorld.prototype.loadObjects = function(amount) {

	for (var i = 0; i < amount; i++) {
		var obj = new Tree();
		var fld = this.map.getFreeField();

		fld.placeContent(obj);
		obj.model.position.x = fld.model.position.x;
		obj.model.position.y = fld.model.position.y;
	}

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
		console.warn("no path could be found");
		return;
	}

	if (path.length === 0) return;

	this._moveAlongPath(
		actor,
		path,
		//ondone
		function() {
			console.log("end reached");
		},
		//update needs to return true or we cancel it.
		function(actor, field) {

			console.log("field reached", field.fieldType);
			return !(field.fieldType.name === "water");
		},
		function() {
			console.log("path aborted");
		});


}



/**
 * moves the object to the next node until it reaches the target node.
 * calls onUpdate after each step and only continues execution if onUpdate
 * returns true. calls onDone at the end.
 */
GameWorld.prototype._moveAlongPath = function(actor, path, onDone, onUpdate, onCancel) {


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
			actor.moveToField(end_field).then(function() {

				var canGoOn = onUpdate(actor, end_field);
				if (canGoOn) move_to_next();
				else onCancel();

			});
		}

	}.bind(this);

	move_to_next();

}