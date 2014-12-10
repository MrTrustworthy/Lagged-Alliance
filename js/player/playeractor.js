"use strict";

var PlayerActor = function(name) {


	this.model = this.generateModel();

	//should get changed by the fields
	this.placedOn = null;

	this.name = name;

}

PlayerActor.prototype = Object.create(GameObject.prototype);

PlayerActor.prototype.generateModel = function() {

	// var geometry = new THREE.CylinderGeometry(1, 1, 5, 32, 1, false);

	var geometry = new THREE.BoxGeometry(4, 10, 4, 1, 1, 1);

	var material = game.textureManager.getTexture("player");

	var model = new THREE.Mesh(geometry, material);

	model.position.x = 0;
	model.position.y = 0;
	model.position.z = 5;

	model.rotateX(Math.PI / 2);

	model.userData = this;

	game.scene.add(model);

	return model;


}