"use strict";

var TextureManager = function() {

	this._loaded = false;

	this.path = "./media/textures/";

	this._textures = {
		water: Field.FIELD_TYPES.water.name + ".gif", //+ ".jpg",
		dirt: Field.FIELD_TYPES.dirt.name + ".jpg",
		stone: Field.FIELD_TYPES.stone.name + ".png",
		grass: Field.FIELD_TYPES.grass.name + ".jpg",
		tree: "tree.jpg",
		player: "player.jpg"
	};

}



TextureManager.prototype.loadAllAvailableTextures = function() {

	for (var key in this._textures) {
		if (this._textures.hasOwnProperty(key) && key.indexOf("_hl") === -1) {

			//normal textures
			var material = new THREE.MeshLambertMaterial({
				map: THREE.ImageUtils.loadTexture(this.path + this._textures[key])
			});
			this._textures[key] = material;

			//highlighted textures
			var material_hl = new THREE.MeshLambertMaterial({
				map: THREE.ImageUtils.loadTexture(this.path + this._textures[key])
			});
			material_hl.transparent = true;
			material_hl.opacity = 0.2;
			this._textures[key + "_hl"] = material_hl;
		}
	}
	this._loaded = true;
}

TextureManager.prototype.getTexture = function(name) {
	if (!this._loaded) throw Error("Textures not yet ready");
	return this._textures[name];
}