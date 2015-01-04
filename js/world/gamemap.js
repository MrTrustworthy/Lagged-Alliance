"use strict";

/**
 * The gamemap represents the fields/floor of the game in a 2D-array
 */
var GameMap = function(size) {

	this.sizeX = size || 8;
	this.sizeY = this.sizeX;

	this._map = [];
	for (var x = 0; x < this.sizeX; x++) {
		this._map[x] = [];
		this._map[x].length = this.sizeY;
	}
}

//------------------------------------------------------------------------------
//---------------------------General Stuff--------------------------------------
//------------------------------------------------------------------------------

GameMap.serialize = function(gameMap) {
	var array = [];
	gameMap.forEach(function(field) {
		array.push(Field.serialize(field));
	});
	return {
		fields: array
	}
}

GameMap.deserialize = function(save) {
	var size = Math.sqrt(save.fields.length);
	var gameMap = new GameMap(size);
	save.fields.forEach(function(field) {
		gameMap._map[field.position.x][field.position.y] = Field.deserialize(field);
	});

	return gameMap;
}

GameMap.prototype.show = function() {
	this.forEach(function(field) {
		field.show();
	});
}

GameMap.prototype.hide = function() {
	this.forEach(function(field) {
		field.hide();
	});
}


//------------------------------------------------------------------------------
//---------------------------Basic Stuff----------------------------------------
//------------------------------------------------------------------------------
GameMap.MAX_PATHFIND_ITERATIONS = 1000;

// type-error-safe version of array[x][y]
GameMap.prototype.get = function(x, y) {
	//transform position into x/y if needed
	if (arguments.length === 1) {
		var pos = x;
		x = pos.x;
		y = pos.y;
	}

	try {
		return this._map[x][y];
	} catch (e) {
		return null;
	}
}

//returns a random field
GameMap.prototype.getRandomField = function() {
	return this.get(
		qp.getRandomInt(0, this.sizeX - 1),
		qp.getRandomInt(0, this.sizeY - 1)
	);
}

GameMap.prototype.getFreeField = function() {

	var fld = this.getRandomField();
	if (!fld.isBlocked && !fld.occupant) return fld;
	else return this.getFreeField();
}

GameMap.prototype.getBorderFields = function(border, freeFieldsOnly) {

	var foundFields = [];
	var size = this._map.length;

	for (var i = 0; i < size; i++) {

		var fld;
		switch (border) {
			case "south":
				var fld = this.get(i, 0);
				break;
			case "north":
				var fld = this.get(i, size - 1);
				break;
			case "west":
				var fld = this.get(0, i);
				break;
			case "east":
				var fld = this.get(size - 1, i);
				break;
		}
		// if only free fields are required, make sure the field is not occupied
		if (!freeFieldsOnly || (!fld.isBlocked && !fld.occupant)) foundFields.push(fld);
	}
	return foundFields;
}

// Iterates over every field of the map
GameMap.prototype.forEach = function(callback_func) {

	for (var x = 0; x < this._map.length; x++) {
		for (var y = 0; y < this._map[0].length; y++) {
			callback_func(this._map[x][y], x, y);
		}
	}
}



/**
 * -----------------------------------------------------------------------------------
 * ---------------------------Random Map Generation-----------------------------------
 * -----------------------------------------------------------------------------------
 */



/**
 * loads a map with the given size
 */
GameMap.prototype.loadRandomMap = function() {
	var arr = [];
	for (var x = 0; x < this.sizeX; x++) {
		arr[x] = [];
		for (var y = 0; y < this.sizeY; y++) {
			arr[x][y] = new Field(x, y, Field.FieldTypeGenerator.random());
		}
	}
	this._map = arr;

	this._improve(2 /* 4 */ );
}

/**
 * Kinda hacky function to iterate over a generated map
 * and make it seem more procedural
 */
GameMap.prototype._improve = function(amount) {
	amount = amount || 1;

	for (var i = 0; i < amount; i++) {



		this.forEach(function(field, x, y) {

			var types = Field.FieldTypeGenerator.getAll();

			var neighbours = this.neighboursOf(field);

			var waterAmount = 0;

			neighbours.forEach(function(element, index) {
				if (element.fieldType.name === types.water.name) {
					waterAmount++;
				}
			});

			switch (waterAmount) {
				case 0:
					field.fieldTypeRep = qp.chance(50) ? types.grass : qp.chance(75) ? types.dirt : types.stone;
					break;
				case 1:
					field.fieldTypeRep = qp.chance(90) ? types.grass : types.dirt;
					break;
				case 2:
					field.fieldTypeRep = qp.chance(10) ? types.water : types.grass;
					break;
				case 3:
					field.fieldTypeRep = qp.chance(30) ? types.water : types.grass;
					break;
				default:
					field.fieldTypeRep = types.water;
					break;
			}

		}.bind(this));

		this.forEach(function(field) {
			field.fieldType = field.fieldTypeRep;
			field.generateModel();
		});

	}
}



