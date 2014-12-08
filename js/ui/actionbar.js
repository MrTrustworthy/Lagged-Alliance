var ActionBar = function() {

	this.parent = document.body;

	this._dom = this._loadDom();

	this.console = new ConsoleTab(this);

	this.selectedTab = new SelectedTab(this);

	this.commandTab = new CommandTab(this);



}

ActionBar.prototype.select = function(itemName) {

	this.selectedTab.setSelected(itemName);

}

ActionBar.prototype._loadDom = function() {

	var _dom = document.createElement("div");
	_dom.style.width = "100%";
	_dom.style.height = "150px";
	_dom.style.background = "#E0FFFF";
	_dom.style.color = "black";
	_dom.style.align = "right";
	_dom.style.overflow = "hidden";

	this.parent.appendChild(_dom);

	return _dom;

}

/**
 * ------------------------------------------------
 */

var CommandTab = function(actionBar) {

	this.parent = actionBar;

	this._dom = this._loadDom();

}

CommandTab.prototype._loadDom = function() {

	var _dom = document.createElement("div");
	_dom.style.width = "250px";
	_dom.style.height = "100%";
	_dom.style.background = "#990099";
	_dom.style.color = "white";
	_dom.style.overflow = "hidden"
	_dom.style.display = "inline-block";

	_dom.innerHTML = "Command:";

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
	_dom.style.background = "#109090";
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
	_dom.style.background = "#808080";
	_dom.style.color = "white";
	_dom.style.overflow = "scroll"
	_dom.style.display = "inline-block";

	_dom.innerHTML = "Console Loaded";

	this.parent._dom.appendChild(_dom);
	return _dom;
}


ConsoleTab.prototype.printMessage = function(message) {

	this._dom.innerHTML = "" + message + "<br>" + this._dom.innerHTML;

}