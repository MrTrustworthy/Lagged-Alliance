var GameCamera = function() {

	this._camera = new THREE.PerspectiveCamera(75, game.WIDTH / game.HEIGHT, 0.1, 1000);
	this._camera.position.x = 150;
	this._camera.position.y = 150;
	this._camera.position.z = 40;
	this._camera.rotateX(1 / 2);

	this.savedPosition = {};

	this.__stickFunc = null;
}

GameCamera.prototype.getCamera = function() {
	return this._camera;
}

GameCamera.prototype.getPosition = function() {
	return this._camera.position;
}

GameCamera.prototype.move = function(x, y, z) {

	x = x || 0;
	y = y || 0;
	z = z || 0;

	this._camera.position.x += x;
	this._camera.position.y += y;
	this._camera.position.z += z;
}

GameCamera.prototype.setPosition = function(position) {
	this._camera.position.x = position.x;
	this._camera.position.y = position.y;
	this._camera.position.z = position.z;
}

GameCamera.prototype.savePosition = function(key) {
	console.log("saving position " + key);
	this.savePosition.key = this.getPosition().clone();
}

GameCamera.prototype.loadPosition = function(key) {
	console.log("loading position " + key);
	if (!this.savePosition.key) throw new Error("No such position");

	this.setPosition(this.savePosition.key);
}

GameCamera.prototype.unstick = function() {

	if(!this.__stickFunc) return;

	window.game.scene.removeEventListener("tick", this.__stickFunc);
	this.__stickFunc = null;
	this.loadPosition("stick");
}

GameCamera.prototype.stick = function(object) {

	!!this.__stickFunc && this.unstick();

	this.__stickFunc = function() {
		this._camera.position.x = object.model.position.x;
		this._camera.position.y =  object.model.position.y - 20;
	}.bind(this);

	this.savePosition("stick");
	window.game.scene.addEventListener("tick", this.__stickFunc);
}