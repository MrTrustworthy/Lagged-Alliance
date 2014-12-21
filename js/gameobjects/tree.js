"use strict";

var Tree = function() {


	this.model = this.generateModel();

	//should get changed by the fields
	this.placedOn = null;

	this.isActor = false;

	this.type = "tree"
	this.name = "Tree";

}

Tree.prototype = Object.create(GameObject.prototype);

Tree.prototype.generateModel = function() {

	var geometry = new THREE.BoxGeometry(2, 2, 14);
	var material = game.textureManager.getTexture("tree");

	var model = new THREE.Mesh(geometry, material);

	model.position.x = 0;
	model.position.y = 0;
	model.position.z = 7;

	model.userData = this;

	game.scene.add(model);

	return model;


}