var ActionBar = function (game) {

    this.parent = document.body;

    this._dom = document.getElementById("uiBar");

    this.console = new ConsoleTab(this);

    this.selectedTab = new SelectedTab(this, game);

    this.saveTab = new SaveTab(this, game);

    this.endTurnTab = new EndTurnTab(this, game);
};

/**
 *
 * @param actor
 */
ActionBar.prototype.select = function (actor) {
    this.selectedTab.setSelected(actor);
};

/**
 *
 * @param actionBar
 * @param game
 * @constructor
 */
var SaveTab = function (actionBar, game) {
    this.parent = actionBar;
    this._dom = this._loadDom(game);
};

/**
 *
 * @param game
 * @returns {HTMLElement}
 * @private
 */
SaveTab.prototype._loadDom = function (game) {

    var _dom = document.getElementById("saveTab");

    var loadContent = function () {

        _dom.innerHTML = "";

        var txt = document.createElement("INPUT");
        txt.setAttribute("type", "text");
        _dom.appendChild(txt);


        var btn = document.createElement("BUTTON");
        btn.innerHTML = "Save Game";
        btn.onclick = function (evt) {
            console.log("Saving Game");
            game.saveGame(txt.value);
        };
        _dom.appendChild(btn);

        var createBtn = document.createElement("BUTTON");
        createBtn.innerHTML = "create random map";
        createBtn.onclick = function (evt) {
            console.log("creating random save");
            game.createRandomSaveGame(txt.value);
        };
        _dom.appendChild(createBtn);

        var reloadbtn = document.createElement("BUTTON");
        reloadbtn.innerHTML = "Refresh";
        reloadbtn.onclick = function (evt) {
            loadContent();
        };
        _dom.appendChild(reloadbtn);

        //displays all savegames
        game.dbReady.then(function (database) {
            database.getSavegames().then(function (saves) {
                saves.sort(function (a, b) {
                    return b.date - a.date;
                });

                saves.forEach(function (save) {
                    var btn = document.createElement("BUTTON");
                    btn.innerHTML = "Load: " + save.name;
                    btn.onclick = function (evt) {
                        console.log("Loading new Save");
                        game.loadSavegame(save.name);
                    };
                    _dom.appendChild(btn);
                });

                // game.loadSavegame(saves[0].name);
            });
        });

    };
    loadContent();
    return _dom;
};


/**
 *
 * @param actionBar
 * @param game
 * @constructor
 */
var EndTurnTab = function (actionBar, game) {
    this.parent = actionBar;
    this._dom = this._loadDom(game);
};


/**
 *
 * @param game
 * @returns {HTMLElement}
 * @private
 */
EndTurnTab.prototype._loadDom = function (game) {

    var _dom = document.getElementById("commandTab");

    _dom.innerHTML = "";

    var btn = document.createElement("BUTTON");
    btn.innerHTML = "End Turn";
    btn.onclick = function (evt) {
        game.endTurn();
    };
    _dom.appendChild(btn);

    var btn2 = document.createElement("BUTTON");
    btn2.innerHTML = "Toggle Edit Mode";
    btn2.onclick = function (evt) {
        game.editMode = !game.editMode;
    };
    _dom.appendChild(btn2);

    var volumeSlider = document.createElement("INPUT");
    volumeSlider.setAttribute("type", "range");
    volumeSlider.setAttribute("min", "0");
    volumeSlider.setAttribute("max", "100");
    volumeSlider.setAttribute("value", game.audio.volume);
    // volumeSlider.innerHTML = "End Battle";
    volumeSlider.oninput = function (evt) {
        game.audio.setVolume(volumeSlider.value);
    };
    _dom.appendChild(volumeSlider);

    return _dom;
};

/**
 *
 * @param actionBar
 * @param game
 * @constructor
 */
var SelectedTab = function (actionBar, game) {
    this.parent = actionBar;
    this.game = game;
    this._dom = this._loadDom();
    this.__selected = null;

    game.scene.addEventListener("tick", function () {
        this.setSelected(this.__selected);
    }.bind(this));

};

/**
 *
 * @returns {HTMLElement}
 * @private
 */
SelectedTab.prototype._loadDom = function () {

    var _dom = document.getElementById("selectedTab");

    _dom.innerHTML = "Selected:<br>";

    return _dom;
};

/**
 *
 * @param actor
 */
SelectedTab.prototype.setSelected = function (actor) {

    if (!actor) {
        this._dom.innerHTML = "Selected: Nothing";
        this.__selected = null;
        return;
    }

    this.__selected = actor;

    var info = "";
    info += "Selected: " + actor.name + "<br>";
    info += (actor.isAlive ? "HP: " + actor.stats.HP.toString() : "Dead!") + "<br>";
    info += "AP: " + actor.stats.AP.toString() + "<br>";
    if(actor.weapon) info += "Weapon: " + actor.weapon.toString() + "<br>";
    //info += "Selected Attack: " + actor.weapon.selectedAttack.toString() + "<br>";

    this._dom.innerHTML = info;
};


/**
 *
 * @param actionBar
 * @constructor
 */
var ConsoleTab = function (actionBar) {
    this.parent = actionBar;
    this._dom = this._loadDom();
};

/**
 *
 * @returns {HTMLElement}
 * @private
 */
ConsoleTab.prototype._loadDom = function () {

    var _dom = document.getElementById("consoleTab");

    _dom.innerHTML = "Console Loaded";

    setTimeout(function () {
        window.console.log = this.printMessage.bind(this);
    }.bind(this), 100);

    return _dom;
};

/**
 *
 * @param message
 */
ConsoleTab.prototype.printMessage = function (message) {

    this._dom.innerHTML = "" + message.toString() + "<br>" + this._dom.innerHTML;

};