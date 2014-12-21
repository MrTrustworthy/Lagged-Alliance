"use strict";

var HealthBar = function(player, params) {

	this.playerRef = player;

	this.model = this.generateModel(params);

}

HealthBar.prototype.generateModel = function(params) {
	// Creating the healthbar
	var spriteGeo = new THREE.PlaneGeometry(Field.FIELD_SIZE, Field.FIELD_SIZE / 3, 1, 1);
	var spriteMat = new THREE.MeshBasicMaterial({
		color: params.healthbarColor || 0xffffff
	});

	var model = new THREE.Mesh(spriteGeo, spriteMat);

	model.position.x = this.playerRef.model.position.x;
	model.position.y = this.playerRef.model.position.y;
	model.position.z = 12;
	model.rotateX(Math.PI / 4);

	this.playerRef.model.children.push(model);

	return model;

}

HealthBar.prototype.updatePosition = function() {

	this.model.position.x = this.playerRef.model.position.x;
	this.model.position.y = this.playerRef.model.position.y;

}