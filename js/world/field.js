"use strict";

var Field = function (x, y, fieldType) {

    this.position = new Position(x, y);

    this.fieldType = Field.FieldTypeGenerator.byID(fieldType.id);

    this.model = null;

    // occupant is eg. an alive Actor. having an occupant blocks the field
    this.occupant = null;

    // objects are eg. dead actors or bushes, they dont block the field
    this.objects = [];

    // the items that are dropped on this field.
    // the field is responsible for (de)serializing those!!!
    this.items = [];

    this.isBlocked = false;
};

//------------------------------------------------------------------------------
//---------------------------Static Stuff---------------------------------------
//------------------------------------------------------------------------------

Field.prototype = Object.create(GameObject.prototype);

Field.FIELD_SIZE = 5;
Field.FieldTypeGenerator = new FieldTypeGenerator();

/**
 * Saves the field and all items on it
 * @param field
 * @returns {{position: (*|Tree.serialize.position|Inventory.position|Actor.serialize.position|CSSStyleDeclaration.position|position), type: (*|fieldType), items: Array}}
 */
Field.serialize = function (field) {

    var items = [];
    field.items.forEach(function(item){
        items.push(Item.serialize(item));
    });

    return {
        position: field.position,
        type: field.fieldType,
        items: items
    }
};
/**
 * Loads the field and all placed items
 * @param saved
 */
Field.deserialize = function (saved) {

    var fld = new Field(
        saved.position.x,
        saved.position.y,
        saved.type
    );
    saved.items.forEach(function(item){
        fld.placeItem(Item.deserialize(item));
    });

    return fld;
};

/**
 * Shows the field and all items
 */
Field.prototype.show = function () {
    if (!this.model) this.generateModel();
    game.scene.add(this.model);

    this.items.forEach(function(item){
        item.show();
    });
};

/**
 * Hides the field and all items
 */
Field.prototype.hide = function () {
    game.scene.remove(this.model);
    delete this.model;

    this.items.forEach(function(item){
        item.hide();
    });
};

//------------------------------------------------------------------------------
//---------------------------Adding/Removing Content----------------------------
//------------------------------------------------------------------------------

/**
 * Adds content to this field
 * Should only be called from the actors/objects and not directly
 * @param content
 */
Field.prototype.placeContent = function (content) {

    // if the content is blocking, handle it accordingly
    if (content.isBlocking) {

        if (this.isBlocked || !!this.occupant) throw new Error("Already have something on this field");

        this.occupant = content;
        this.isBlocked = true;

        // dispatches "walkOn" event
        !!this.model && this.dispatchEvent({type: "walkOn"});


        // if there is a non-blocking object like an item
    } else {
        this.objects.push(content);
    }
};


/**
 * removes the given content from this field
 * @param content
 */
Field.prototype.removeContent = function (content) {

    // if we remove a blocking element (alive actor etc)
    if (this.occupant === content) {
        this.occupant = null;
        this.isBlocked = false;
        if (!!this.model) this.dispatchEvent({type: "walkOff"});

        // else if we remove a normal object (item or smth)
    } else {
        var i = this.objects.indexOf(content);
        if (i === -1) throw new Error("This object is not on the field!", content, this);
        this.objects.splice(i, 1);
    }
};

/**
 * Places an item on this field
 * @param item
 */
Field.prototype.placeItem = function(item){
    if(!(item instanceof Item)) throw new Error();
    if(this.isBlocked) throw new Error("field blocked!");

    item.container = this;
    this.items.push(item);

    //TODO better way to check?
    if(!!this.model) item.show();
};

/**
 * Removes an item from this field
 * @param item
 */
Field.prototype.removeItem = function(item){
    var i = this.items.indexOf(item);
    if (i === -1) throw new Error("This object is not on the field!", item, this);

    //TODO better way to check?
    if(this.model) item.hide();

    this.items.splice(i, 1);
    item.container = null;

};

//------------------------------------------------------------------------------
//---------------------------Functions------------------------------------------
//------------------------------------------------------------------------------



/**
 * Those two functions are used by the playeractor
 * to block the field they want to move on to in order to
 * prevent another actor from accessing it while moving onto it
 */
Field.prototype.block = function () {
    this.isBlocked = true;
};

Field.prototype.unblock = function () {
    if (!!this.occupant) {
        throw new Error("Can't unblock field that has occupant!", this);
    }
    this.isBlocked = false;
};


/**
 * Generate the THREE.js model of the field
 */
Field.prototype.generateModel = function () {

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

    // material = new THREE.LineBasicMaterial({
    //        color: 0x0000ff
    //    });

    this.model = new THREE.Mesh(geometry, material);

    this.model.position.x = this.position.x * Field.FIELD_SIZE;
    this.model.position.y = this.position.y * Field.FIELD_SIZE;
    this.model.position.z = 0;

    this.model.userData = this;

    this.model.matrixAutoUpdate = false;
    this.model.updateMatrix();
};


/**
 * Highlight a given model
 */
Field.prototype.blink = function (time) {

    this.model.material.opacity = 0.5;
    this.model.material.transparent = true;

    setTimeout(function () {

        if (!!this.model) {
            this.model.material.opacity = 1;
            this.model.material.transparent = false;
        }

    }.bind(this), time ? time : 1000);
};

/**
 * Path score:
 * F = G + H
 * G = movement costfrom the starting point to this field
 * H = estimated cost from here to target
 */
Field.prototype.getNode = function () {
    return new PathNode(this);
};

/**
 * Determines whether two fields are equal
 */
Field.prototype.equals = function (otherField) {
    return this.position.equals(otherField.position);
};

/**
 * generates the shader material for water
 */
Field.prototype.getWaterShader = function () {


    var uniforms = {
        iGlobalTime: {
            type: "f",
            value: 0
        }
    };

    var attributes = {
        uvv: {
            type: "v2",
            value: []
        }
    };

    var px = this.position.x * Field.FIELD_SIZE;
    var py = this.position.y * Field.FIELD_SIZE;

    attributes.uvv.value.push(new THREE.Vector2(px, py));
    attributes.uvv.value.push(new THREE.Vector2(px, py + 1));
    attributes.uvv.value.push(new THREE.Vector2(px + 1, py));
    attributes.uvv.value.push(new THREE.Vector2(px + 1, py + 1));

    var frameCount = 0;
    var timePassingFunc = function () {
        uniforms.iGlobalTime.value = frameCount;
        frameCount += 0.01;
    };
    game.scene.addEventListener("tick", timePassingFunc);


    var vShader = document.getElementById("vShader").text;
    var fShader = document.getElementById("fShader").text;

    return new THREE.ShaderMaterial({
        uniforms: uniforms,
        attributes: attributes,
        vertexShader: vShader,
        fragmentShader: fShader
    });
};

THREE.EventDispatcher.prototype.apply(Field.prototype);