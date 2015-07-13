var GameWorld = function(size) {

	//this map contains all levels
	Map2D.apply(this, [size]);

	this.activeLevel = null;

	this.teams = [];

	this.mapDialog = new MapDialog(this);
    this.inventoryDialog = new InventoryDialog(this);
};

GameWorld.prototype = Object.create(Map2D.prototype);


/**
 *
 * @param gameWorld
 * @returns {{size: *, levels: Array, teams: Array, activeLevelPos: (Tree.serialize.position|*|Level.serialize.position|Field.serialize.position|Actor.serialize.position|CSSStyleDeclaration.position)}}
 */
GameWorld.serialize = function(gameWorld) {

	var levelList = [];
	gameWorld.forEach(function(level) {
		levelList.push(Level.serialize(level));
	});

	var teamList = [];
	gameWorld.teams.forEach(function(team) {
		teamList.push(Team.serialize(team));
	});

	var active = gameWorld.activeLevel ? gameWorld.activeLevel.position : null;

	return {
		size: gameWorld.length,
		levels: levelList,
		teams: teamList,
		activeLevelPos: active
	};
};

/**
 *
 * @param save
 * @returns {GameWorld}
 */
GameWorld.deserialize = function(save) {

	var world = new GameWorld(save.size);
	save.levels.forEach(function(lvl) {
		world._map[lvl.position.x][lvl.position.y] = Level.deserialize(lvl);
	});

	//if (!!save.activeLevelPos) world.activeLevel = world.get(save.activeLevelPos);

	save.teams.forEach(function(team) {
		world.addTeamToWorld(Team.deserialize(team));
	}.bind(this));

	if (!!save.activeLevelPos) world.activateLevel(world.get(save.activeLevelPos));

	return world;
};

//------------------------------------------------------------------------------
//---------------------------Standart functions---------------------------------
//------------------------------------------------------------------------------

/**
 *
 * @param level
 */
GameWorld.prototype.activateLevel = function(level) {
	if (!!this.activeLevel) this.deactivateLevel();

	this.activeLevel = level;
	this.activeLevel.show();
	this.activeLevel.controllerQ.updateBattleState();

	console.log("Moved to Map:" + this.activeLevel.position.x + ":" + this.activeLevel.position.y);
};

/**
 * hides the currently selected level
 */
GameWorld.prototype.deactivateLevel = function() {
	if (!!this.activeLevel) this.activeLevel.hide();
	this.activeLevel = null;

};

/**
 *
 * @param position
 */
GameWorld.prototype.switchToMap = function(position) {
	game.actionBar.select(null);
	this.activateLevel(this.get(position));
};

/**
 *
 * @param team
 * @param position
 */
GameWorld.prototype.moveTeam = function(team, position) {

	var origin = team.getLevel();
	var target = this.get(position);

	var border = qp.calculateEntryVector(origin.position, target.position);

	origin.removeTeam(team);
	target.addTeam(team, border.name);
};


/**
 *  This gets called when loading/creating random
 * @param team
 */
GameWorld.prototype.addTeamToWorld = function(team) {

	// if there is no _levelPosition on the team, it was randomly
	// created and needs a random level to be put into
	var lvl;
	if (!team._levelPosition) lvl = this.getRandom();
	else lvl = this.get(team._levelPosition);


	console.info("adding team", team, "into", lvl);

	lvl.addTeam(team);

	this.teams.push(team);
};

/**
 * Creates a random world
 */
GameWorld.prototype.createRandomWorld = function() {
	this.forEach(function(element, x, y) {
		var level = new Level(new Position(x, y));
		level.createRandomLevel();
		this._map[x][y] = level;
	}.bind(this));

	for (var i = 0; i < 10; i++) {
		var team = new Team();
		team.createRandomTeam();
		this.addTeamToWorld(team);
	}
	this.activateLevel(this.getRandom());
};