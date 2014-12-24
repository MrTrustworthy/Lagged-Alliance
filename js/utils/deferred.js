var Deferred = function() {

	this.FULFILLED = 0;
	this.REJECTED = 1;
	this.UNFULFILLED = 2;

	this.promise = new Promise();

	this.state = this.UNFULFILLED;
}


Deferred.prototype.resolve = function(value, strict) {

	if (this.state === this.UNFULFILLED) {
		this.promise._resolveFunctions.forEach(function(func) {
			func(value);
		});

		this.state = this.FULFILLED;
		this.promise.state = this.FULFILLED;

		this.promise.endValue = value;
		return true;

	} else if (!!strict) {
		throw new Error("Promise already", this.state);
	}
	return false;
}

Deferred.prototype.reject = function(error, strict) {
	if (this.state === this.UNFULFILLED) {
		this.promise._rejectFunctions.forEach(function(func) {
			func(error);
		});

		this.state = this.REJECTED;
		this.promise.state = this.REJECTED;

		this.promise.endValue = error;
		return true;

	} else if (!!strict) {
		throw new Error("Promise already", this.state);
	}
	return false;
}

Deferred.prototype.update = function(value, strict) {
	if (this.state === this.UNFULFILLED) {
		this.promise._updateFunctions.forEach(function(func) {
			func(value);
		});
		return true;

	} else if (!!strict) {
		throw new Error("Promise already", this.state);
	}
	return false;
}



var Promise = function() {

	this.FULFILLED = 0;
	this.REJECTED = 1;
	this.UNFULFILLED = 2;

	this.state = this.UNFULFILLED;
	this.endValue = null;

	this.deferred = null;

	this._resolveFunctions = [];

	this._rejectFunctions = [];

	this._updateFunctions = [];

}

Promise.prototype.then = function(onResolve, onError, onUpdate) {

	this.deferred = this.deferred || new Deferred();

	if (onResolve) {
		//if the deferred is already resolved, trigger the function right now
		if (this.state === this.FULFILLED) {
			console.info("Is fulfilled already, executing");
			onResolve(this.endValue);
		}
		// else put it in queue
		this._resolveFunctions.push(function(value) {
			this.deferred.resolve(onResolve(value));
		}.bind(this));
	}

	if (onError) {
		//if the deferred is already rejected, trigger the function right now
		if (this.state === this.REJECTED) {
			console.info("Is rejected already, executing");
			onError(this.endValue);
		}
		// else put it in queue
		this._rejectFunctions.push(function(error) {
			this.deferred.reject(onError(error));
		}.bind(this));
	}

	if (onUpdate) {
		this._updateFunctions.push(function(value) {
			this.deferred.update(onUpdate(value));
		}.bind(this));
	}

	return this.deferred.promise;

}