"use strict";

var Level = function (pos) {

    this.position = new Position(pos.x, pos.y);

    this.map = null;

    this.ambientLight = new THREE.AmbientLight(0x909090);

    this.gameObjects = [];

    // the items dropped on some fields
    //this.items = [];

    this.teams = [];

    this.controllerQ = new ControllerQ();
};

//------------------------------------------------------------------------------
//---------------------------Show/Hide/De-Serialize-----------------------------
//------------------------------------------------------------------------------
Level.prototype.refresh = function () {
    this.hide();
    this.show();
};

Level.prototype.show = function () {
    game.scene.add(this.ambientLight);
    this.map.show();

    this.teams.forEach(function (team) {
        team.show();
    });

    this.gameObjects.forEach(function (object) {
        object.show();
    });

    window.game.audio.playSound("ambient");
};

Level.prototype.hide = function () {
    game.scene.remove(this.ambientLight);
    this.map.hide();

    this.teams.forEach(function (team) {
        team.hide();
    });

    this.gameObjects.forEach(function (object) {
        object.hide();
    });

    window.game.audio.stopSound("ambient");
};

/**
 *
 * @param level
 * @returns {{position: (*|Tree.serialize.position|Field.serialize.position|Actor.serialize.position|CSSStyleDeclaration.position|position), map: *, objects: Array}}
 */
Level.serialize = function (level) {

    // get all the environmentobjects serialized
    var objectList = [];
    level.gameObjects.forEach(function (obj) {
        objectList.push(EnvironmentObject.serialize(obj));
    });

    return {
        position: level.position,
        map     : GameMap.serialize(level.map),
        objects : objectList
    }
};

/**
 *
 * @param save
 * @returns {Level}
 */
Level.deserialize = function (save) {

    var level = new Level(save.position);
    level.map = GameMap.deserialize(save.map);

    save.objects.forEach(function (object) {
        var obj = EnvironmentObject.deserialize(object);
        var field = level.map.get(obj.position.x, obj.position.y);
        level.addObject(obj, field);
    });

    return level;
};


//------------------------------------------------------------------------------
//----------------------World population----------------------------------------
//------------------------------------------------------------------------------

/**
 * Border is optional.
 * if not omitted and the player has no specified position, create random positions
 */
Level.prototype.addTeam = function (team, border) {

    this.controllerQ.addTeam(team);

    // set refs for the team
    this.teams.push(team);
    team.setLevel(this);

    // load the players to the correct fields
    team.forEach(function (player) {

        // if the player position isn't set, he was just newly
        // created and we need to look for a free field ourselves
        var fld;
        if (!player.position) {
            console.info("no previous position found for this player, generating...");
            // either generate a "random" field if there is no border specified (first load)
            // or drop then in at a specific border (when called from transitioning teams)
            if (!!border) fld = chance.shuffle(this.map.getBorderFields(border, true))[0];
            else fld = this.map.getFreeField();

        } else { // if there is a position specified in the player (from loading a savegame);
            fld = this.map.get(player.position);
        }
        // console.info("dropping player", player, "on field", fld, "in level", this);
        player.placeOn(fld);
    }.bind(this));
};


/**
 *  Removes a team from this level to place it somewhere else
 * @param team
 */
Level.prototype.removeTeam = function (team) {

    this.controllerQ.removeTeam(team);

    // find out which team to remove
    var index = -1;
    this.teams.forEach(function (tm, i) {
        if (tm.equals(team)) index = i;
    });
    if (index === -1) throw new Error("Team not in level!!");
    // remove team from list;
    this.teams.splice(index, 1);

    team.removeFromLevel();
};

/**
 * Adds an item to a field in this level
 * @param object
 * @param field
 */
Level.prototype.addObject = function (object, field) {
    this.gameObjects.push(object);
    object.placeOn(field);
    //object.show();
};

/**
 * Removes an object from the game
 * @param object
 */
Level.prototype.removeObject = function (object) {
    var i = this.gameObjects.indexOf(object);
    if (i === -1) throw new Error("Dont have that object");

    this.gameObjects.splice(i, 1);
    object.remove();
};

//------------------------------------------------------------------------------
//---------------------------Randomizer-----------------------------------------
//------------------------------------------------------------------------------

/**
 * Generates a completely random Level.
 */
Level.prototype.createRandomLevel = function () {

    //load random map
    this.map = new GameMap(50);
    this.map.loadRandomMap();

    //load random objects
    for (var i = 0; i < 30; i++) {
        this.addObject(
            EnvironmentObject.createRandom(),
            this.map.getFreeField()
        );
    }
};

/**
 *
 * @param other
 * @returns {*}
 */
Level.prototype.equals = function (other) {
    return this.position.equals(other.position);
};
