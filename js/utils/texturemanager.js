"use strict";

var TextureManager = function() {

	this._loaded = false;

	this.path = "./media/textures/";

	this._textures = {
		water: "water.jpg",
		dirt: "dirt.jpg",
		stone: "stone.png",
		grass: "grass.jpg",
		tree: "tree.jpg",
		player: "player.jpg"
	};

};


/**
 * Loads all available textures
 */
TextureManager.prototype.loadAllAvailableTextures = function() {

	for (var key in this._textures) {
		if (this._textures.hasOwnProperty(key) && key.indexOf("_hl") === -1) {

			// console.info(key);

			//normal textures
            this._textures[key] = new THREE.MeshLambertMaterial({
				map: THREE.ImageUtils.loadTexture(this.path + this._textures[key])
			});

			//highlighted textures
			// console.log(key);
			var material_hl = new THREE.MeshLambertMaterial({
				map: THREE.ImageUtils.loadTexture(this.path + this._textures[key])
			});
			material_hl.transparent = true;
			material_hl.opacity = 0.2;
			this._textures[key + "_hl"] = material_hl;
		}
	}
	this._loaded = true;
};

TextureManager.prototype.getTexture = function(name) {
	if (!this._loaded) throw Error("Textures not yet ready");
	return this._textures[name];
};