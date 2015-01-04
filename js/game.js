"use strict";

var Game = function() {

	//constants first

	this.WIDTH = window.innerWidth;
	this.HEIGHT = window.innerHeight - 155;

	var parameters = {
		precision: "highp",
		antialias: true,
	}
	this.renderer = new THREE.WebGLRenderer(parameters);
	this.renderer.setSize(this.WIDTH, this.HEIGHT);
	document.body.appendChild(this.renderer.domElement);

	this.database = new Database();
	// this is the promise of init().
	// calling on this ensures that the DB is always loaded
	this.dbReady = this.database.init();


	this.scene = new THREE.Scene();
	THREE.EventDispatcher.call(this.scene);

	this.loadFPSStats();

	this.textureManager = new TextureManager();
	this.textureManager.loadAllAvailableTextures();

	//o boy
	this._worlds = [];
	this.world = null;

	this.teams = [];

}

/**
 * Initializes the most important Variables.
 * Assumes that a world was already loaded before.
 */
Game.prototype.init = function() {
	this.playerController = new PlayerController();
	this.playerController.loadController();
}

/**
 * switches the world
 */
Game.prototype.switchMap = function(direction) {
	console.log("Switching map");

	this.moveTeam(direction);

	var newID = this.world.ID + direction;

	this.world.hide();
	this.world = this._worlds[newID];

	this.playerController.removeTeam();
	this.playerController.switchTeam(this.world.playerTeam);

	this.controllerQueue = [this.playerController, this.world.aiController];
	this.world.show();
}

/**
* moves a team from the current world towards a world in the
* given direction (-1/1).
*/
Game.prototype.moveTeam = function(direction) {
	var team = this.world.removePlayerTeam();
	var destination = this._worlds[this.world.ID + direction];

	var freeFields = destination.map.getBorderFields(direction > 0 ? "south" : "north", true);
	freeFields = chance.shuffle(freeFields);

	//puts the actors onto the border fields
	team.forEach(function(actor, i){
		actor.position = freeFields.shift().position.clone();
	});

	destination.dropInPlayers(team);
}


//------------------------------------------------------------------------------
//---------------------------Saving and Loading---------------------------------
//------------------------------------------------------------------------------

/**
 * Fetches all savegames from the database
 * and passes the most current with the given name to
 * _loadGame to actually do the loading
 */
Game.prototype.loadSavegame = function(name) {

	game.dbReady.then(function() {

		//load all saves from the db, then start up the best one
		this.database.getSavegames().then(function(saves) {

			var gameSave = saves.filter(function(save) {
				return save.name === name;
			})[0];

			console.info("Trying to load savegame", gameSave);

			//hide world
			if (!!this.world) this.world.hide();


			//remove old players (if there are) and load new ones
			this.playerController.removeTeam();

			//remove old worlds and load new ones
			this._worlds = [];
			this.teams = [];

			//loads new worlds
			gameSave.worlds.forEach(function(worldSave) {
				this._worlds.push(GameWorld.deserialize(worldSave));
			}.bind(this));


			// loads teams and places them into the worlds
			gameSave.teams.forEach(function(teamSave) {

				var team = Team.deserialize(teamSave);
				this.teams.push(team);

				var teamWorld = this._worlds[team.worldID];
				//sets backref too
				teamWorld.dropInPlayers(team);
			}.bind(this));


			this.world = this._worlds[gameSave.currentWorldID];

			// var worldTeam = this.world.playerTeam || new Team()

			this.playerController.switchTeam(this.world.playerTeam);

			// "this.world" is the world with the last team on it.
			this.world.show();

			this.controllerQueue = [this.playerController, this.world.aiController];

			// if there is not already a render-loop in progress, start it now
			if (!this.__renderHandle) this.startGame();


		}.bind(this));
	}.bind(this));
}



/**
 * Saves a Game based on the submitted name
 */
Game.prototype.saveGame = function(name) {

	game.dbReady.then(function() {

		var teamList = [];
		this.teams.forEach(function(team) {
			teamList.push(Team.serialize(team));
		});

		var worldList = [];
		this._worlds.forEach(function(world) {
			worldList.push(GameWorld.serialize(world));
		});

		var save = {
			name: name,
			date: Date.now(),
			worlds: worldList,
			currentWorldID: this.world.ID,
			teams: teamList
		}

		this.database.saveGame(save);

	}.bind(this));
}

//------------------------------------------------------------------------------
//---------------------------Randomizer-----------------------------------------
//------------------------------------------------------------------------------

/**
 * Creates a randomly generated save-game to be used for testing
 */
Game.prototype.createRandomSaveGame = function(name) {

	console.log("Generating random game:", this);

	game.dbReady.then(function() {
		this.playerController = new PlayerController();

		console.log("creating new worlds");
		for (var i = 0; i < 5; i++) {
			var world = new GameWorld(i);
			world.createNewRandomWorld();
			this._worlds.push(world);
		}

		this.world = this._worlds[2];

		//TODO load
		var team = new Team(this.world.ID, "Player");
		this.teams.push(team);


		for (var i = 0; i < 4; i++) {
			var randName = (chance.first() + " " + chance.last());
			var player = new PlayerActor(randName, 0, 1, true);
			team.addActor(player);
			var fld = this.world.map.getFreeField();
			player.position = fld.position.clone();
		}

		this.world.dropInPlayers(team);

		this.saveGame(name);
	}.bind(this));
}


//------------------------------------------------------------------------------
//---------------------Game Loop functions--------------------------------------
//------------------------------------------------------------------------------

/**
 * Switches to the next controller in queue
 */
Game.prototype.endTurn = function() {

	console.log("Switching Turns");

	var old = this.controllerQueue.shift();
	old.endTurn();

	this.controllerQueue.push(old);
	this.controllerQueue[0].startTurn();
}

/**
 * This is the render-loop that is responsible for
 * re-drawing the scene and processing the game loop
 */
Game.prototype.startGame = function() {

	var renderFunc = function() {

		this.fpsStats.begin();

		requestAnimationFrame(renderFunc);

		this.scene.dispatchEvent({
			type: "tick"
		});

		this.controllerQueue[0].update();

		this.renderer.render(this.scene, this.playerController.camera.getCamera());

		this.fpsStats.end();
	}.bind(this);

	this.__renderHandle = requestAnimationFrame(renderFunc);
}



/**
 * Utility function to fade out and delete
 * an object from the game.
 * ONLY USEABLE FOR THREE.JS MESHES!!!
 */
Game.prototype.fadeOut = function(object, seconds) {
	seconds = seconds || 3;
	var frames = seconds * 60;
	var currentFrame = 0;

	object.material.transparent = true;
	object.material.opacity = 1.0;

	var fadeoutFunc = function() {
		if (currentFrame === frames) {
			this.scene.removeEventListener("tick", fadeoutFunc);
			this.scene.remove(object);
			return;
		}

		object.material.opacity -= 1 / frames;
		currentFrame++;

	}.bind(this);

	this.scene.addEventListener("tick", fadeoutFunc);

	object.children.forEach(function(child) {
		this.fadeOut(child, seconds);
	}.bind(this));


}



Game.prototype.loadFPSStats = function() {

	// Three js stats display
	this.fpsStats = new Stats();
	this.fpsStats.setMode(0); // fps
	this.fpsStats.domElement.style.position = 'absolute';
	this.fpsStats.domElement.style.left = '0px';
	this.fpsStats.domElement.style.top = '0px';
	document.body.appendChild(this.fpsStats.domElement);

}