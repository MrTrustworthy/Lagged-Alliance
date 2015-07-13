var Team = function (typeName) {

    //gets set from the level itself based on the _levelPos
    this.level = null;

    // this gets set when loading a serialized team and used
    // to determine the correct level to put this team into
    this._levelPosition = null;

    this.type = Team.TYPES[typeName];

    this._actors = [];

};

/**
 * Different types for AI, Player and neutrals (TODO)
 */
Team.TYPES = {
    "player": {
        name: "player",
        healthbarColor: 0x3311cc
    },
    "enemy": {
        name: "enemy",
        healthbarColor: 0xcc1133
    }
};


Team.serialize = function (team) {

    var actorList = [];
    team._actors.forEach(function (actor) {
        actorList.push(Actor.serialize(actor));
    });

    return {
        levelPosition: team.level.position,
        typeName: team.type.name,
        actors: actorList
    }
};


/**
 * After deserializing, the team will NOT be automatically in the world
 * The caller needs to make sure it drops them into the right world!!
 */
Team.deserialize = function (save) {

    var team = new Team(save.typeName);

    team._levelPosition = save.levelPosition;

    save.actors.forEach(function (actorSave) {
        team.addActor(Actor.deserialize(actorSave));
    });
    return team;
};


Team.prototype.createRandomTeam = function () {

    var type = qp.chance(50) ? "player" : "enemy";
    this.type = Team.TYPES[type];

    for (var i = 0; i < qp.randInt(3, 6); i++) {

        this.addActor(Actor.createRandomActor());
        //var actor = new Actor();
        // adds the .team to the actor object
        // call this before loading the actor
        //this.addActor(actor);
        //actor.createRandomActor();
    }
};

//------------------------------------------------------------------------------
//---------------------------Functions------------------------------------------
//------------------------------------------------------------------------------

Team.prototype.show = function () {
    this.forEach(function (actor, index) {
        actor.show();
    });
};

Team.prototype.hide = function () {
    this.forEach(function (actor, index) {
        actor.hide();
    });
};

/**
 * Um ok
 */
Team.prototype.forEach = function (func) {
    return this._actors.forEach(func);
};

Team.prototype.filter = function (func) {
    return this._actors.filter(func);
};

Team.prototype.setLevel = function (level) {
    this.level = level;
    this._levelPosition = this.level.position.clone();
};

Team.prototype.getLevel = function () {
    return this.level;
};

Team.prototype.addActor = function (actor) {

    this._actors.push(actor);
    actor.team = this;
};

Team.prototype.removeActor = function (actor) {
    throw new Error("todo");
};

Team.prototype.getActors = function (argument) {
    return this._actors;
};

//------------------------------------------------------------------------------
//---------------------------Complex functions----------------------------------
//------------------------------------------------------------------------------

Team.prototype.removeFromLevel = function () {
    this.level = null;
    this._levelPosition = new Position(-1, -1);
    this.forEach(function (actor) {
        actor.removeFromField();
    });
    this.hide();
};

/**
 * returns whether the team has any actor that can still fight
 */
Team.prototype.hasAliveActors = function () {
    for (var i = 0; i < this._actors.length; i++) {
        if (this._actors[i].isAlive) return true;
    }
    return false;
};

/**
 * Fills
 */
Team.prototype.fillAllAP = function () {
    this.forEach(function (actor) {
        actor.stats.AP.fill();
    });
};

// needed for adding/removing teams
Team.prototype.equals = function (other) {

    var thisActors = this.getActors();
    var otherActors = other.getActors();

    if (thisActors.length !== otherActors.length) return false;

    for (var i = 0; i < thisActors.length; i++) {
        if (!thisActors[i].equals(otherActors[i])) return false;
    }
    return true;
};

testEqualsTeams = function () {
    var teams = window.game.teams;
    console.info(teams[0].equals(teams[0]), "correct: true");
    console.info(teams[1].equals(teams[2]), "correct: false");

};