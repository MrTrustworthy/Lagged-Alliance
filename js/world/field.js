"use strict";

var Field = function(x, y, fieldType) {

	new THREE.EventDispatcher().apply(this);

	this.position = new Position(x, y);

	this.fieldType = Field.FieldTypeGenerator.byID(fieldType.id);

	this.model = null;

	this.occupant = null;

	this.isBlocked = false;

	//this.fieldScript = new FieldScriptList[fieldScriptName](this);

}

//------------------------------------------------------------------------------
//---------------------------Static Stuff---------------------------------------
//------------------------------------------------------------------------------

Field.prototype = Object.create(GameObject.prototype);

Field.FIELD_SIZE = 5;
Field.FieldTypeGenerator = new FieldTypeGenerator();

// For DB-Saving and loading
Field.serialize = function(field) { 
	return {
		position: field.position,
		type: field.fieldType
		//scriptName: field.fieldScript.name
	}
}

Field.deserialize = function(saved) {
	var fld = new Field(
		saved.position.x,
		saved.position.y,
		saved.type
		//saved.scriptName
	);
	return fld;
}


Field.prototype.show = function() {
	if (!this.model) this.generateModel();
	game.scene.add(this.model);

	//activates fieldscript
	//this.fieldScript.activate();
}

Field.prototype.hide = function() {
	game.scene.remove(this.model);
	delete this.model;

	// deactivate fieldscript
	//this.fieldScript.deactivate();
}

//------------------------------------------------------------------------------
//---------------------------Functions------------------------------------------
//------------------------------------------------------------------------------

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

	// dispatches "walkOn" event
	!!this.model && this.dispatchEvent({type: "walkOn"});

	// executes the fieldScript
	//this.fieldScript && this.fieldScript.execute();
}

/** 
 * removes the current content from a field
 */
Field.prototype.removeContent = function() {
	if (!this.occupant) console.warn("No Occupant on Field to remove");
	this.occupant = null;
	this.isBlocked = false;
	!!this.model && this.dispatchEvent({type: "walkOff"});
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

	this.model = new THREE.Mesh(geometry, material);

	this.model.position.x = this.position.x * Field.FIELD_SIZE;
	this.model.position.y = this.position.y * Field.FIELD_SIZE;
	this.model.position.z = 0;

	this.model.userData = this;

	this.model.matrixAutoUpdate = false;
	this.model.updateMatrix();
}


/**
 * Highlight a given model
 */
Field.prototype.blink = function(time) {

	this.model.material.opacity = 0.5;
	this.model.material.transparent = true;

	setTimeout(function() {

		if (!!this.model) {
			this.model.material.opacity = 1;
			this.model.material.transparent = false;
		}

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


	var vShader = document.getElementById("vShader").text;
	var fShader = document.getElementById("fShader").text;

	return new THREE.ShaderMaterial({
		uniforms: uniforms,
		attributes: attributes,
		vertexShader: vShader,
		fragmentShader: fShader
	});
}
