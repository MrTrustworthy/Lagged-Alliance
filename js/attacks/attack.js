var Attack = function(name, damage, cost, range) {

	this.name = name;

	this.damage = damage;

	this.cost = cost;

	this.range = range;
}


/**
 * This should be overridden by the sub-classes
 * to generate a specific model for each attack
 */
Attack.prototype.generateProjectileModel = function() {

	var material = new THREE.MeshBasicMaterial({
		color: 0xffffff
	});

	var geometry = new THREE.SphereGeometry(0.75);

	return new THREE.Mesh(geometry, material);
}


/**
 * returns a promise which gets rejected/fulfilled depending
 * on if the attack was successful or not
 */
Attack.prototype.execute = function(origin, target) {

	var deferred = new Deferred();

	if (origin.position.distanceTo(target.position) > this.range) {

		console.log("Out of range!");
		deferred.reject();
		return deferred.promise;

	} 

	var projectile = this.generateProjectileModel();

	projectile.position.x = origin.model.position.x;
	projectile.position.y = origin.model.position.y;
	projectile.position.z = 7;


	window.game.scene.add(projectile);

	var i = 0;
	var steps = 15;

	var difference = {
		x: (target.model.position.x - origin.model.position.x) / steps,
		y: (target.model.position.y - origin.model.position.y) / steps
	}

	var tweenFunc = function() {

		if (i === steps) {
			window.game.scene.removeEventListener("tick", tweenFunc);
			window.game.scene.remove(projectile);
			target.hit(this.damage);
			console.log(origin.name + " hits " + target.name + " for " + this.damage + " dmg");
			deferred.resolve();
			return;
		}

		projectile.position.x += difference.x;
		projectile.position.y += difference.y;
		i++
	}.bind(this);

	window.game.scene.addEventListener("tick", tweenFunc);

	return deferred.promise;
}