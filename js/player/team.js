var Team = function(worldID, type) {

	//gets set from the game based on the worldID
	this.world = null;

	this.type = type;

	this.worldID = worldID;

	this._actors = [];
}

Team.serialize = function(team) {

	var actorList = [];
	team._actors.forEach(function(actor) {
		actorList.push(PlayerActor.serialize(actor));
	});

	return {
		//game needs to make sure to connect id->world
		worldID: team.world.ID,
		type: team.type,
		actors: actorList
	}
}

Team.deserialize = function(save) {
	var team = new Team(save.worldID, save.type);
	save.actors.forEach(function(actorSave) {
		team.addActor(PlayerActor.deserialize(actorSave));
	});
	return team;
}

Team.prototype.show = function() {
	this.forEach(function(element, index) {
		element.show();
	});
}

Team.prototype.hide = function() {
	this.forEach(function(element, index) {
		element.hide();
	});
}

/**
 * Um ok
 */
Team.prototype.forEach = function(func) {
	this._actors.forEach(function(element, index) {
		func(element, index);
	});
}

Team.prototype.filter = function(func) {
	return this._actors.filter(func);
}

Team.prototype.setWorld = function(world) {
	this.world = world;
	this.worldID = this.world.ID;
}

Team.prototype.getWorld = function() {
	return this.world;
}

Team.prototype.addActor = function(actor) {

	this._actors.push(actor);
	actor.team = this;
}

Team.prototype.removeActor = function(actor) {
	throw new Error("todo");
}

Team.prototype.getActors = function(argument) {
	return this._actors;
}