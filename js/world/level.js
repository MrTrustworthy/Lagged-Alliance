"use strict";

var Level = function(ID) {

	this.ID = ID;

	this.map = null;

	this.ambientLight = new THREE.AmbientLight(0x909090);

	this.aiController = new AIController();

	this.playerTeam = null;

	this.gameObjects = [];

	//contains scripts in the following form:
	// {position: pos, script: script}
	this.worldScripts = [];

}

//------------------------------------------------------------------------------
//---------------------------Show/Hide/De-Serialize-----------------------------
//------------------------------------------------------------------------------

Level.prototype.show = function() {
	game.scene.add(this.ambientLight);
	this.map.show();
	this.aiController.getTeam().forEach(function(actor) {
		actor.show();
	});
	this.gameObjects.forEach(function(object) {
		object.show();
	});
	!!this.playerTeam && this.playerTeam.show();
}

Level.prototype.hide = function() {
	game.scene.remove(this.ambientLight);
	this.map.hide();
	this.aiController.getTeam().forEach(function(actor) {
		actor.hide();
	});
	this.gameObjects.forEach(function(object) {
		object.hide();
	});
	!!this.playerTeam && this.playerTeam.hide()
}


Level.serialize = function(world) {


	var objectList = []
	world.gameObjects.forEach(function(tree) {
		objectList.push(Tree.serialize(tree));
	});

	return {
		ID: world.ID,
		map: GameMap.serialize(world.map),
		team: Team.serialize(world.aiController.getTeam()),
		// actors: actorList,
		objects: objectList
	}

}

Level.deserialize = function(save) {

	var world = new Level(save.ID);
	world.map = GameMap.deserialize(save.map);

	var team = Team.deserialize(save.team);

	world.aiController.switchTeam(team);
	team.setWorld(world);

	team.forEach(function(actor) {
		var field = world.map.get(actor.position.x, actor.position.y);
		actor.placeOn(field, true);
	});

	save.objects.forEach(function(object) {
		var tree = Tree.deserialize(object);
		var field = world.map.get(tree.position.x, tree.position.y);
		tree.placeOn(field);
		world.gameObjects.push(tree);
	});

	// world event scripts
	var flds = world.map.getBorderFields("south", false);
	flds.forEach(function(fld){
		fld.addEventListener("walkOn", function(event){
			if(confirm("Are you sure you want to leave the map?")){
				game.switchMap(-1);
			}
		});
	});


	return world;
}

//------------------------------------------------------------------------------
//----------------------World population----------------------------------------
//------------------------------------------------------------------------------

/**
 * Loads the actors from the game into the world.
 * This is needed for loading another map and drops the
 * player characters from the game.js into the world
 */
Level.prototype.dropInPlayers = function(team) {

	// set ref & backref
	this.playerTeam = team;
	team.setWorld(this);

	team.forEach(function(actor) {
		var field = this.map.get(actor.position.x, actor.position.y);
		actor.worldID = this.ID; // double tap?? na thats important for switchin!
		actor.placeOn(field);
	}.bind(this));
}

/**
 *
 */
Level.prototype.removePlayerTeam = function() {
	this.playerTeam.forEach(function(player) {
		player.placedOn.removeContent();
		player.placedOn = null; //need?
		player.hide();
	});
	var buffer = this.playerTeam;
	this.playerTeam = null;
	return buffer;
}


//------------------------------------------------------------------------------
//---------------------------Randomizer-----------------------------------------
//------------------------------------------------------------------------------

/**
 * Generates a completely random Level.
 */
Level.prototype.createNewRandomWorld = function() {

	//load random map
	this.map = new GameMap(50);
	this.map.loadRandomMap();

	//loading random players
	// var actorList = []
	var team = new Team(this.ID, "AI");
	team.setWorld(this);

	for (var i = 0; i < 3; i++) {
		var randName = (chance.first() + " " + chance.last());
		var actor = new PlayerActor(randName, 1, this.ID, true);
		actor.placeOn(this.map.getFreeField());
		team.addActor(actor);
	}

	this.aiController.switchTeam(team);

	//load random objects
	for (var i = 0; i < 30; i++) {
		var tree = new Tree();
		this.gameObjects.push(tree);
		tree.placeOn(this.map.getFreeField());
	}
}



//------------------------------------------------------------------------------
//----------------------Unit Movement-------------------------------------------
//------------------------------------------------------------------------------

/**
 * Calculates a path, then:
 * moves the object to the next node until it reaches the target node.
 */
Level.prototype.moveTo = function(actor, target) {

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