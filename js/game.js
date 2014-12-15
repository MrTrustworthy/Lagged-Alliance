"use strict";

var Game = function() {

	//constants first

	this.WIDTH = window.innerWidth;
	this.HEIGHT = window.innerHeight - 155;

	this.database = new Database();


	var parameters = {
		precision: "highp",
		antialias: true,
	}
	this.renderer = new THREE.WebGLRenderer(parameters);
	this.renderer.setSize(this.WIDTH, this.HEIGHT);
	document.body.appendChild(this.renderer.domElement);
}


/**
 * Starts the game routine
 */
Game.prototype.loadGame = function() {

	console.log("Loading Game:", this);

	this.database.init().then(function(db){

		this.scene = new THREE.Scene();
		THREE.EventDispatcher.call(this.scene);

		this.loadFPSStats();

		this.textureManager = new TextureManager();
		this.textureManager.loadAllAvailableTextures();

		this.playerController = new PlayerController();
		this.playerController.loadController();

		this.world = new GameWorld();
		this.world.createWorld();

		this.startGame();

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

		this.playerController.update();

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