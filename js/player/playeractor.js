"use strict";

var PlayerActor = function(name, teamID, worldID, isAlive) {

	this.name = name;

	// can be overwritten by the deserialize-function
	this.isAlive = isAlive;
	this.HP = new SimpleStat(50);
	this.AP = new SimpleStat(9);
	this.position = new Position(-1, -1);

	//gets generated
	this.model = null;

	this.placedOn = null;

	// gets set from the teamm
	this.team = null;

	this.healthbar = new HealthBar(this);

	this.selectedAttack = new Attack("basic", 20, 2, 15);
}

//------------------------------------------------------------------------------
//----------------------------Basic Stuff---------------------------------------
//------------------------------------------------------------------------------
PlayerActor.prototype = Object.create(GameObject.prototype);

/**
 * For saving and Loading
 */

PlayerActor.serialize = function(actor) {
	return {
		name: actor.name,
		isAlive: actor.isAlive,
		position: actor.position,
		HP: actor.HP,
		AP: actor.AP
	}
}

PlayerActor.deserialize = function(saved) {
	var player = new PlayerActor(saved.name, saved.teamID, saved.worldID, saved.isAlive);
	//if player is not alive, it will get killed by the level TODO
	player.position = new Position(saved.position.x, saved.position.y);
	player.HP = new SimpleStat(saved.HP.max, saved.HP.val);
	player.AP = new SimpleStat(saved.AP.max, saved.AP.val);
	return player;
}

/**
 * Do we need these? Yes!
 */
PlayerActor.prototype.show = function() {
	if (!this.model) this.generateModel();
	this.healthbar.show();
	this.updatePosition();
	game.scene.add(this.model);

}

PlayerActor.prototype.hide = function() {
	game.scene.remove(this.model);
	this.model = null;
	this.healthbar.hide();
}

//------------------------------------------------------------------------------
//---------------------Battle Actions-------------------------------------------
//------------------------------------------------------------------------------
/**
 * Attacks an enemy figure. attack will print out
 * an error message if it fails
 */
PlayerActor.prototype.attack = function(enemy) {


	if (this.AP.val < this.selectedAttack.cost) {
		console.log("Not enough AP to attack!");
		return;
	}

	this.selectedAttack.execute(this, enemy).then(
		function(result) {
			this.AP.sub(this.selectedAttack.cost);
		}.bind(this),
		function(error) {
			console.log("Couldn't attack");
		});
}

/**
 * gets executed when the player gets hit
 */
PlayerActor.prototype.hit = function(damage) {

	console.log(this.name + " got hit for " + damage);

	this.HP.sub(damage);

	this.HP.isNegative && this.kill();

}

/**
 * kills the player. ticks-parameter can be set to 1 to instantly kill the player
 */
PlayerActor.prototype.kill = function(ticks) {

	this.isAlive = false;

	this.placedOn.removeContent();

	var ticks = ticks || 20;
	var i = 0;
	var killFunc = function() {
		if (i === ticks) {
			window.game.scene.removeEventListener("tick", killFunc);
			return;
		}
		this.model.rotateX(-(Math.PI / 2) / ticks);
		this.model.position.z -= 2.5 / ticks;
		i++;

	}.bind(this);

	window.game.scene.addEventListener("tick", killFunc);
	window.game.fadeOut(this.healthbar.model, ticks / 60);
	this.healthbar.hide();

	// debugging: place bomb on field if player was killed
	// this.placedOn.fieldScript = new FieldScriptList.explosion();
	// this.placedOn.fieldScript.activate();


	console.log(this.name + " got killed!");
}

//------------------------------------------------------------------------------
//------------------------------Movement----------------------------------------
//------------------------------------------------------------------------------


/**
 * Sticks the player to a target location (updating references etc)
 * updatePosition forces a recalculation of the current position based
 * on this.placedOn.
 */
PlayerActor.prototype.placeOn = function(target) {

	if (!(target instanceof Field) || !!target.occupant) console.error("Not a field!");

	if (this.isAlive) {
		target.placeContent(this);
		this.placedOn = target;
	}
	this.position = target.position.clone();
}

/**
 * Puts updates the player-model based on the current position
 */
PlayerActor.prototype.updatePosition = function() {

	if (!this.model) {
		console.error("Not loaded");
	}

	this.model.position.x = this.position.x * Field.FIELD_SIZE;
	this.model.position.y = this.position.y * Field.FIELD_SIZE;
	//this.model.position.z = 5;

	this.healthbar.updatePosition();
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


	var _alignCost = this.placedOn.position.calcAlignmentCost(target.position);
	var _moveCost = this.placedOn.fieldType.movementCost
	var actionPointCost = _alignCost * _moveCost;
	console.log("Moving for cost:" + actionPointCost);

	var animateMovement = function() {

		// tween the movement
		if (i < iteration_steps) {
			this.model.position.x += (Field.FIELD_SIZE * difference.x) / iteration_steps;
			this.model.position.y += (Field.FIELD_SIZE * difference.y) / iteration_steps;

			this.healthbar.updatePosition();
			i++;

			// we're done with moving, end it!
		} else {
			this.placeOn(target);
			this.AP.sub(actionPointCost);
			game.scene.removeEventListener("tick", animateMovement);
			deferred.resolve();
		}
	}.bind(this);

	// if the movement would lead to negative action points, abort
	if (this.AP.val - actionPointCost >= 0) {
		game.scene.addEventListener("tick", animateMovement);
	} else {
		console.log("Player has not enough AP to move");
		deferred.reject();
	}



	return deferred.promise;

}


/**
 * Generates the model for the actor and the sprite
 */
PlayerActor.prototype.generateModel = function() {

	var geometry = new THREE.BoxGeometry(3, 8, 3, 1, 1, 1);

	var material = game.textureManager.getTexture("player").clone();

	this.model = new THREE.Mesh(geometry, material);

	this.model.position.x = 0; //this.position.x;
	this.model.position.y = 0; //this.position.y;

	//if the player is dead, adapt the model
	if (this.isAlive) {
		this.model.rotateX(Math.PI / 2);
		this.model.position.z = 4;
	} else {
		this.model.position.z = 1.5;
	}

	this.model.userData = this;

}