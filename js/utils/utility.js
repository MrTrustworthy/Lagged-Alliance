"use strict";

var GUtil = {



	removeFromArray: function(array, element) {
		var index = array.indexOf(element);
		if (index === -1) return false;

		array.splice(index, 1);
		return true;
	},

	getRandomInt: function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}


};