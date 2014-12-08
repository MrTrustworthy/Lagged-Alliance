"use strict";

/**
 * The gamemap represents the fields/floor of the game in a 2D-array
 */
var GameMap = function(sizeX, sizeY) {

	this.sizeX = sizeX || 8;
	this.sizeY = sizeY || this.sizeX;

	this.map = this._loadMap(this.sizeX, this.sizeY);

}


GameMap.prototype.get = function(x, y) {
	try {
		return this.map[x][y];
	} catch (e) {
		return null;
	}
}

GameMap.prototype.getRandomField = function() {
	return this.get(
		GUtil.getRandomInt(0, this.sizeX - 1),
		GUtil.getRandomInt(0, this.sizeY - 1)
	);

}


/**
 * -----------------------------------------------------------------------------------
 * -------------------------------------------private---------------------------------
 * -----------------------------------------------------------------------------------
 */


/**
 * loads a map with the given size
 */
GameMap.prototype._loadMap = function(sizeX, sizeY) {
	var arr = [];
	for (var x = 0; x < sizeX; x++) {
		arr[x] = [];
		for (var y = 0; y < sizeY; y++) {
			arr[x][y] = new Field({
				x: x,
				y: y
			});
		}
	}
	return arr;
}



/**
 * Iterates through every field in the 2d array and executes
 * a callback for every field and its position
 */
GameMap.prototype.forEach = function(callback_func) {

		if (!this.map) throw new Error("Map not initialized");

		for (var x = 0; x < this.map.length; x++) {
			for (var y = 0; y < this.map[0].length; y++) {

				callback_func(this.map[x][y], {
					x: x,
					y: y
				});
			}
		}
	}
	//------------------------------------------------------------------------------
	//----------------------Unit Movement-------------------------------------------
	//------------------------------------------------------------------------------

/**
 * Moves an object on the first node of the path to the last node,
 */
GameMap.prototype.moveAlongPath = function(actor, path) {

	var deferred = new Deferred();

	var i = 0;

	//var actor = path[path.length - 1].occupant;

	//moves the object to the next node until it reaches the target node
	var move_to_next = function() {

		if (path.length === 1) {
			deferred.resolve();

		} else {
			var curr_field = path.pop();
			curr_field.removeContent();

			var end_field = path[path.length - 1];

			this._animateMove(actor, end_field).then(move_to_next);

			deferred.update(i);
			i++;
		}

	}.bind(this);
	move_to_next();

	return deferred.promise;

}

/**
 * Moves an actor towards a certain point. as soon as the point is reached,
 * it will call onDone().
 * onDone is mostly used to Chain movement from the moveAlongPath function;
 */
GameMap.prototype._animateMove = function(actor, field_b, onDone) {

	var deferred = new Deferred();

	//Those two need to be elsewhere
	var speed = 0.3;
	var delay = 20;

	var difference = new THREE.Vector3(0, 0, 0).subVectors(field_b.model.position, actor.model.position);

	var iteration_steps = Math.floor(difference.length()) / speed;
	var i = 0;

	var animateMovement = function() {

		if (i < iteration_steps) {
			actor.model.position.x += difference.x / iteration_steps;
			actor.model.position.y += difference.y / iteration_steps;
			i++;
			deferred.update(i);
		} else {
			field_b.placeContent(actor);
			game.scene.removeEventListener("tick", animateMovement);
			deferred.resolve();
		}
	}
	game.scene.addEventListener("tick", animateMovement);

	return deferred.promise;


}

//------------------------------------------------------------------------------
//----------------------Pathfinding---------------------------------------------
//------------------------------------------------------------------------------

/**
 * Pathfinding function
 */
GameMap.prototype.findPath = function(field_a, field_b) {

	if (field_a.position.x === field_b.position.x && field_a.position.y === field_b.position.y) {
		throw new Error("start/end field are the same");
	}else if(field_b.isBlocked){
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
			var already_checked = closed_list.concat(open_list).filter(function(el) {
				if (node.position.x === el.position.x &&
					node.position.y === el.position.y) {
					return true;
				}
			}).length > 0;

			if (!field.isBlocked && !already_checked) {
				node.parent = best_element;
				node.astar_g = node.parent.astar_g +
					this.getAlignmentCost(node, node.parent) * node.field.fieldType.movementCost;

				node.astar_h = this.getDistance(node, target_node);
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
 */
GameMap.prototype.neighboursOf = function(field) {
	var pos_x = field.position.x;
	var pos_y = field.position.y;
	var arr = [];

	for (var x = pos_x - 1; x <= pos_x + 1; x++) {
		for (var y = pos_y - 1; y <= pos_y + 1; y++) {
			// try {
			var fld = this.get(x, y); //this.map[x][y];
			if (!!fld && !(pos_x === x && pos_y === y)) {
				arr.push(fld);
			}
			// } catch (e) {
			//field apparently not existing, so skip it
			//console.log("one neighbour of", pos_x, ":", pos_y, "does not exist");
			// }
		}
	}
	return arr;
}

/**
 * if two nodes are aligned horizontally, the cost is 1
 * if they are aligned diagonally, the cost is ~1.41
 *
 * This works with both nodes and fields
 */
GameMap.prototype.getAlignmentCost = function(field_a, field_b) {
	if ((field_a.position.x === field_b.position.x) ||
		(field_a.position.y === field_b.position.y)) {
		return 1;
	}
	return Math.sqrt(2);
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
				if (neighbour.position.x === node.position.x &&
					neighbour.position.y === node.position.y) {
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

/**
 * Move to general utils
 */
GameMap.prototype.getDistance = function(field_a, field_b) {

	// airline-distance
	// var v1 = new THREE.Vector2(field_a.position.x, field_a.position.y);
	// var v2 = new THREE.Vector2(field_b.position.x, field_b.position.y);
	// return v1.distanceTo(v2);


	//manhattan distance
	var d_x = Math.abs(field_a.position.x - field_b.position.x);
	var d_y = Math.abs(field_a.position.y - field_b.position.y);
	return d_x + d_y

}

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

/**
 * Static methods and properties of GameMap
 */


GameMap.MAX_PATHFIND_ITERATIONS = 1000;