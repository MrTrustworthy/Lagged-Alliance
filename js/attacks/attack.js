/**
 * An attack-object is just the visual representation of the attack
 * @constructor
 */
var Attack = function () {
};

Attack.prototype.constructor = Attack;

Attack.prototype.generateProjectileModel = function () {
    throw new Error("Not implemented!");
};


Attack.prototype.execute = function (origin, target) {

    throw new Error("Not implemented!");
};

Attack.prototype.toString = function () {
    return "Attack: " + this.name;
};