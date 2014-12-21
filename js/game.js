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
}


/**
 * Starts the game routine
 */
Game.prototype.loadGame = function() {

	console.log("Loading Game:", this);

	this.database.init().then(function(db) {

		this.scene = new THREE.Scene();
		THREE.EventDispatcher.call(this.scene);

		this.loadFPSStats();

		this.textureManager = new TextureManager();
		this.textureManager.loadAllAvailableTextures();

		this.playerController = new PlayerController();
		this.playerController.loadController();

		this.aiController = new AIController();

		this.controllerQueue = [this.playerController, this.aiController];


		for (var i = 0; i < 4; i++) {

			var randomName = Math.random().toString(36).substring(4);
			var params = {
				healthbarColor: 0x3311cc
			}
			var player = new PlayerActor(randomName, params);
			this.playerController.addActor(player);
		}



		for (var i = 0; i < 2; i++) {
			var randomName = Math.random().toString(36).substring(4);
			var params = {
				healthbarColor: 0xcc1133
			}
			var player = new PlayerActor(randomName, params);
			this.aiController.addActor(player);
		}


		this.world = new GameWorld();


		// Loads the first map if available, else creates a new one
		this.database.getMapList().then(function(mapList) {

			this.world.createWorld(mapList[0]);

			this.world.loadActors(this.playerController, this.aiController);

			this.world.loadObjects(40);

			this.startGame();

		}.bind(this));



	}.bind(this));


}

/**
* Switches to the next controller in queue
*/
Game.prototype.endTurn = function(){

	console.log("Switching Turns");

	var old = this.controllerQueue.shift();
	this.controllerQueue.push(old);
	this.controllerQueue[0].startTurn();
}

/**
* Utility function to fade out and delete
* an object from the game.
* ONLY USEABLE FOR THREE.JS MESHES!!!
*/
Game.prototype.fadeOut = function(object, seconds){
	seconds = seconds || 3;
	var frames = seconds * 60;
	var currentFrame = 0;

	object.material.transparent = true;
	object.material.opacity = 1.0;

	var fadeoutFunc = function(){
		if(currentFrame === frames){
			this.scene.removeEventListener("tick", fadeoutFunc);
			this.scene.remove(object);
			return;
		}

		object.material.opacity -= 1/frames;
		currentFrame++;

	}.bind(this);

	this.scene.addEventListener("tick", fadeoutFunc);

	object.children.forEach(function(child){
		this.fadeOut(child, seconds);
	}.bind(this));


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

		this.fpsStats.end();

		this.renderer.render(this.scene, this.playerController.camera);

	}.bind(this);

	renderFunc();
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