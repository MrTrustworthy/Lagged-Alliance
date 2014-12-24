"use strict";

var HealthBar = function(player) {

	this.playerRef = player;

	this.model = null; //this.generateModel();

}

HealthBar.prototype.show = function() {

	if (!this.model && !!this.playerRef.isAlive) {
		this.generateModel();
		game.scene.add(this.model);
	}

}

HealthBar.prototype.hide = function() {
	game.scene.remove(this.model);
	this.model = null;
}


HealthBar.prototype.generateModel = function() {
	// Creating the healthbar
	var spriteGeo = new THREE.PlaneGeometry(Field.FIELD_SIZE, Field.FIELD_SIZE / 3, 1, 1);
	var spriteMat = new THREE.MeshBasicMaterial({
		color: this.playerRef.teamID === 0 ? 0x3311cc : 0xcc1133
	});

	this.model = new THREE.Mesh(spriteGeo, spriteMat);

	this.model.position.x = this.playerRef.model.position.x;
	this.model.position.y = this.playerRef.model.position.y;
	this.model.position.z = 12;
	this.model.rotateX(Math.PI / 4);

	//only add it if the player is alive initially
	if (!!this.playerRef.isAlive) this.playerRef.model.children.push(this.model);

}

HealthBar.prototype.updatePosition = function() {

	if (!!this.model) {
		this.model.position.x = this.playerRef.model.position.x;
		this.model.position.y = this.playerRef.model.position.y;
	}

}