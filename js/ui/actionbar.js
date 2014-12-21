var ActionBar = function() {

	this.parent = document.body;

	this._dom = this._loadDom();

	this.console = new ConsoleTab(this);

	this.selectedTab = new SelectedTab(this);

	this.saveTab = new SaveTab(this);

	this.endTurnTab = new EndTurnTab(this);



}

ActionBar.prototype.select = function(itemName) {

	this.selectedTab.setSelected(itemName);

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

		var btn = document.createElement("BUTTON");
		btn.innerHTML = "Save current Map";

		btn.onclick = function(evt) {
			console.log("Saving map");
			window.game.database.saveCurrentMap().then(function() {

				loadContent();
			});
		}
		_dom.appendChild(btn);


		game.database.getMapList().then(function(mapList) {

			mapList.forEach(function(map) {

				var btn = document.createElement("BUTTON");
				btn.innerHTML = "Load: " + map.name;

				btn.onclick = function(evt) {
					console.log("loading new map");
					game.world.createWorld(map);
				}

				_dom.appendChild(btn);

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


SelectedTab.prototype.setSelected = function(itemName) {

	this._dom.innerHTML = "Selected:<br>" + itemName ? itemName : "Nothing";
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