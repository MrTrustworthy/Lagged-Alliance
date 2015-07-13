var Database = function() {

	this._db = null;

	this.isLoaded = false;

};

/**
 * Connects the this._db property to the database instance
 */
Database.prototype.init = function() {

	var deferred = new Deferred();

	var openRequest = indexedDB.open("gamedb", 6);

	openRequest.onupgradeneeded = function(res) {
		console.log("Upgrading...");

		this._db = res.target.result;

		if (!this._db.objectStoreNames.contains("savegames")) {
			this._db.createObjectStore("savegames", {
				keyPath: "date"
			});
		}

	}.bind(this);

	openRequest.onsuccess = function(res) {
		this._db = res.target.result;
		console.log("Database up and running", this._db);
		this.isLoaded = true;
		deferred.resolve(this);
	}.bind(this);

	openRequest.onerror = function(res) {
		console.log("Error");
		deferred.reject()

	};
	openRequest.onblocked = function() {
		console.error("Database Blocked!");
		deferred.reject();
	};

	return deferred.promise;
};

//------------------------------------------------------------------------------
//---------------------Saving Games---------------------------------------------
//------------------------------------------------------------------------------


/**
 * Saves the currently loaded game
 */
Database.prototype.saveGame = function(savegame) {

	var deferred = new Deferred();

	var transaction = this._db.transaction(["savegames"], "readwrite");

	var store = transaction.objectStore("savegames");
	var request = store.add(savegame);

	request.onsuccess = function(r) {
		console.log("Saved Game!", r);
		deferred.resolve(r);
	};
	request.onerror = function(r) {
		console.log("Couldn't save a game with this name");
		deferred.reject(r);
	}

};

/**
 * Loads and returns all currently saved maps
 */
Database.prototype.getSavegames = function() {

	var deferred = new Deferred();

	var transaction = this._db.transaction("savegames", "readonly");
	var store = transaction.objectStore("savegames");

	var savegames = [];

	var request = store.openCursor();

	request.onsuccess = function(evt) {
		var cursor = evt.target.result;
		if (cursor) {
			savegames.push(cursor.value);
			deferred.update(cursor.value);
			cursor.continue();
		}
	};

	request.onerror = function(e) {
		console.error("Couldn't load all!", e);
	};

	transaction.oncomplete = function() {
		deferred.resolve(savegames);
	};

	return deferred.promise;
};
