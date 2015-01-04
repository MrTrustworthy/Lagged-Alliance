"use strict";

var Tree = function() {


	this.model = null;

	this.position = null;

	this.placedOn = null;

}

Tree.serialize = function(tree){
	return {
		position: tree.position
	}
}

Tree.deserialize = function(save){
	var tree = new Tree();
	tree.position = new Position(save.position.x, save.position.y);
	return tree;
}


Tree.prototype = Object.create(GameObject.prototype);

Tree.prototype.show = function() {
	if (!this.model) {
		this.generateModel();
		this.updateModel();
		game.scene.add(this.model);
	}
}

Tree.prototype.hide = function() {
	game.scene.remove(this.model);
	this.model = null;
}

Tree.prototype.placeOn = function(target) {

	if (!(target instanceof Field) || !!target.occupant) console.error("Not a field!");

	target.placeContent(this);
	this.placedOn = target;

	this.position = target.position.clone();
}

Tree.prototype.updateModel = function() {

	if (!this.model) {
		console.error("Not loaded");
		return;
	}

	this.model.position.x = this.position.x * Field.FIELD_SIZE;
	this.model.position.y = this.position.y * Field.FIELD_SIZE;
}

Tree.prototype.generateModel = function() {

	var geometry = new THREE.BoxGeometry(2, 2, 14);
	var material = game.textureManager.getTexture("tree");

	this.model = new THREE.Mesh(geometry, material);
	this.model.position.x = 0;
	this.model.position.y = 0;
	this.model.position.z = 7;
	this.model.userData = this;
	game.scene.add(this.model);
}