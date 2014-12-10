var Database = function() {

	this._db = null;

}

Database.prototype.init = function() {


		var openRequest = indexedDB.open("test", 1);

		openRequest.onupgradeneeded = function(res) {
			console.log("Upgrading...");

			this._db = res.target.result;

			if(!this._db.objectStoreNames.contains("seeds")){
				this._db.createObjectStore("seeds");
			}

		}

		openRequest.onsuccess = function(res) {
			console.log("Success!");
			db = res.target.result;
		}

		openRequest.onerror = function(res) {
			console.log("Error");

		}


		openRequest.onblocked = function(){
			console.error("Database Blocked!");
		}

	}