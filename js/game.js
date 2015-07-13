"use strict";

var Game = function() {

	//constants first

	this.WIDTH = window.innerWidth;
	this.HEIGHT = window.innerHeight - 155;

	var parameters = {
		canvas: document.getElementById("gameCanvas"),
		precision: "highp",
		antialias: true
	};
	this.renderer = new THREE.WebGLRenderer(parameters);

	this.renderer.setSize(this.WIDTH, this.HEIGHT);

	//takes care of resizing the canvas on window resize
	window.onresize = function() {
		this.WIDTH = window.innerWidth;
		this.HEIGHT = window.innerHeight - 155;
		this.renderer.setSize(this.WIDTH, this.HEIGHT);
	}.bind(this);

	// this is the promise of init().
	// calling on this ensures that the DB is always loaded
	this.dbReady = new Database().init();
	this.audio = new Audiomanager();


	this.scene = new THREE.Scene();
	THREE.EventDispatcher.call(this.scene);

	this.loadFPSStats();

	this.textureManager = new TextureManager();
	this.textureManager.loadAllAvailableTextures();

    this.geometryManager = new GeometryManager();
    this.geometryManager.loadAllGeometries();


	this.gameWorld = null;

	this.gameCamera = new GameCamera(this.WIDTH, this.HEIGHT);

	this.inputHandler = new InputHandler();

	this.actionBar = new ActionBar(this);

    this.editMode = true;


    // load first save if available!
	this.dbReady.then(function(database) {
		database.getSavegames().then(function(saves) {
			saves.sort(function(a, b) {
				return b.date - a.date;
			});
			if(!!saves[0]) game.loadSavegame(saves[0].name);
		});
	});

};


//------------------------------------------------------------------------------
//---------------------------Saving and Loading---------------------------------
//------------------------------------------------------------------------------

/**
 * Fetches all savegames from the database
 * and passes the most current with the given name to
 * _loadGame to actually do the loading
 */
Game.prototype.loadSavegame = function(name) {

	game.dbReady.then(function(database) {

		//load all saves from the db, then start up the best one
		database.getSavegames().then(function(saves) {

			var gameSave = saves.filter(function(save) {
				return save.name === name;
			})[0];

			console.info("Trying to load savegame", gameSave);

			// setting camera position
			this.gameCamera.setPosition(gameSave.cameraPosition);

			//loading gameworld
			this.gameWorld && this.gameWorld.deactivateLevel();
			this.gameWorld = GameWorld.deserialize(gameSave.world);

			// start rendering
			if (!this.__renderHandle) this.startGame();

		}.bind(this));
	}.bind(this));
};



/**
 * Saves a Game based on the submitted name
 */
Game.prototype.saveGame = function(name) {

	game.dbReady.then(function(database) {
		var world = GameWorld.serialize(this.gameWorld);

		var save = {
			name: name,
			date: Date.now(),
			world: world,
			cameraPosition: this.gameCamera.getPosition()
		};

		database.saveGame(save);

	}.bind(this));
};

//------------------------------------------------------------------------------
//---------------------------Randomizer-----------------------------------------
//------------------------------------------------------------------------------

/**
 * Creates a randomly generated save-game to be used for testing
 */
Game.prototype.createRandomSaveGame = function(name) {

	console.log("Generating random game:", this);

	game.dbReady.then(function(database) {

		this.gameWorld = new GameWorld(5);
		this.gameWorld.createRandomWorld();

		this.saveGame(name);
	}.bind(this));
};


//------------------------------------------------------------------------------
//---------------------Game Loop functions--------------------------------------
//------------------------------------------------------------------------------

Game.prototype.getLevel = function() {
	return this.gameWorld.activeLevel;
};

Game.prototype.getSelected = function() {
	return this.gameWorld.activeLevel.controllerQ.playerController.selected;
};

/**
 * Switches to the next controller in queue
 */
Game.prototype.endTurn = function() {
	console.log("Switching Turns");

	this.getLevel().controllerQ.endTurn();

};

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

		var input = this.inputHandler.getInput();
		this.gameWorld.activeLevel.controllerQ.update(input);
		this.inputHandler.reset();

		this.renderer.render(this.scene, this.gameCamera.getCamera());

		this.fpsStats.end();
	}.bind(this);

	this.__renderHandle = requestAnimationFrame(renderFunc);
};

/**
 *
 */
Game.prototype.wait = function(seconds) {

	var deferred = new Deferred();
	var currTime = 0;
	var endTime = seconds * 60;

	var waitFunc = function() {
		if (currTime === endTime) {
			this.scene.removeEventListener("tick", waitFunc);
			deferred.resolve();
		}
		currTime++;
    }.bind(this);

	this.scene.addEventListener("tick", waitFunc);
	return deferred.promise;
};

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


};



Game.prototype.loadFPSStats = function() {

	// Three js stats display
	this.fpsStats = new Stats();
	this.fpsStats.setMode(0); // fps
	this.fpsStats.domElement.style.position = 'absolute';
	this.fpsStats.domElement.style.left = '0px';
	this.fpsStats.domElement.style.top = '0px';
	document.body.appendChild(this.fpsStats.domElement);

};