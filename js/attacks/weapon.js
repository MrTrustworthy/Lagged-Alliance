var Weapon = function() {

	this.name = null;

	this.range = null;

	this.damage = null;

	this.ammo = {
		type: null,
		amount: null // simplestat?
	};

	this.attacks = [];

	this.selectedAttack = null;
	this.owner = null;

};

Weapon.serialize = function(weapon){
	return {
		name: weapon.name,
		ammoAmount: SimpleStat.serialize(weapon.ammo.amount)
	}
};

Weapon.deserialize = function(blueprint){

	var w = Armory.generateWeapon(blueprint.name);
	w.setAmmo(SimpleStat.deserialize(blueprint.ammoAmount));
	return w;
};

//------------------------------------------------------------------------------
//---------------------------Basic Functions------------------------------------
//------------------------------------------------------------------------------


Weapon.prototype.switchAttack = function(){
	this.attacks.push(this.attacks.shift());
	this.selectedAttack = this.attacks[0];
};

Weapon.prototype.reload = function() {
	this.ammo.amount.fill();
};

/**
 * Executes the selected attack to a given target if possible.
 * fulfilled promise contains AP-cost of the attack
 */
Weapon.prototype.shootAt = function(target) {

	var deferred = new Deferred();

	//test conditions. can we move on?
	var isInRange = this.owner.position.distanceTo(target.position) <= this.range;
	var hasEnoughAP = this.owner.stats.AP.canSub(this.selectedAttack.apCost);
	var hasEnoughAmmo = this.ammo.amount.val >= this.selectedAttack.ammoCost;


	// function to execute when attack isn't possible
	var rejectFunc = function() {
		!isInRange && console.log("Not in Range");
		!hasEnoughAP && console.log("Not enough AP");
		!hasEnoughAmmo && console.log("Not enough Ammo");

		deferred.reject();
	};

	// if test conditions fail, abort mission!
	if (!isInRange || !hasEnoughAP || !hasEnoughAmmo) {
		rejectFunc();
		return deferred.promise;
	}

	// function to execute when attack was successful
	var resolveFunc = function() {
		this.ammo.amount.sub(this.selectedAttack.ammoCost);
		deferred.resolve(this.selectedAttack.apCost);
	}.bind(this);


	this.selectedAttack.execute(this.owner, target).then(resolveFunc);

	return deferred.promise;
};

//------------------------------------------------------------------------------
//---------------------------Generation Functions-------------------------------
//------------------------------------------------------------------------------

/**
 * Should this be called by the actor?? Yes i think so
 */
Weapon.prototype.setOwner = function(actor) {
	if (!(actor instanceof Actor)) throw new TypeError("Not an actor!");
	this.owner = actor;
};

Weapon.prototype.setAmmo = function(ammo) {
	if (!(ammo instanceof SimpleStat)) throw new TypeError("Not a simplestat!");
	this.ammo.amount = ammo;
};

Weapon.prototype.addAttack = function(attack) {
	if (!(attack instanceof BaseAttack)) throw new TypeError("Not an attack!");

	this.attacks.push(attack);
	if (!this.selectedAttack) this.selectedAttack = attack;
};

Weapon.prototype.toString = function() {
	return this.name + ": " + this.damage + " dmg / Ammo: " + this.ammo.amount.toString() + " " + this.ammo.type
};

