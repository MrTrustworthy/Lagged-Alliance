"use strict";
/**
 * Created by mt on 20.02.2015.
 */

var EnvironmentObject = function () {

    this.isBlocking = true;

    this.position = null;
    this.envType =  null; //qp.chance(50) ? EnvTypes.wall : EnvTypes.tree;

    this.model = null;
    this.placedOn = null;

};

EnvironmentObject.prototype = Object.create(GameObject.prototype);
EnvironmentObject.prototype.constructor = EnvironmentObject;

/**
 * Creates a EnvironmentObject with a random type/model and returns it
 * @returns {EnvironmentObject}
 */
EnvironmentObject.createRandom = function(){
    var type = qp.randomArrayElem(Object.keys(EnvTypes));
    var obj = new EnvironmentObject();
    obj.envType = EnvTypes[type];
    return obj;
};
/**
 *
 * @param object
 * @returns {{position: (*|Tree.serialize.position|Inventory.position|Actor.serialize.position|CSSStyleDeclaration.position|position)}}
 */
EnvironmentObject.serialize = function (object) {
    return {
        position: object.position,
        type    : object.envType.name
    }
};

/**
 *
 * @param save
 * @returns {EnvironmentObject}
 */
EnvironmentObject.deserialize = function (save) {
    var object = new EnvironmentObject();
    object.position = new Position(save.position.x, save.position.y);
    object.envType = EnvTypes[save.type];
    //object.envType =EnvTypes[qp.randomArrayElem(Object.keys(EnvTypes))];
    return object;
};

/**
 * Show function
 */
EnvironmentObject.prototype.show = function () {
    if (!this.model) {
        this.generateModel();
        game.scene.add(this.model);
    }
    this.updateModel();
};

/**
 * Hide function
 */
EnvironmentObject.prototype.hide = function () {
    game.scene.remove(this.model);
    this.model = null;
};

/**
 * Places the object on a field and updates the position
 * @param target
 */
EnvironmentObject.prototype.placeOn = function (target) {

    if (!(target instanceof Field) || !!target.occupant) console.error("Not a field!");

    target.placeContent(this);
    this.placedOn = target;
    this.position = target.position.clone();
    !!this.model && this.updateModel();
};

/**
 * Remove this object from the game (called from the level)
 */
EnvironmentObject.prototype.remove = function(){
    this.placedOn.removeContent(this);
    this.hide();
    this.position = null;
    this.placedOn = null;
}

/**
 * updates the models position based on the own position
 */
EnvironmentObject.prototype.updateModel = function () {

    if (!this.model) {
        console.warn("Model not yet loaded, cant update");
        return;
    }

    this.model.position.x = this.position.x * Field.FIELD_SIZE;
    this.model.position.y = this.position.y * Field.FIELD_SIZE;
};

/**
 * generates the objects model
 */
EnvironmentObject.prototype.generateModel = function () {

    // TODO: figure out how the fuck to load lambert materials onto this shit
    //var material = game.textureManager.getTexture(this.envType.model.textureName).clone();
    //console.info(this.envType.model.textureName);

    var material = new THREE.MeshBasicMaterial({
        color: 0x778899,
        side : THREE.DoubleSide
    });

    // get the right geometry
    var geometry = game.geometryManager.getGeometry(
        this.envType.model.geometryName
    );
    //geometry.computeVertexNormals();
    //geometry.computeFaceNormals();
    //geometry.computeMorphNormals();
    //geometry.computeTangents();

    // generate the model
    this.model = new THREE.Mesh(geometry, material);

    // resize the model according to the game constants
    ["x", "y", "z"].forEach(function (i) {
        this.model.scale[i] = Field.FIELD_SIZE / 2;
    }.bind(this));

    // apply the transformation/rotation parameters from envType
    var trans = this.envType.model.transformParams;
    Object.keys(trans).forEach(function (key) {
        this.model[key](trans[key]);
    }.bind(this));

    this.model.userData = this;
};