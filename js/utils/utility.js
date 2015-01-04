"use strict";

var qp = {



	removeFromArray: function(array, element) {
		var index = array.indexOf(element);
		if (index === -1) return false;

		array.splice(index, 1);
		return true;
	},

	getRandomInt: function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	chance: function(percentage) {
		return Math.floor(Math.random() * 100) + 1 <= percentage;
	},

	/**
	 * returns a specified number of points between the two given points
	 * returnvalue INCLUDES start and endpoint, so giving pointAmount = 2
	 * returns just [origin, destination]
	 */
	 generateLineSegments: function(origin, destination, steps) {

		origin = Position.convert(origin);
		destination = Position.convert(destination);

		var pointList = [];

		var difference = origin.diff(destination).by(steps);

		for(var i = 0; i <= steps; i++){
			var point = origin.add(difference.times(i));
			pointList.push(point);
		}

		return pointList;

	}


};