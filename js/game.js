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

}

/**
 * Initializes the most important Variables.
 * Assumes that a world was already loaded before.
 */
Game.prototype.init = function() {
	this.playerController = new PlayerController();
	this.playerController.loadController();
}


Game.prototype.switchMap = function(amount){
	console.log("Switching map");


	var newID = this.world.ID + amount;

	var newWorld = this._worlds.filter(function(world) {
		return world.ID === newID;
	})[0];

	this.world.cleanUp();

	this.world = newWorld;

	this.playerController.getActors().forEach(function(actor) {
		this.world.dropInPlayer(actor);
	}.bind(this));

	this.controllerQueue = [this.playerController, this.world.aiController];
	this.world.show();


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

			var correctNameSaves = saves.filter(function(save) {
				return save.name === name;
			});
			//this._loadGame(correctNameSaves[0]);

			var gameSave = correctNameSaves[0];

			console.info("Trying to load savegame", gameSave);

			//hide world
			if (!!this.world) this.world.cleanUp();


			//remove old worlds and load new ones
			this._worlds = [];
			gameSave.worlds.forEach(function(worldSave) {
				this._worlds.push(GameWorld.deserialize(worldSave));
			}.bind(this));


			//remove old players and load new ones
			if (!this.playerController) {

				this.playerController = new PlayerController();
				this.playerController.loadController();
			}
			this.playerController.removeActors();

			gameSave.players.forEach(function(actorSave) {

				var actor = PlayerActor.deserialize(actorSave);
				this.playerController.addActor(actor);
				this.world = this._worlds[actor.worldID];

				//todo hmmm this function is weird
				this.world.dropInPlayer(actor);


			}.bind(this));



			this.controllerQueue = [this.playerController, this.world.aiController];
			this.world.show();

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
		// this basically serializes the current game state
		var actorList = [];
		this.playerController.getActors().forEach(function(actor) {
			actorList.push(PlayerActor.serialize(actor));
		});

		var worldList = [];
		this._worlds.forEach(function(world) {
			worldList.push(GameWorld.serialize(world));
		});

		var save = {
			name: name,
			date: Date.now(),
			worlds: worldList,
			players: actorList
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

		//TODO load
		for (var i = 0; i < 4; i++) {
			var player = new PlayerActor(null, 0, 1);
			this.playerController.addActor(player);
			this._worlds[2].dropInPlayer(player, this._worlds[2].map.getFreeField());
		}

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

	this.hasAlreadyLoadedGame = true;

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