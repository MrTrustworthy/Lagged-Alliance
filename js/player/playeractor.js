"use strict";

var PlayerActor = function(name, params) {

	this.name = name;

	this.isAlive = true;

	this.placedOn = null;

	this.position = new Position(0, 0);

	this.model = this.generateModel();

	this.healthbar = new HealthBar(this, params);
}

PlayerActor.prototype = Object.create(GameObject.prototype);

/**
* 
*/
PlayerActor.prototype.attack = function(enemy){

	console.info("Hey i'm", this.name, "and i'm hitting", enemy.name, "yay!");

	var material = new THREE.LineBasicMaterial({
		color: 0x0000ff
	});

	var geometry = new THREE.Geometry();
	geometry.vertices.push(
		this.model.position,
		enemy.model.position
	);

	var line = new THREE.Line(geometry, material);
	window.game.scene.add(line);
	window.game.fadeOut(line);

	enemy.hit(20);
}


PlayerActor.prototype.hit = function(damage){

	console.info("ouch i'm", this.name, "and i'm getting hit!!");
	this.kill();

}

PlayerActor.prototype.kill = function(){

	this.isAlive = false;

	this.placedOn.removeContent();

	var ticks = 120;
	var i = 0;
	var killFunc = function(){
		if(i === ticks){
			window.game.scene.removeEventListener("tick", killFunc);
			return;
		}
		this.model.rotateX(-(Math.PI / 2)/ticks);
		this.model.position.z -= 2.5/ticks;		
		i++;

	}.bind(this);

	window.game.scene.addEventListener("tick", killFunc);


	window.game.fadeOut(this.healthbar.model, ticks/60);

	console.info("Oh noes i am deads!!");
}

/**
 * Moves the actor to the given target/field.
 * Gets called by the world to tween the actor to a neighbour tile
 */
PlayerActor.prototype.moveToField = function(target) {

	var deferred = new Deferred();

	var speed = 0.05;
	var difference = this.position.diff(target.position);
	var iteration_steps = Math.floor(difference.length()) / speed;
	var i = 0;

	var animateMovement = function() {
		if (i < iteration_steps) {
			this.model.position.x += (Field.FIELD_SIZE * difference.x) / iteration_steps;
			this.model.position.y += (Field.FIELD_SIZE * difference.y) / iteration_steps;

			this.healthbar.updatePosition();
			i++;

		} else {
			this.placeOn(target);
			game.scene.removeEventListener("tick", animateMovement);
			deferred.resolve();
		}
	}.bind(this);

	game.scene.addEventListener("tick", animateMovement);

	return deferred.promise;

}


/**
 * Sticks the player to a target location (updating references etc)
 * updatePosition forces a recalculation of the current position based
 * on this.placedOn.
 * Can get called by moving the player (without updatePos) or to place
 * the player at game loading (WITH updatePos)
 */
PlayerActor.prototype.placeOn = function(target, updatePosition) {

	if (!(target instanceof Field) || !!target.occupant) console.error("Not a field!");

	target.placeContent(this);

	this.placedOn = target;
	this.position = target.position.clone();

	if (!!updatePosition) {
		this.model.position.x = this.position.x * Field.FIELD_SIZE;
		this.model.position.y = this.position.y * Field.FIELD_SIZE;
		this.model.position.z = 5;

		this.healthbar.updatePosition();
	}
}

/**
 * Generates the model for the actor and the sprite
 */
PlayerActor.prototype.generateModel = function() {

	var geometry = new THREE.BoxGeometry(3, 8, 3, 1, 1, 1);

	var material = game.textureManager.getTexture("player").clone();

	var model = new THREE.Mesh(geometry, material);

	model.position.x = this.position.x;
	model.position.y = this.position.y;
	model.position.z = 4;

	model.rotateX(Math.PI / 2);
	model.userData = this;
	game.scene.add(model);

	return model;

}