var WorldEvent = function(name, fieldRef) {

	this.name = name;
	this.field = fieldRef;

};


WorldEvent.prototype.execute = function() {
	console.error("this shouldnt happen");
	return null;
};


//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------

var ExplosionScript = function(fieldRef) {
	WorldEvent.apply(this, ["explosion", fieldRef]);
};

ExplosionScript.prototype = Object.create(WorldEvent.prototype);

ExplosionScript.prototype.execute = function() {

	if (this.isActive) {
		console.log("BOOM");
		var explosion = new Explosion(
			this.field,
			2,
			20
		);
		explosion.start();
	}

};

//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
var TravelScript = function(fieldRef) {
	WorldEvent.apply(this, ["travel", fieldRef]);
};

TravelScript.prototype = Object.create(WorldEvent.prototype);

TravelScript.prototype.execute = function() {
	console.log("Traveling");
};

//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------

var WorldEventList = {
	// default case for old savegames
	// null: DefaultScript,
	// undefined: DefaultScript,

	"default": DefaultScript,
	"explosion": ExplosionScript,
	"travel": TravelScript
};