/**
 * The player controller gets initialized and filled with players
 * BEFORE the world is created!
 */
var PlayerController = function () {

    this.teams = [];

    this.selected = null;
};


/**
 * adds a Actor to this instance
 */
PlayerController.prototype.addTeam = function (team) {
    this.teams.push(team);
};

PlayerController.prototype.addTeams = function (teamList) {
    teamList.forEach(function (team) {
        this.addTeam(team);
    }.bind(this));
};

/**
 * removes all actors for cleanup purposes
 */
PlayerController.prototype.removeTeam = function (team) {
    this.deselect();

    var index = -1;
    this.teams.forEach(function (tm, i) {
        if (tm.equals(team)) index = i;
    });

    if (index === -1) throw new Error("Team not in controller!!");

    return this.teams.splice(index, 1);
};

/**
 * Do we need this??
 */
PlayerController.prototype.removeAllTeams = function () {
    this.deselect();
    this.teams = [];
};

/**
 * returns all actors in a list
 */
PlayerController.prototype.getTeams = function () {
    return this.teams;
};

/**
 * wrapper for the team.hasAliveActors to find out whether
 * the controller is able to fight
 */
PlayerController.prototype.hasAliveActors = function () {
    for (var i = 0; i < this.teams.length; i++) {
        if (this.teams[i].hasAliveActors()) return true;
    }
    return false;
};

/**
 * returns the currently selected element if it's a member of this controller
 */
PlayerController.prototype.getSelectedMember = function () {
    if (this.isMember(this.selected)) return this.selected;
};

/**
 * Function that gets executed at the start of a turn
 */
PlayerController.prototype.startTurn = function () {

    //discard the input that happened in absence
    //this.inputHandler.getInput();

    game.gameCamera.loadPosition("playerController");
};

/**
 * Function that gets executed at the start of a turn
 */
PlayerController.prototype.endTurn = function () {
    this.teams.forEach(function (team) {
        team.fillAllAP();
    });
    game.gameCamera.savePosition("playerController");
};


/**
 * sets a given item as "selected"
 */
PlayerController.prototype.select = function (actor) {

    if (!actor) throw new Error("No item to set selected");
    this.selected = actor;
    game.actionBar.select(actor);
};


/**
 * Removes the current selection
 */
PlayerController.prototype.deselect = function () {

    this.selected = null;
    game.actionBar && game.actionBar.select(null);
};

PlayerController.prototype.currentLevel = function () {
    return game.gameWorld.activeLevel;
};
/**
 * Takes the given input and updates the player according to it
 */
PlayerController.prototype.update = function (input) {

    //var input = this.inputHandler.getInput();

    if (input.scroll !== 0) {
        var i = 0;
        var scrollFunc = function () {
            if (i === 15) {
                game.scene.removeEventListener("tick", scrollFunc);
            }
            game.gameCamera.move(0, 0, -input.scroll / 2);
            i++;
        }.bind(this);
        game.scene.addEventListener("tick", scrollFunc);
    }

    switch (input.state) {

        // when nothing was clicked and the mouse is just moving around
        case input.states.DEFAULT:
            if (!!this.selected && this.isMember(this.selected)) {
                var objects = this._getObjectsOnMousePos(input.currMousePos);
                var field = this._checkForField(objects);
                if (!!field) {
                    field.blink(20);
                    // this was used to display the full path an actor would take
                    // use later on for debugging
                    // try {
                    // 	var map = game.gameWorld.activeLevel.map;
                    // 	var path = map.findPath(this.selected.placedOn, field);
                    // 	path.forEach(function(element, index) {
                    // 		element.blink(20);
                    // 	});
                    // } catch (e) {
                    // 	console.warn("no path to display");
                    // }
                }
            }
            break;

        case input.states.RIGHTCLICKED:
            this.deselect();
            break;

        case input.states.DRAGGING:
            var difference = input.currMousePos.diff(input.lastMousePos);
            game.gameCamera.move(difference.x / 10, -difference.y / 10, 0);
            break;

        case input.states.CLICKED:

            var objects = this._getObjectsOnMousePos(input.currMousePos);
            var actor = this._checkForActors(objects);
            var field = this._checkForField(objects);

            //this is where we actually do something!!!

            // open edit dialog if we're in edit mode
            if(game.editMode){
                new EditDialog().toggle(field);
            //if we don't have anything selected right now
            }else if (!this.selected) {

                if (!!actor) this.select(actor);
                else this.deselect();

                // if we have something selected already,
                // we need to check if that actor belongs to us
            } else if (!!this.selected) {

                //if the currently selected item belongs to us
                if (this.isMember(this.selected)) {

                    // if we clicked on an actor
                    if (!!actor && actor.isAlive) {

                        //ATTACK!
                        if (!this.isMember(actor)) {
                            this.selected.attack(actor);
                        } else {
                            this.select(actor);
                        }

                        //if we clicked just on a field
                    } else if (!!field) {
                        // game.gameWorld.activeLevel.moveTo(
                        this.selected.moveTo(field);
                        //this.deselect();
                    } else {
                        //????
                    }
                } else {
                    this.deselect();
                }
            }
            break;
    }

    //this.inputHandler.reset();

};

/**
 * checks whether the passed actor is registered here
 */
PlayerController.prototype.isMember = function (actor) {

    if (!actor) return false;

    var isMember = false;

    this.teams.forEach(function (team) {
        team.forEach(function (element, index) {
            if (element.name === actor.name) isMember = true;
        });
    });

    return isMember;
};


/**
 * checks if an actor can be found in the given gameobjects and returns it
 */
PlayerController.prototype._checkForActors = function (gameObjects) {

    var actors = [];
    gameObjects.forEach(function (element, index) {

        if (element instanceof Actor) {

            actors.push(element);

        } else if (element instanceof Field && !!element.occupant &&
            element.occupant instanceof Actor) {

            actors.push(element.occupant);
        }
    }.bind(this));

    return actors[0];
};

/**
 * checks if a field can be found in the given gameobjects and returns it
 */
PlayerController.prototype._checkForField = function (gameObjects) {

    var fields = [];
    gameObjects.forEach(function (element, index) {
        if (element instanceof Field) {
            fields.push(element);
        }
    });

    return fields[0];
};


/**
 * Returns all elements under a given mouse-position
 */
PlayerController.prototype._getObjectsOnMousePos = function (position) {

    var magicVector = new THREE.Vector3(
        (position.x / game.WIDTH) * 2 - 1, -(position.y / game.HEIGHT) * 2 + 1,
        0.5
    ).unproject(game.gameCamera.getCamera()).sub(game.gameCamera.getPosition()).normalize();


    var ray = new THREE.Raycaster(
        game.gameCamera.getPosition(),
        magicVector,
        0,
        5000
    );

    var selectedElements = [];

    // determine collisions
    ray.intersectObjects(game.scene.children).forEach(function (element, index) {
        selectedElements.push(element.object.userData);
    });

    // return the results
    return selectedElements
};