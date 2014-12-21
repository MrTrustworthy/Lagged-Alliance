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
 * Adds content to a field and adjusts the position.
 * Should only be called from the actors/objects and not directly
 */
Field.prototype.placeContent = function(content) {

	if (this.isBlocked || !!this.occupant) {
		throw new Error("Already have something on this field");
		return;
	}
	this.occupant = content;
	this.isBlocked = true;
}

/**
 * removes the current content from a field
 */
Field.prototype.removeContent = function() {
	if (!this.occupant) console.warn("No Occupant on Field to remove");
	this.occupant = null;
	this.isBlocked = false;
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


	var geometry = new THREE.PlaneGeometry(Field.FIELD_SIZE, Field.FIELD_SIZE, 1, 1);

	var material;
	if (this.fieldType.name !== "water") {
		material = game.textureManager.getTexture(this.fieldType.name).clone();
	} else {
		material = this.getWaterShader();
	}

	var model = new THREE.Mesh(geometry, material);

	model.position.x = this.position.x * Field.FIELD_SIZE;
	model.position.y = this.position.y * Field.FIELD_SIZE;
	model.position.z = 0;

	model.userData = this;

	game.scene.add(model);

	model.matrixAutoUpdate = false;
	model.updateMatrix();

	return model;
}


/**
 * Highlight a given model
 */
Field.prototype.blink = function(time) {

	this.model.material.opacity = 0.5;
	this.model.material.transparent = true;

	setTimeout(function() {
		this.model.material.opacity = 1;
		this.model.material.transparent = false;
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

/**
* generates the shader material for water
*/
Field.prototype.getWaterShader = function(px, py) {



	var uniforms = {
		iGlobalTime: {
			type: "f",
			value: 0
		}
	}

	var attributes = {
		uvv: {
			type: "v2",
			value: []
		}
	}

	var px = this.position.x * Field.FIELD_SIZE;
	var py = this.position.y * Field.FIELD_SIZE;

	attributes.uvv.value.push(new THREE.Vector2(px, py));
	attributes.uvv.value.push(new THREE.Vector2(px, py + 1));
	attributes.uvv.value.push(new THREE.Vector2(px + 1, py));
	attributes.uvv.value.push(new THREE.Vector2(px + 1, py + 1));

	var frameCount = 0;
	var timePassingFunc = function() {
		uniforms.iGlobalTime.value = frameCount;
		frameCount += 0.01;
	}
	game.scene.addEventListener("tick", timePassingFunc);


	var vShader = document.getElementById("vShader").text
	var fShader = document.getElementById("fShader").text

	return new THREE.ShaderMaterial({
		uniforms: uniforms,
		attributes: attributes,
		vertexShader: vShader,
		fragmentShader: fShader
	});
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
	randomID: function() {
		return Math.floor(Math.random() * 4 + 1) - 1;
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