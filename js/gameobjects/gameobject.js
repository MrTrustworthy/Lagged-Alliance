var GameObject = function(){

	this.model = null;
	this.name = null;
};

GameObject.prototype.blink = function(){
	throw new Error("Not implemented");
};

GameObject.prototype.generateModel = function(){
	throw new Error("Not implemented");
};

GameObject.prototype.show = function(){
    throw new Error("Not implemented");
};


GameObject.prototype.hide = function(){
    throw new Error("Not implemented");
};