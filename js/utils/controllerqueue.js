var ControllerQ = function() {

	this.state = ControllerQ.STATES.peace;

	this.playerController = new PlayerController();

	this.aiController = new AIController();

	this._queue = [this.playerController, this.aiController];

	this.controllers = {};
	this.controllers[Team.TYPES.player.name] = this.playerController;
	this.controllers[Team.TYPES.enemy.name] = this.aiController;


};

ControllerQ.STATES = {
	"peace": "peace",
	"battle": "battle"
};

ControllerQ.prototype.addTeam = function(team) {

	this.controllers[team.type.name].addTeam(team);

	// whenever an actor dies, we update the battle state again to make sure
	// there are still enemies/players alive to fight on
	team.forEach(function(actor) {
		actor.addEventListener("killed", this.updateBattleState.bind(this));
	}.bind(this));
};

ControllerQ.prototype.removeTeam = function(team) {
	this.controllers[team.type.name].removeTeam(team);

	team.forEach(function(actor) {
		actor.removeEventListener("killed", this.updateBattleState.bind(this));
	}.bind(this));
};

/**
 * This function updates either the playercontroller or all controllers if not in battle
 */
ControllerQ.prototype.update = function(input) {
	if (this.state === ControllerQ.STATES.peace) {
		this._queue.forEach(function(controller) {
			controller.update(input);
		})
	} else if (this.state === ControllerQ.STATES.battle) {
		this._queue[0].update(input);
	} else {
		throw new Error("Something went terribly, terribly wrong");
	}
};

/**
 * returns all AI and Player teams
 */
ControllerQ.prototype.getAllTeams = function() {
	var teams = [];
	Object.keys(this.controllers).forEach(function(key) {
		teams = teams.concat(this.controllers[key].getTeams());
	}.bind(this));
	return teams;
};

/**
 * returns true if we are in battlemode
 */
ControllerQ.prototype.isInBattle = function() {
	return this.state === ControllerQ.STATES.battle;
};

/**
 * Calculates whether there are alive actors for both player and AI
 * and updates the battle mode of this controller & level,
 * including doing things like cancelling all movements etc.
 * this gets called 1. when a level gets loaded
 */
ControllerQ.prototype.updateBattleState = function() {
	console.info("updating battle state");

	// if battle is possible
	if (this.aiController.hasAliveActors() &&
		this.playerController.hasAliveActors()) {

		// we're already in battle, don't do anything
		if (this.state === ControllerQ.STATES.battle) return;

		// we want all actors in all teams to cancel
		// their movement before transitioning into battlemode
		var promises = [];
		this.getAllTeams().forEach(function(team) {
			team.forEach(function(actor) {
				promises.push(actor.abortMovement());
			});
		});

		// when all movement has stopped, trigger battle mode
		Deferred.when.apply(null, promises).then(function() {
			this.startBattleMode();
			console.log("STARTED BATTLE MODE!");
		}.bind(this));



	} else {
		// if we're already at peace, leave it
		if (this.state === ControllerQ.STATES.peace) return;
		this.endBattleMode();
	}

};

/**
 * This just sets the controllerqueues state to BATTLE,
 * so in future "update"-calls, both controllers get updated.
 */
ControllerQ.prototype.startBattleMode = function() {
	this.state = ControllerQ.STATES.battle;
};

/**
 * This sets the STATE of this instance to peace and ends the turn for all actors
 */
ControllerQ.prototype.endBattleMode = function() {
	this.state = ControllerQ.STATES.peace;
	this._queue.forEach(function(controller) {
		controller.endTurn();
	});
};

/**
 * this switches out the currently active controller instance
 */
ControllerQ.prototype.endTurn = function() {

	if (this.state === ControllerQ.STATES.peace) {
		throw new Error("Not in battle, can't end Turn!");
	}

	var current = this._queue.shift();
	this._queue.push(current);

	current.endTurn();
	this._queue[0].startTurn();
};