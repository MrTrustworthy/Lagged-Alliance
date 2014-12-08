"use strict";

var Field = function(position, fieldType) {

	this.position = position;

	this.fieldType = fieldType || Field.getRandomFieldType();

	this.model = this.generateModel();

	this.occupant = null;

	this.isBlocked = (this.fieldType.name === "water");

	this.type = "field";
	this.name = "Field";

}

/**
 * Adds content to a field and adjusts the position
 */
Field.prototype.placeContent = function(content) {

	if (this.isBlocked && this.occupant) {
		throw new Error("Already have something on this field. remove this first!")
		return;
	}

	this.occupant = content;
	this.occupant.placedOn = this;
	this.isBlocked = true;

	this.occupant.model.position.x = this.model.position.x;
	this.occupant.model.position.y = this.model.position.y;
	this.occupant.model.position.z = this.model.position.z + 2;


}

/**
 * removes the current content from a field
 */
Field.prototype.removeContent = function(supressWarnings) {
	if (!this.occupant) {
		if (!supressWarnings) {
			throw new Error("No Occupant on Field to remove");
		}
		console.warn("No Occupant on Field to remove");
		return null;
	}
	var tempSave = this.occupant;

	this.occupant.placedOn = null;
	this.occupant = null;

	this.isBlocked = false;

	return tempSave;
}

/**
 * Generate the THREE.js model of the field
 */
Field.prototype.generateModel = function() {

	var geometry = new THREE.BoxGeometry(
		Field.FIELD_SIZE,
		Field.FIELD_SIZE,
		Field.FIELD_HEIGHT
	);

	var material = game.textureManager.getTexture(this.fieldType.name); //.clone();

	var model = new THREE.Mesh(geometry, material);

	model.position.x = this.position.x * Field.FIELD_SIZE;
	model.position.y = this.position.y * Field.FIELD_SIZE;
	model.position.z = 0;

	model.gameObject = this;

	game.scene.add(model);

	return model;
}

/**
 * Highlight a given model
 */
Field.prototype.blink = function(time) {

	this.model.material = game.textureManager.getTexture(this.fieldType.name + "_hl");

	setTimeout(function() {
		this.model.material = game.textureManager.getTexture(this.fieldType.name);
	}.bind(this), time ? time : 1000);
}

/**
 * Path score:
 * F = G + H
 * G = movement costfrom the starting point to this field
 * H = estimated cost from here to target
 */
Field.prototype.getNode = function() {
	return new PathNode(this);
}

/**
* Determines whether two fields are equal
*/
Field.prototype.equals = function(field){
	return this.position.x === field.position.x && this.position.y === field.position.y
}


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

/**
 * Static methods and properties of Field
 */

Field.FIELD_SIZE = 5;

Field.FIELD_HEIGHT = 0.01;


Field.FIELD_TYPES = {
	water: {
		name: "water",
		color: 0x0000ff,
		movementCost: 3
	},
	grass: {
		name: "grass",
		color: 0x00ff00,
		movementCost: 1
	},
	dirt: {
		name: "dirt",
		color: 0x333333,
		movementCost: 1
	},
	stone: {
		name: "stone",
		color: 0x777777,
		movementCost: 1
	},
}

/**
 * returns a random field type depending on the available types in Field.FIELD_TYPES
 */
Field.getRandomFieldType = function() {
	var types = [];
	for (var type in Field.FIELD_TYPES) {
		if (Field.FIELD_TYPES.hasOwnProperty(type)) {
			types.push(Field.FIELD_TYPES[type]);
		}
	}
	return types[Math.floor(Math.random() * types.length)];
}