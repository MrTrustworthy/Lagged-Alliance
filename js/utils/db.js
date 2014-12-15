var Database = function() {

	this._db = null;

}

/**
 * Connects the this._db property to the database instance
 */
Database.prototype.init = function() {

	var deferred = new Deferred();

	var openRequest = indexedDB.open("gamedb", 2);

	openRequest.onupgradeneeded = function(res) {
		console.log("Upgrading...");

		this._db = res.target.result;

		if (!this._db.objectStoreNames.contains("maps")) {
			this._db.createObjectStore("maps", {
				keyPath: "name"
			});
		}

	}.bind(this);

	openRequest.onsuccess = function(res) {
		this._db = res.target.result;
		deferred.resolve(this._db);
		console.log("Database up and running", this._db);
	}.bind(this);

	openRequest.onerror = function(res) {
		deferred.reject()
		console.log("Error");

	}
	openRequest.onblocked = function() {
		deferred.reject();
		console.error("Database Blocked!");
	}

	return deferred.promise;
}


/**
 * Saves the currently loaded map either by a given name
 * or by a random string
 */
Database.prototype.saveCurrentMap = function(saveName) {

	var deferred = new Deferred();

	saveName = saveName || Math.random().toString(36).substring(7);

	var transaction = this._db.transaction(["maps"], "readwrite");
	var store = transaction.objectStore("maps");

	var map = {
		name: saveName,
		fields: []
	};
	window.game.world.map.forEach(function(field, x, y) {
		var fld = {
			position: field.position,
			type: field.fieldType
		}
		map.fields.push(fld);
	})

	var request = store.add(map);

	request.onsuccess = function(r) {
		console.log("Saved Map!", r);
		deferred.resolve(r);
	}
	request.onerror = function(r) {
		console.error("Error Saving map!", r);
		deferred.reject(r);
	}

	return deferred.promise;
}


/**
 * Loads and returns all currently saved maps
 */
Database.prototype.getMapList = function() {

	var deferred = new Deferred();

	var transaction = this._db.transaction("maps", "readonly");
	var store = transaction.objectStore("maps");

	var maps = [];

	var request = store.openCursor();

	request.onsuccess = function(evt) {
		var cursor = evt.target.result;
		if (cursor) {
			maps.push(cursor.value);
			deferred.update(cursor.value);
			cursor.continue();
		}
	}

	request.onerror = function(e) {
		console.error("Couldn't load all!", e);
	}

	transaction.oncomplete = function() {
		deferred.resolve(maps);
	}

	return deferred.promise;
}