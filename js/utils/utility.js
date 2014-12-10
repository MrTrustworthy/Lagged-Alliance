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
	}


};
