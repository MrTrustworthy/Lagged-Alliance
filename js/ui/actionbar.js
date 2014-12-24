var ActionBar = function() {

	this.parent = document.body;

	this._dom = this._loadDom();

	this.console = new ConsoleTab(this);

	this.selectedTab = new SelectedTab(this);

	this.saveTab = new SaveTab(this);

	this.endTurnTab = new EndTurnTab(this);



}

ActionBar.prototype.select = function(actor) {

	this.selectedTab.setSelected(actor);

}

ActionBar.prototype._loadDom = function() {

	var _dom = document.createElement("div");
	_dom.style.width = "100%";
	_dom.style.height = "150px";
	_dom.style.background = "#7F6534";
	_dom.style.color = "black";
	_dom.style.align = "right";
	_dom.style.overflow = "hidden";

	this.parent.appendChild(_dom);

	return _dom;

}

/**
 * ------------------------------------------------
 */

var SaveTab = function(actionBar) {

	this.parent = actionBar;

	this._dom = this._loadDom();

}

SaveTab.prototype._loadDom = function() {

	var _dom = document.createElement("div");
	_dom.style.width = "250px";
	_dom.style.height = "100%";
	_dom.style.background = "#CCA253";
	_dom.style.color = "white";
	_dom.style.overflow = "scroll"
	_dom.style.display = "inline-block";

	var loadContent = function() {

		_dom.innerHTML = "";


		var txt = document.createElement("INPUT");
		txt.setAttribute("type", "text");
		_dom.appendChild(txt);


		var btn = document.createElement("BUTTON");
		btn.innerHTML = "Save Game";
		btn.onclick = function(evt) {
			console.log("Saving Game");
			window.game.saveGame(txt.value);
		}
		_dom.appendChild(btn);

		var createBtn = document.createElement("BUTTON");
		createBtn.innerHTML = "create random map";
		createBtn.onclick = function(evt) {
			console.log("creating random save");
			window.game.createRandomSaveGame(txt.value);
		}
		_dom.appendChild(createBtn);

		var reloadbtn = document.createElement("BUTTON");
		reloadbtn.innerHTML = "Refresh";
		reloadbtn.onclick = function(evt) {
			loadContent();
		}
		_dom.appendChild(reloadbtn);

		//displays all savegames
		game.dbReady.then(function() {
			game.database.getSavegames().then(function(saves) {
				saves.sort(function(a, b) {
					return a.date - b.date;
				})

				saves.forEach(function(save) {
					var btn = document.createElement("BUTTON");
					btn.innerHTML = "Load: " + save.name;
					btn.onclick = function(evt) {
						console.log("Loading new Save");
						game.loadSavegame(save.name);
					}
					_dom.appendChild(btn);
				});
			});
		});

	}
	loadContent();
	this.parent._dom.appendChild(_dom);
	return _dom;
}


/**
 * ------------------------------------------------
 */


var EndTurnTab = function(actionBar) {

	this.parent = actionBar;

	this._dom = this._loadDom();

}

EndTurnTab.prototype._loadDom = function() {

	var _dom = document.createElement("div");
	_dom.style.width = "250px";
	_dom.style.height = "100%";
	_dom.style.background = "#CCA253";
	_dom.style.color = "white";
	_dom.style.overflow = "scroll"
	_dom.style.display = "inline-block";


	_dom.innerHTML = "";

	var btn = document.createElement("BUTTON");
	btn.innerHTML = "End Turn";
	btn.onclick = function(evt) {
		game.endTurn();
	}
	_dom.appendChild(btn);

	var switchMapBtn = document.createElement("BUTTON");
	switchMapBtn.innerHTML = "Switch Map - (DEBUG)";
	switchMapBtn.onclick = function(evt) {
		game.switchMap(-1);
	}
	_dom.appendChild(switchMapBtn);

	var switchMapBtn2 = document.createElement("BUTTON");
	switchMapBtn2.innerHTML = "Switch Map + (DEBUG)";
	switchMapBtn2.onclick = function(evt) {
		game.switchMap(+1);
	}
	_dom.appendChild(switchMapBtn2);

	this.parent._dom.appendChild(_dom);
	return _dom;
}


/**
 * ------------------------------------------------
 */

var SelectedTab = function(actionBar) {

	this.parent = actionBar;

	this._dom = this._loadDom();

}

SelectedTab.prototype._loadDom = function() {

	var _dom = document.createElement("div");
	_dom.style.width = "250px";
	_dom.style.height = "100%";
	_dom.style.background = "#7F735A";
	_dom.style.color = "white";
	_dom.style.overflow = "hidden"
	_dom.style.display = "inline-block";

	_dom.innerHTML = "Selected:<br>";

	this.parent._dom.appendChild(_dom);
	return _dom;
}


SelectedTab.prototype.setSelected = function(actor) {

	if (!actor) {
		this._dom.innerHTML = "Selected: Nothing";
		return;
	}

	var info = "";
	info += "Selected: " + actor.name + "<br>";
	info += (actor.isAlive ? "HP: " + actor.HP.toString() : "Dead!") + "<br>";
	info += "AP: " + actor.AP.toString() + "<br>";



	this._dom.innerHTML = info;

}

/**
 * -------------------------------------------------------------
 */

var ConsoleTab = function(actionBar) {

	this.parent = actionBar;

	this._dom = this._loadDom();



}

ConsoleTab.prototype._loadDom = function() {

	var _dom = document.createElement("div");
	_dom.style.width = "300px";
	_dom.style.height = "100%";
	_dom.style.background = "#7F6534";
	_dom.style.color = "white";
	_dom.style.overflow = "scroll"
	_dom.style.display = "inline-block";

	_dom.innerHTML = "Console Loaded";

	this.parent._dom.appendChild(_dom);

	setTimeout(function() {

		window.console.log = this.printMessage.bind(this);
	}.bind(this), 100);


	return _dom;
}


ConsoleTab.prototype.printMessage = function(message) {

	this._dom.innerHTML = "" + message.toString() + "<br>" + this._dom.innerHTML;

}