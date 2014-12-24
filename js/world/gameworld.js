"use strict";

var GameWorld = function(ID) {

	this.ID = ID;

	this.map = null;

	this.ambientLight = new THREE.AmbientLight(0x909090);

	this.aiController = new AIController();

	this._playerRefs = [];

}

//------------------------------------------------------------------------------
//---------------------------Show/Hide/De-Serialize-----------------------------
//------------------------------------------------------------------------------

GameWorld.prototype.show = function() {
	game.scene.add(this.ambientLight);
	this.map.show();
	this.aiController.getActors().forEach(function(actor) {
		actor.show();
	});
	this._playerRefs.forEach(function(actor) {
		actor.show();
	});
}

GameWorld.prototype.hide = function() {
	game.scene.remove(this.ambientLight);
	this.map.hide();
	this.aiController.getActors().forEach(function(actor) {
		actor.hide();
	});
	this._playerRefs.forEach(function(actor) {
		actor.hide();
	});
}


GameWorld.serialize = function(world) {

	//serialize all ai-actors
	var actorList = [];
	world.aiController.getActors().forEach(function(actor) {
		actorList.push(PlayerActor.serialize(actor));
	});

	return {
		ID: world.ID,
		map: GameMap.serialize(world.map),
		actors: actorList
	}

}

GameWorld.deserialize = function(save) {

	var world = new GameWorld(save.ID);
	world.map = GameMap.deserialize(save.map);

	save.actors.forEach(function(actorSave) {
		var actor = PlayerActor.deserialize(actorSave);
		var field = world.map.get(actor.position.x, actor.position.y);
		actor.placeOn(field, true);
		world.aiController.addActor(actor);
	});
	return world; 
}

//------------------------------------------------------------------------------
//----------------------World population----------------------------------------
//------------------------------------------------------------------------------

/**
 * Loads the actors from the game into the world
 */
GameWorld.prototype.dropInPlayer = function(actor) {

	var field = this.map.get(actor.position.x, actor.position.y);
	actor.worldID = this.ID; // double tap?? na thats important for switchin!
	this._playerRefs.push(actor);
	actor.placeOn(field);

}

/**
 * cleanup for this world. removes player references etc.
 */
GameWorld.prototype.cleanUp = function() {

	this._playerRefs.forEach(function(player){
		player.placedOn.removeContent();
	});
	this.hide();
	this._playerRefs = [];


}
//------------------------------------------------------------------------------
//---------------------------Randomizer-----------------------------------------
//------------------------------------------------------------------------------

/**
 * Generates a completely random gameworld.
 */
GameWorld.prototype.createNewRandomWorld = function() {

	//load random map
	this.map = new GameMap(50);
	this.map.loadRandomMap();

	//loading random players
	var actorList = []
	for (var i = 0; i < 3; i++) {
		var actor = new PlayerActor(null, 1, this.ID, true);
		actorList.push(actor);
		actor.placeOn(this.map.getFreeField());
		this.aiController.addActor(actor);
	}

	// //load random objects
	// for (var i = 0; i < 30; i++) {
	// 	var obj = new Tree();
	// 	var fld = this.map.getFreeField();

	// 	fld.placeContent(obj);
	// 	obj.model.position.x = fld.model.position.x;
	// 	obj.model.position.y = fld.model.position.y;
	// }
}







//------------------------------------------------------------------------------
//----------------------Unit Movement-------------------------------------------
//------------------------------------------------------------------------------

/**
 * Calculates a path, then:
 * moves the object to the next node until it reaches the target node.
 */
GameWorld.prototype.moveTo = function(actor, target) {

	var deferred = new Deferred();

	var path;

	try {
		path = this.map.findPath(actor.placedOn, target);
	} catch (e) {
		console.warn("no path could be found");
		deferred.resolve();
	}


	var move_to_next = function() {

		//no futher fields available -> end loop
		if (path.length === 1) {
			deferred.resolve();
			return;
		}

		// go on if there are still fields to move to
		var curr_field = path.pop();
		curr_field.removeContent();
		var end_field = path[path.length - 1];

		// call the animation function.
		actor.moveToField(end_field).then(move_to_next, function() {
			deferred.resolve();
		});
	}.bind(this);


	// do i need to force this async??
	if (path.length === 0) deferred.resolve();
	else move_to_next();

	return deferred.promise;

}