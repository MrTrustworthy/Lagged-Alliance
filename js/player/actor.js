"use strict";

var Actor = function (name, isAlive) {

    this.name = name || chance.first() + " " + chance.last();
    this.isAlive = (isAlive === undefined) ? true : isAlive;
    this.isBlocking = this.isAlive;

    // can be overwritten by the deserialize-function
    this.stats = PlayerStats.generateRandom();

    //position = null indicates that this not on the map
    // and needs it's position to be newly calculated when dropping him into the lvl
    this.position = null;

    //gets generated as needed
    this.model = null;

    // we save the current rotation so we can serialize it
    this.currentRotation = 0;

    this.visionRange = 15;

    // gets called the first time from the level to place
    // the actor when loading
    this.placedOn = null;

    // gets set from the teamm
    this.team = null;

    this.inventory = new Inventory(this);

    // shortcut for the weapon
    Object.defineProperty(this, "weapon", {
        get: function () {
            return this.inventory._equipped[Inventory.SLOTS.WEAPON];
        },
        set: function (weapon) {
            this.inventory.equipItem(weapon);
        }
    });


    this.healthbar = new HealthBar(this);


    //flags used at runtime
    //this is the flag indicating whether the player is currently moving
    // if this is true, there WILL be a movement-promise which the
    // cancelMovement()-function uses to return its promise
    this.__isMoving = false;
    this.__isMovingPromise = null;

};


//------------------------------------------------------------------------------
//----------------------------Basic Stuff---------------------------------------
//------------------------------------------------------------------------------
Actor.prototype = Object.create(GameObject.prototype);

/**
 *
 * @returns {Actor}
 */
Actor.createRandomActor = function () {
    var a = new Actor();

    var w = new Weapon("AK", 20, 20);
    a.inventory.addItem(w);
    a.weapon = w;

    return a;
};


/**
 * For saving and Loading
 */
Actor.serialize = function (actor) {
    return {
        name     : actor.name,
        isAlive  : actor.isAlive,
        position : actor.position,
        rotation : actor.currentRotation,
        inventory: Inventory.serialize(actor.inventory),
        stats    : PlayerStats.serialize(actor.stats)
    }
};

/**
 * deserialize
 * @param saved
 * @returns {Actor}
 */
Actor.deserialize = function (saved) {
    var player = new Actor(saved.name, saved.isAlive);
    player.position = new Position(saved.position.x, saved.position.y);
    player.currentRotation = saved.rotation;
    player.stats = PlayerStats.deserialize(saved.stats);
    player.inventory = Inventory.deserialize(saved.inventory, player);
    return player;
};

/**
 * Do we need these? Yes!
 */
Actor.prototype.show = function () {
    if (!this.model) this.generateModel();
    this.healthbar.show();
    this.updateModelPosition();
    game.scene.add(this.model);
};

Actor.prototype.hide = function () {
    game.scene.remove(this.model);
    this.model = null;
    this.healthbar.hide();
};

/**
 * Gets called when we change equipped items
 */
Actor.prototype.refreshModel = function () {
    this.hide();
    this.show();
};

//------------------------------------------------------------------------------
//---------------------Battle Actions-------------------------------------------
//------------------------------------------------------------------------------

/**
 * Checks whether this actor is in range to attack another actor
 */
Actor.prototype.isInAttackRange = function (other) {
    return this.position.distanceTo(other.position) <= this.weapon.range;
};


/**
 * Attacks an enemy figure. attack will print out
 * an error message if it fails
 */
Actor.prototype.attack = function (enemy) {

    var deferred = new Deferred();

    // the function that actually executes the shot
    var shootFunc = function () {

        // first rotate towards the enemy
        this.lookAt(enemy).then(function () {

            // then shoot
            this.weapon.shootAt(enemy).then(
                // subtract AP after shooting
                function () {
                    this.isInBattle() && this.stats.AP.sub(this.weapon.apCost);
                    deferred.resolve();
                }.bind(this),

                function(reason){
                    console.log("couldn't attack!", reason);
                    deferred.reject();
                }
            );


        }.bind(this));

    }.bind(this);

    // abort if player has no weapon or if not enough AP
    if (!this.weapon || this.stats.AP.val < this.weapon.apCost)
        deferred.reject();
    // this prevents the actor from moving and shooting at the same time
    else if (this.__isMoving)
        this.abortMovement().then(shootFunc);
    else
        shootFunc();


    return deferred.promise;
};

/**
 * gets executed when the player gets hit
 */
Actor.prototype.hit = function (damage) {
    console.log(this.name + " got hit for " + damage);
    this.stats.HP.sub(damage);
    this.stats.HP.isNegative() && this.kill();
};

/**
 * kills the player. ticks-parameter can be set to 1 to instantly kill the player
 */