//------------------------------------------------------------------------------
//----------------------Pathfinding---------------------------------------------
//------------------------------------------------------------------------------

/**
 * Pathfinding function
 */
GameMap.prototype.findPath = function(field_a, field_b) {

	if (field_a.position.equals(field_b.position)) {
		throw new Error("start/end field are the same");
	} else if (field_b.isBlocked) {
		throw new Error("field blocked, can't get there");
	}

	var timer = Date.now();

	// create variables
	var start_node = field_a.getNode();
	var target_node = field_b.getNode();

	var open_list = [];
	var closed_list = [];

	// basic set up for first round of iteration
	var best_element = start_node;
	closed_list.push(start_node);

	/**
	 * start of the search algorithm
	 */
	for (var i = 0; i < GameMap.MAX_PATHFIND_ITERATIONS; i++) {

		var neighbours = this.neighboursOf(best_element.field);

		//calculate neighbouring nodes and put them into the open list
		neighbours.forEach(function(field, index) {

			var node = field.getNode();

			//calculates whether the node already is in one of our lists
			var isChecked = closed_list.concat(open_list).filter(function(el) {
				if (el.position.equals(node.position)) {
					return true;
				}
			}).length > 0;

			if (!field.isBlocked && !isChecked) {
				node.parent = best_element;
				node.astar_g = node.parent.astar_g +
					node.position.calcAlignmentCost(node.parent.position) *
					node.field.fieldType.movementCost;

				node.astar_h = node.position.distanceTo(target_node.position);

				node.astar_f = node.astar_g + node.astar_h;
				open_list.push(node);
			}

		}.bind(this));

		//sort the open list to have the best first
		open_list.sort(function(a, b) {
			if (a.astar_f < b.astar_f) return -1;
			return 1;
		});

		//move the best element into the closed list
		var best_element = open_list.shift();
		closed_list.push(best_element);

		// we're locked and can never reach the target. 
		if (!best_element) {
			throw new Error("Can't reach target", target_node, "from", start_node);
		}

		/**
		 * We found a path! sort the path and return it!
		 */
		if (best_element.equals(target_node)) {
			var path = this.calculateWaypoints(best_element, closed_list);
			var time_spent = (Date.now() - timer) / 1000;
			//console.log("Calculated Path with", path.length, "nodes in", time_spent, "seconds through", i, "iterations");
			return path;
		}
	}
	throw new Error("Path could not be determined within", GameMap.MAX_PATHFIND_ITERATIONS, "iterations");

}


//------------------------------------------------------------------------------
//-----------------------Pathfinding Utils--------------------------------------
//------------------------------------------------------------------------------

/**
 * returns an array with all neighbouring fields of a given field position
 * scale says how far a field can be away and still be considered a neighboring field
 */
GameMap.prototype.neighboursOf = function(field, scale) {

	// default scale is 1
	scale = scale || 1;
	if(scale === 0) return [];

	
	var pos_x = field.position.x;
	var pos_y = field.position.y;
	var arr = [];

	// go through all fields from (-scale/-scale) to (scale/scale)
	for (var x = pos_x - scale; x <= pos_x + scale; x++) {
		for (var y = pos_y - scale; y <= pos_y + scale; y++) {

			var fld = this.get(x, y);

			// if the field exists and is NOT the original field
			if (!!fld && !(pos_x === x && pos_y === y)) {
				arr.push(fld);
			}

		}
	}
	return arr;
}


/**
 * Calculates a sorted list of waypoints based on the last
 * pathfinding node by going over its parents
 *
 * Also has functionality build in to iterate over the closed fields
 * to try and find a better parent
 */
GameMap.prototype.calculateWaypoints = function(node, closed_list) {

	// console.log("found finished path!");

	var current_node = node;
	var completed_path = [];

	while (!!current_node.parent) {


		completed_path.push(current_node.field);


		// deep check function that optimizes the path by checking 
		//whether each evaluated parent actually is the best neighbour

		var neighbour_fields = this.neighboursOf(current_node.field);

		var possible_parents = closed_list.filter(function(node) {
			for (var i = 0; i < neighbour_fields.length; i++) {

				var neighbour = neighbour_fields[i];
				if (neighbour.position.equals(node.position)) {
					return true;
				}
			}
			return false;
		});
		possible_parents.forEach(function(node, index) {
			if (node.astar_g < current_node.parent.astar_g) {
				current_node.parent = node;
			}
		});

		current_node = current_node.parent;
	}

	completed_path.push(current_node.field);

	return completed_path;
}