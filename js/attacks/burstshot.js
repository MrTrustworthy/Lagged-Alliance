var BurstShot = function () {
    //The amount of bullets shot by the burst is detemined by this.ammoCost
    SingleShot.apply(this, arguments);

};

BurstShot.prototype = Object.create(SingleShot.prototype);

/**
 * This should be overridden by the sub-classes
 * to generate a specific model for each attack
 */
BurstShot.prototype.generateProjectileModel = function () {

    var material = new THREE.MeshBasicMaterial({
        color: 0x223311
    });

    var geometry = new THREE.SphereGeometry(0.7);

    return new THREE.Mesh(geometry, material);
};


/**
 * returns a promise which gets rejected/fulfilled depending
 * on if the attack was successful or not
 */
BurstShot.prototype.execute = function (origin, target) {

    var deferred = new Deferred();

    if (this.ammoCost < 2) throw new RangeError("Need at least 2 shots to burst!");

    var selfRef = this;
    var argsRef = arguments;

    // shooting length based on this.ammoCost
    var i = 0;

    var burstFunc = function () {
        if (i === this.ammoCost) {
            deferred.resolve();
            return;
        }
        i++;
        SingleShot.prototype.execute.apply(selfRef, argsRef).then(burstFunc);
    }.bind(this);

    burstFunc();

    return deferred.promise;
};