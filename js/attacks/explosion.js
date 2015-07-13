var Explosion = function (range) {
    this.range = range;
};

/**
 * Plays the Explosion animation in the given range and resolves with an array containing all characters hit
 * @param origin is ignored
 * @param range
 * @returns {Deferred.promise|*}
 */
Explosion.prototype.execute = function (origin, target) {

    var deferred = new Deferred();

    var ball = this.generateProjectileModel();

    ball.position.x = target.placedOn.model.position.x;
    ball.position.y = target.placedOn.model.position.y;
    ball.position.z = 3;

    // for size = 0, it's just the origin field.
    var maxSize = (Field.FIELD_SIZE + (this.range * Field.FIELD_SIZE) / 2);
    var tickAmount = 60;
    var interval = Math.PI / tickAmount;
    var i = 0;

    var affectedActors = [];

    // this functions applies damage to everything in the area
    var damageFunc = function () {

        var affectedFields = game.getLevel().map.getRadius(target.placedOn, this.range, true);

        affectedFields.forEach(function (field) {
            field.blink();
            if (!!field.occupant && field.occupant instanceof Actor) {
                // adds the actors hit to the list
                affectedActors.push(field.occupant);
            }
        }.bind(this));

    }.bind(this);


    var start = Date.now();
    var colorFunc = function () {
        ball.material.uniforms.time.value = .00025 * (Date.now() - start);
    };

    var tweenFunc = function () {
        if (i === tickAmount) {
            window.game.scene.removeEventListener("tick", tweenFunc);
            window.game.scene.removeEventListener("tick", colorFunc);
            window.game.scene.remove(ball);
            damageFunc();
            deferred.resolve(affectedActors);
        } else {
            var val = Math.sin(i * interval) * maxSize;
            ball.scale.x = val;
            ball.scale.y = val;
            ball.scale.z = val;
            i++;
        }
    };


    window.game.scene.add(ball);

    window.game.scene.addEventListener("tick", colorFunc);
    window.game.scene.addEventListener("tick", tweenFunc);

    window.game.audio.playSound("explosion");


    // step 2: apply damage


    return deferred.promise;
};

/**
 * generates the mesh & shader texture for the explosion
 *
 * @returns {THREE.Mesh}
 */
Explosion.prototype.generateProjectileModel = function () {

    var vShader = document.getElementById("explosionVShader").text;
    var fShader = document.getElementById("explosionFShader").text;

    var material = new THREE.ShaderMaterial({
        uniforms      : {
            tExplosion: {
                type : "t",
                value: THREE.ImageUtils.loadTexture("./media/textures/explosion2.png")
            },
            time      : { // float initialized to 0
                type : "f",
                value: 0.0
            }
        },
        vertexShader  : vShader,
        fragmentShader: fShader
    });


    var geometry = new THREE.SphereGeometry(1, 64, 64);

    return new THREE.Mesh(geometry, material);

};

window.testExplosion = function(range){
    range = range || 4;
    new Explosion().execute(game.getSelected(), range);
}