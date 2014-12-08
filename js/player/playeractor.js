"use strict";

var PlayerActor = function(name) {


	this.model = this.generateModel();

	//should get changed by the fields
	this.placedOn = null;

	this.type = "actor";

	this.isActor = true;

	this.name = name;

}

PlayerActor.prototype.generateModel = function() {

	var geometry = new THREE.CylinderGeometry(1, 1, 5, 32, 1, false);
	var material = game.textureManager.getTexture("player");

	var model = new THREE.Mesh(geometry, material);

	model.position.x = 0;
	model.position.y = 0;
	model.position.z = 0;

	model.rotateX(Math.PI/2);

	// game.scene.addEventListener("tick", function(){
	// 	console.log(model.rotation.x);
	// 	model.rotateX(0.01);
	// });

	model.gameObject = this;

	game.scene.add(model);

	return model;


}