Actor.prototype.kill = function (ticks) {

    ticks = ticks || 20;

    // if the player is dead, do nothing
    if (!this.isAlive) return;


    // remove blocking content
    this.placedOn.removeContent(this);
    // add non-blocking content
    this.isAlive = false;
    this.isBlocking = false;
    this.placedOn.placeContent(this);

    var i = 0;
    var killFunc = function () {
        if (i === ticks) {
            window.game.scene.removeEventListener("tick", killFunc);
            return;
        }
        this.model.rotateX(-(Math.PI / 2) / ticks);
        this.model.position.z -= 2.5 / ticks;
        i++;

    }.bind(this);

    window.game.scene.addEventListener("tick", killFunc);
    window.game.fadeOut(this.healthbar.model, ticks / 60);


    this.healthbar.hide();

    // gets used eg. by the controllerQ to check if battle still possible
    this.dispatchEvent({
        type: "killed"
    });

    this.inventory.dropAllItems();

    console.log(this.name + " got killed!");
};

//------------------------------------------------------------------------------
//------------------------------Movement----------------------------------------
//------------------------------------------------------------------------------

Actor.prototype.isInBattle = function () {
    return this.team.level.controllerQ.isInBattle();
};

/**
 * TODO: Do we actually need this??
 * @returns {{player: Array, enemy: Array}}
 */
Actor.prototype.checkSurroundings = function () {

    var inRange = this.team.level.map.getRadius(this.placedOn, this.visionRange);

    var info = {
        player: [],
        enemy : []
    };

    inRange.forEach(function (field) {
        if (!field.occupant) return;

        if (field.occupant instanceof Actor) {
            info[field.occupant.team.type.name].push(field.occupant);
        }

    });
    return info;
};

/**
 * Sticks the player to a target location (updating references etc)
 * @param target
 */
Actor.prototype.placeOn = function (target) {

    if (!(target instanceof Field) || !!target.occupant) console.error("Not a field!");

    target.placeContent(this);
    this.placedOn = target;

    // do we need this? this _should_ already be set correctly
    this.position = target.position.clone();

    // pick up all items on that field
    this.placedOn.items.forEach(function (item) {
        this.placedOn.removeItem(item);
        this.inventory.addItem(item);
    }.bind(this));
};

/**
 * removes the actor from the field it's currently on (eg. to move it to another map)
 */
Actor.prototype.removeFromField = function () {
    this.placedOn.removeContent(this);
    this.placedOn = null;
    this.position = null;
    //this.hide();
};

/**
 * Puts updates the player-model based on the current position
 */
Actor.prototype.updateModelPosition = function () {

    this.model.position.x = this.position.x * Field.FIELD_SIZE;
    this.model.position.y = this.position.y * Field.FIELD_SIZE;

    this.healthbar.updateModelPosition();
};

//------------------------------------------------------------------------------
//---------------------------MOVEMENT FUNCTIONS---------------------------------
//------------------------------------------------------------------------------


/**
 * This cancelles the current movement and returns a promise
 * that gets resolved as soon as all movement is done
 */
Actor.prototype.abortMovement = function () {

    var deferred = new Deferred();

    // abort condition
    if (!this.__isMoving) {
        console.warn("Player is not moving, can't cancel movement");
        deferred.resolve();
        return deferred.promise;
    }

    this.dispatchEvent({
        type: "movementAborted"
    });

    // resolve the deferred after the stopped movement is done;
    this.__isMovingPromise.then(function () {
        console.error("this shouldn't happen!!");
    }, function () {
        deferred.resolve();
    });

    return deferred.promise;
};


/**
 * Calculates a path, then:
 * moves the object to the next node until it reaches the target node.
 */
Actor.prototype.moveTo = function (target) {

    // if the player is already moving, cancel the movement,
    // then recursively call this function again and return
    // the right promise
    if (this.__isMoving) {
        var newPromise = null;
        this.abortMovement().then(function () {
            newPromise = this.moveTo(target);
        }.bind(this));
        return newPromise;
    }

    //-----------------------------------

    // otherwise, just start the movement
    var deferred = new Deferred();

    try {
        var path = this.team.level.map.findPath(this.placedOn, target);
    } catch (e) {
        console.warn("no path could be found");
        deferred.resolve();
        return deferred.promise;
    }

    if (path.length === 0) {
        deferred.resolve();
        return deferred.promise;
    }


    // this is to keep track of
    // a) whether the actor is moving and
    // b) whether the movement should be aborted (interrupts and such)
    this.__isMoving = true;
    this.__isMovingPromise = deferred.promise;
    var movementCancelled = false;

    var cancelFunc = function () {
        movementCancelled = true;
    };
    this.addEventListener("movementAborted", cancelFunc);


    // this is the function that continuously calls the moveToField
    // function based on the movementCancelled boolean
    var moveToNextFunc = function () {

        // this function is called when the movement is done or cancelled
        var endMoveFunc = function () {
            console.log("Movement ended");
            this.__isMoving = false;
            this.removeEventListener("movementAborted", cancelFunc);
            deferred.reject();
        }.bind(this);

        // if we reached the end of our path or get cancelled
        // in between
        if (movementCancelled || path.length === 1) {
            endMoveFunc();
            return;
        }

        path.pop();
        var nextField = path[path.length - 1];

        // call the animation function.
        this.moveToField(nextField).then(
            moveToNextFunc,
            endMoveFunc
        );

    }.bind(this);
    moveToNextFunc();

    return deferred.promise;
};


