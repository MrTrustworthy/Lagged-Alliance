var SingleShot = function () {

    Attack.apply(this, arguments);

};

SingleShot.prototype = Object.create(Attack.prototype);
SingleShot.prototype.constructor = SingleShot;

/**
 * This should be overridden by the sub-classes
 * to generate a specific model for each attack
 */
SingleShot.prototype.generateProjectileModel = function () {

    var material = new THREE.MeshBasicMaterial({
        color: 0xffffff
    });

    var geometry = new THREE.SphereGeometry(0.75);

    return new THREE.Mesh(geometry, material);
};


/**
 * returns a promise which gets rejected/fulfilled depending
 * on if the attack was successful or not
 */
SingleShot.prototype.execute = function (origin, target) {

    var deferred = new Deferred();

    var projectile = this.generateProjectileModel();
    projectile.position.z = 7;

    // calculate the points we need to traverse
    var pointList = qp.generateLineSegments(
        origin.position,
        target.position,
        Math.floor(origin.position.distanceTo(target.position))
    );

    window.game.scene.add(projectile);

    var tweenFunc = function () {

        var currPos = pointList.shift();

        projectile.position.x = currPos.x;
        projectile.position.y = currPos.y;

        if (pointList.length === 0) {
            window.game.scene.removeEventListener("tick", tweenFunc);
            window.game.scene.remove(projectile);
            deferred.resolve([target]);
        }

    }.bind(this);

    window.game.scene.addEventListener("tick", tweenFunc);

    window.game.audio.playSound("shot");

    return deferred.promise;
};