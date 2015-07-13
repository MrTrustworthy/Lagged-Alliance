var Weapon = function (name, range, damage, apCost, ammoCost) {

    // call parent constructor with equip slot as param
    EquippableItem.call(this, name, Inventory.SLOTS.WEAPON);

    // The range doesn't limit the shooting but decreases accuracy
    this.range = range;

    this.damage = damage;

    this.apCost = apCost || 1;

    this.ammoCost = ammoCost || 1;

    this.attack = new SingleShot();

    this.ammo = {type: "stub", val: 20, sub: function(){}};

};

Weapon.prototype = Object.create(EquippableItem.prototype);

/**
 * IMPORTANT! add a final item class to the list of items
 */
Item.FINAL_CLASSES.WEAPON = Weapon;

/**
 *
 * @param weapon
 * @returns {{name: *, range: (*|Armory.range|qp.range|CSSStyleDeclaration.range|Weapon.range), damage: (*|Armory.damage|BaseAttack.damage|Weapon.damage)}}
 */
Weapon.serialize = function (weapon) {
    return {
        name    : weapon.name,
        range   : weapon.range,
        damage  : weapon.damage,
        apCost  : weapon.apCost,
        ammoCost: weapon.ammoCost
    }
};

/**
 *
 * @param save
 * @returns {Weapon}
 */
Weapon.deserialize = function (save) {
    return new Weapon(
        save.name,
        save.range,
        save.damage,
        save.apCost,
        save.ammoCost
    );
};


//------------------------------------------------------------------------------
//---------------------------Basic Functions------------------------------------
//------------------------------------------------------------------------------

/**
 * this should ONLY be called if the item is dropped somewhere!
 * For equipped items, the actors will handle displaying themselves!
 */
Weapon.prototype.show = function () {
    if (!(this.container instanceof Field)) throw new RangeError("Not possible!");

    this.generateModel();
    this.model.position.x = this.container.position.x * Field.FIELD_SIZE;
    this.model.position.y = this.container.position.y * Field.FIELD_SIZE;
    game.scene.add(this.model);
};

/**
 * Hides the weapons model
 */
Weapon.prototype.hide = function () {
    if (!(this.container instanceof Field)) throw new RangeError("Not possible!");
    if (!this.model) throw new RangeError("Not possible!");

    game.scene.remove(this.model);
    delete this.model;
};

/**
 * generates the weapons model either for the player to display the equipped items,
 * or for this.show() when it's dropped on a field
 * @returns {THREE.Mesh|*}
 */
Weapon.prototype.generateModel = function () {
    var geometry = new THREE.BoxGeometry(9, 1, 1);
    var material = game.textureManager.getTexture("tree");
    this.model = new THREE.Mesh(geometry, material);
    this.model.userData = this;
    return this.model;
};


/**
 * Executes the selected attack to a given target if possible.
 * fulfilled promise contains AP-cost of the attack
 * @param target to shoot at
 * @returns {Deferred.promise|*} resolves with the AP-cost
 */
Weapon.prototype.shootAt = function (target) {
    var deferred = new Deferred();

    // if we don't have enough ammo, abort instantly
    if(this.ammo.val < this.ammoCost){
        deferred.reject("not enough ammo");
        return deferred.promise;
    }


    var player = this.container.owner;

    // accuracy is the hit change based on the given range of a weapon
    var accuracy = player.stats.attributes.accuracy.val;
    var range = this.range;
    var distance = player.position.distanceTo(target.position);

    // calculate whether we've hit

    // TODO: what should be the maximum chance to hit??
    var maxHitChance = 90;

    var accuracyDecay = (100 - accuracy) / range;
    var hitChance = maxHitChance - (accuracyDecay * distance);
    console.info("Hit chance:", hitChance);
    var hasHit = qp.chance(hitChance);

    // that's the function executing after playing the attack animation
    var resolveFunc = function (affectedTargets) {

        if (hasHit) {
            // hit all affected targets (we get those from the attack)
            // we do it like that because of collateral damage causing more hit elements
            affectedTargets.forEach(function (targ) {
                console.info("Hit:", targ);
                targ.hit(this.damage);
                this.ammo.sub(this.ammoCost);
            }.bind(this));

        } else {
            console.log("Missed the target!");
        }

        deferred.resolve();

    }.bind(this);

    this.attack.execute(player, target).then(resolveFunc);

    return deferred.promise;
};

/**
 *
 * @returns {string}
 */
Weapon.prototype.toString = function () {
    return this.name + " [Dmg: " + this.damage + " Range: " + this.range + "]";
};