/**
 * Moves the actor to the given target/field.
 * Gets called by the world to tween the actor to a neighbour tile
 *
 * The return value is a promise which behaves as following:
 * for both rejected and resolved promises:
 * TRUE indicates that the player is not hindered in any further movement
 * FALSE indicates that the player
 * OK SCRATCH THAT I WANT TO RETURN A MOVEMENT-STATE OBJECT!!!!
 */
Actor.prototype.moveToField = function (target) {

    var deferred = new Deferred();

    // calculate the cost to move on
    var _alignCost = this.placedOn.position.calcAlignmentCost(target.position);
    var _moveCost = this.placedOn.fieldType.movementCost;
    var actionPointCost = _alignCost * _moveCost;


    /**
     * Check for abort conditions first
     */
    if (this.stats.AP.val - actionPointCost < 0) {
        console.log("Player has not enough AP to move");
        deferred.reject(false);
        return deferred.promise;
    }

    if (target.isBlocked || !!target.occupant) {
        console.log("There is something in the way!");
        deferred.reject(true);
        return deferred.promise;
    }

    /**
     * Otherwise, proceed with movement and rotation
     */
    console.log("Moving for cost:" + actionPointCost);

    //blocks the target field, so no other player tries to walk on it
    target.block();

    // subtract the AP cost
    if (this.isInBattle()) this.stats.AP.sub(actionPointCost);


    // calculate the points we need to traverse
    var pointList = qp.generateLineSegments(
        this.placedOn.position,
        target.position,
        10 * actionPointCost
    ).slice(1);


    /**
     * this is the function that tweens/animates the movement
     */
    var animateMovement = function () {

        var transPos = pointList.shift();

        this.model.position.x = transPos.x;
        this.model.position.y = transPos.y;
        this.healthbar.updateModelPosition();

        // we're done here, lets end it
        if (pointList.length === 0) {

            // place/remove the actor from the start&end fields
            game.scene.removeEventListener("tick", animateMovement);
            this.placedOn.removeContent(this);

            target.unblock();
            this.placeOn(target);

            deferred.resolve();
        }

    }.bind(this);

    // now do the rotation and then the movement
    this.lookAt(target).then(function () {
        game.scene.addEventListener("tick", animateMovement);
    });


    return deferred.promise;
};

/**
 * This rotates the player model so it looks at the target
 *
 * @param target - field/object with position to look at
 * @returns {Deferred.promise|*}
 */
Actor.prototype.lookAt = function (target) {

    var deferred = new Deferred();

    // thats the current rotation of the model
    var currentRotation = this.model.rotation.z;

    // calculate the target rotation in radians
    var posA = this.position;
    var posB = target.position;
    var targetRotation = Math.atan2(posA.y - posB.y, posA.x - posB.x);

    // the difference a.k.a. how much we want to rotate
    var diff = (targetRotation - currentRotation);

    // optimizing: don't rotate 350° when you can just rotate -10°
    if (diff < 0.1 && diff > 0) diff = 0;
    if (diff > Math.PI) diff = diff - Math.PI * 2;
    if (diff < -Math.PI) diff = diff + Math.PI * 2;

    // calculate how much ticks we want the animation to be played for
    // and the corresponding amount of rotation per tick
    var ticks = Math.abs(Math.floor(diff * 10));
    var stepSize = diff / ticks;


    // tween function gets called every game tick and rotates the model
    var tweenFunc = function () {

        if (ticks === 0) {
            // if no ticks left (or none to begin with when not rotating), resolve!
            this.currentRotation = targetRotation;
            game.scene.removeEventListener("tick", tweenFunc);
            deferred.resolve();
        } else {
            // rotate the model
            this.model.rotateZ(stepSize);
            ticks--;
        }


    }.bind(this);

    game.scene.addEventListener("tick", tweenFunc);

    return deferred.promise;
};


/**
 * Generates the model for the actor and the sprite
 */
Actor.prototype.generateModel = function () {

    var geometry = new THREE.BoxGeometry(3, 3, 8, 1, 1, 1);


    // adds all equipped items to the model
    this.inventory.getEquippedItems().forEach(function (item) {
        geometry.mergeMesh(item.generateModel());
    });

    var material = game.textureManager.getTexture("player").clone();

    this.model = new THREE.Mesh(geometry, material);

    this.model.position.x = 0;
    this.model.position.y = 0;

    //if the player is dead, adapt the model
    if (this.isAlive) {
        this.model.position.z = 4;
    } else {
        this.model.rotateX(Math.PI / 2);
        this.model.position.z = 1.5;
    }

    this.model.rotateZ(this.currentRotation);

    //this.model.rotationAutoUpdate = false;
    this.model.userData = this;
};

/**
 * guess what that does
 */
Actor.prototype.equals = function (other) {
    return this.name === other.name && this.position.equals(other.position);
};

THREE.EventDispatcher.prototype.apply(Actor.prototype);