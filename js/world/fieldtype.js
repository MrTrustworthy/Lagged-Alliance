var FieldTypeGenerator = function() {

	this._types = [];


	this._types.push({
		name: "water",
		movementCost: 3
	});


	this._types.push({
		name: "grass",
		movementCost: 1
	});


	this._types.push({
		name: "dirt",
		movementCost: 1
	});


	this._types.push({
		name: "stone",
		movementCost: 1
	});

	this._types.forEach(function(type, index){
		type.id = index;
	});

}

FieldTypeGenerator.prototype.byID = function(index){
	return this._types[index];
}

FieldTypeGenerator.prototype.random = function(index){
	return this._types[Math.floor(Math.random()*this._types.length)];
}

FieldTypeGenerator.prototype.getAll = function(){

	var obj = {};
	this._types.forEach(function(element, index){
		obj[element.name] = element;
	});
	return obj;
}