/**
 * The player controller gets initialized and filled with players
 * BEFORE the world is created!
 */
var AIController = function () {

    PlayerController.apply(this, arguments);
};

AIController.prototype = Object.create(PlayerController.prototype);


/**
 * Takes the given input and updates the actor according to it
 */
AIController.prototype.startTurn = function () {

    //cloning the list
    var charList = [];
    this.teams.forEach(function (team) {
        team.forEach(function (actor) {
            if (actor.isAlive) charList.push(actor);
        });
    });

    var level = window.game.gameWorld.activeLevel;
    var cam = window.game.gameCamera;

    var updateFunc = function () {
        if (charList.length === 0) {
            cam.unstick();
            game.endTurn();
            return;
        }
        var actor = charList.shift();
        cam.stick(actor);
        // move the actor, then call this function again
        this.updateActor(actor).then(updateFunc);
    }.bind(this);

    updateFunc();
};


AIController.prototype.updateActor = function (actor) {

    var deferred = new Deferred();

    var map = game.getLevel().map;

    var patrolDestination = map.getFreeField();

    var path = map.findPath(actor.placedOn, patrolDestination);


    var checkAndMove = function () {

        var visible = actor.checkSurroundings();

        var enemy = visible.player[0];

        if (!!enemy && !this.isMember(enemy)) {
            console.info("found enemy!");

            if (actor.isInAttackRange(enemy)) {

                actor.attack(enemy).then(
                    checkAndMove
                );

            }

        } else {

            path.pop();
            var goTo = path[path.length - 1];

            if (!goTo) {
                deferred.resolve();
                return;
            }

            actor.moveToField(goTo).then(
                checkAndMove,
                function () {
                    deferred.resolve();
                }
            );


        }

    }.bind(this);

    checkAndMove();
    return deferred.promise;

};

AIController.approachEnemy = function (actor, enemy) {

};

/**
 * Re-fills action-points
 */
AIController.prototype.endTurn = function () {

    this.teams.forEach(function (team) {
        team.fillAllAP();
    });
};

/**
 * Takes the given input and updates the player according to it
 */
AIController.prototype.update = function () {

};