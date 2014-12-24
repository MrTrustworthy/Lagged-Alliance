var Attack = function(name, damage, cost, range){

	this.name = name;

	this.damage = damage;

	this.cost = cost;

	this.range = range;
}

/**
* returns a promise which gets rejected/fulfilled depending
* on if the attack was successful or not
*/
Attack.prototype.execute = function(origin, target){

	var deferred = new Deferred();

	if(origin.position.distanceTo(target.position) > this.range){

		console.log("Out of range!");
		deferred.reject();

	}else{

		console.log(origin.name + " hits " + target.name + " for " + this.damage + " dmg");

		var material = new THREE.LineBasicMaterial({
			color: 0x0000ff
		});

		var geometry = new THREE.Geometry();
		geometry.vertices.push(
			origin.model.position,
			target.model.position
		);

		var line = new THREE.Line(geometry, material);
		window.game.scene.add(line);
		window.game.fadeOut(line);

		target.hit(this.damage);
		
		deferred.resolve();
	}

	return deferred.promise;

}