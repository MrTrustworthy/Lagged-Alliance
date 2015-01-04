var Explosion = function(field, size, damage) {

	// the origin field of the explosion
	this.field = field;

	// size of the explosion measured in fields
	// if the size is 0, it only affects the original field
	this.size = size || 1;

	// how much damage the explosion does
	this.damage = damage || 10;

}


/**
* 
*/
Explosion.prototype.start = function() {

	var deferred = new Deferred();
	
	// step 1: explosion animation
	var material = this.getExplosionMaterial();

	var geometry = new THREE.SphereGeometry(1, 64, 64);

	var ball = new THREE.Mesh(geometry, material);

	ball.position.x = this.field.model.position.x;
	ball.position.y = this.field.model.position.y;
	ball.position.z = 3;

	window.game.scene.add(ball);

	// for size = 0, it's just the origin field.
	var maxSize = (Field.FIELD_SIZE + (this.size * Field.FIELD_SIZE) / 2);
	var tickAmount = 120;
	var interval = Math.PI/tickAmount;
	var i = 0;

	var tweenFunc = function(){
		if(i === tickAmount){
			window.game.scene.removeEventListener("tick", tweenFunc);
			window.game.scene.remove(ball);
		}else{
			var val = Math.sin(i * interval) * maxSize;
			ball.scale.x = val;
			ball.scale.y = val;
			ball.scale.z = val;
			i++;
		}
	}
	window.game.scene.addEventListener("tick", tweenFunc);


	// step 2: apply damage

	var affectedFields = game.world.map.neighboursOf(this.field, this.size);
	affectedFields.push(this.field);

	affectedFields.forEach(function(field) {
		field.blink();
		if (!!field.occupant && field.occupant instanceof PlayerActor) {
			field.occupant.hit(this.damage);
		}
	}.bind(this));

	return deferred.promise;
}

/**
* 
*/
Explosion.prototype.getExplosionMaterial = function() {

	var vShader = document.getElementById("explosionVShader").text;
	var fShader = document.getElementById("explosionFShader").text;

	var material = new THREE.ShaderMaterial({
		uniforms: {
			tExplosion: {
				type: "t",
				value: THREE.ImageUtils.loadTexture("./media/textures/explosion2.png")
			},
			time: { // float initialized to 0
				type: "f",
				value: 0.0
			}
		},
		vertexShader: vShader,
		fragmentShader: fShader
	});

	var start = Date.now();
	window.game.scene.addEventListener("tick", function() {
		material.uniforms['time'].value = .00025 * (Date.now() - start);
	});

	return material;

}