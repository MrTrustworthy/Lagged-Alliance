"use strict";

var Field = function(x, y, fieldType) {

	this.position = new Position(x, y);

	this.fieldType = fieldType || FieldTypes.random();

	this.model = this.generateModel();

	this.occupant = null;

	this.isBlocked = false;

}

Field.prototype = Object.create(GameObject.prototype);

/**
 * Adds content to a field and adjusts the position
 */
Field.prototype.placeContent = function(content) {

	if (this.isBlocked && this.occupant) {
		//throw new Error("Already have something on this field. remove this first!")
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

	//if a model already exists, 
	//we need to remove it before loading the new one
	if (!!this.model) {
		game.scene.remove(this.model);
		this.model = null;
	}

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


	model.matrixAutoUpdate = false;

	model.userData = this;

	game.scene.add(model);

	model.updateMatrix();

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
Field.prototype.equals = function(otherField) {
	return this.position.equals(otherField.position);
}


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

/**
 * Static methods and properties of Field
 */

Field.FIELD_SIZE = 5;

Field.FIELD_HEIGHT = 0.01;



var FieldTypes = {
	water: {
		id: 0,
		name: "water",
		movementCost: 3
	},
	grass: {
		id: 1,
		name: "grass",
		movementCost: 1
	},
	dirt: {
		id: 2,
		name: "dirt",
		movementCost: 1
	},
	stone: {
		id: 3,
		name: "stone",
		movementCost: 1
	},
	byID: function(id) {
		for (var type in FieldTypes) {
			if (FieldTypes.hasOwnProperty(type) &&
				!(FieldTypes[type] instanceof Function) &&
				FieldTypes[type].id === id) {
				return FieldTypes[type];
			}
		}
	},
	randomID: function(){
		return Math.floor(Math.random()*4+1)-1;
	},
	random: function() {
		var types = [];
		for (var type in FieldTypes) {
			if (FieldTypes.hasOwnProperty(type) &&
				!(FieldTypes[type] instanceof Function)) {
				types.push(FieldTypes[type]);
			}
		}
		return types[Math.floor(Math.random() * types.length)];
	}

}