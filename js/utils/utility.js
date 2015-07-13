"use strict";

var qp = {

    NORTH: 0,
    EAST: 1,
    SOUTH: 2,
    WEST: 3,

    direction: {
        south: {
            name: "south",
            values: {
                x: 0,
                y: -1
            }
        },
        north: {
            name: "north",
            values: {
                x: 0,
                y: 1
            }
        },
        west: {
            name: "west",
            values: {
                x: -1,
                y: 0
            }
        },
        east: {
            name: "east",
            values: {
                x: +1,
                y: 0
            }
        }
    },

    calculateEntryVector: function (posA, posB) {

        //determine if it's horizontal or vertical

        //horizontal

        if (Math.abs(posA.x - posB.x) >= Math.abs(posA.y - posB.y)) {

            if (posA.x >= posB.x) return qp.direction.east;
            else return qp.direction.west;

        } else { //vertical
            if (posA.y >= posB.y) return qp.direction.south;
            else return qp.direction.north;
        }
    },

    // like pythons range function
    range: function (amount) {
        var arr = [];
        for (var i = 0; i < amount; i++) {
            arr.push(i);
        }
        return arr;
    },

    removeFromArray: function (array, element) {
        var index = array.indexOf(element);
        if (index === -1) return false;

        array.splice(index, 1);
        return true;
    },

    getRandomInt: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randInt: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    chance: function (percentage) {
        return Math.floor(Math.random() * 100) + 1 <= percentage;
    },

    calculateAngle: function (origin, destination) {
        return Math.atan((destination.x - origin.x)/(destination.y - origin.y));
    },

    /**
     * Returns all non-faulty values from an object literal
     * @param object
     * @returns {Array}
     */
    getObjValues: function(object){
        var values = [];
        Object.keys(object).forEach(function(key){
            !!object[key] && values.push(object[key]);
        }.bind(this));
        return values;
    },

    /**
     * returns random element of array
     * @param array
     */
    randomArrayElem: function(array){
        return array[Math.floor(Math.random()*array.length)];
    },

    /**
     * returns a specified number of points between the two given points
     * return value INCLUDES start and endpoint, so giving pointAmount = 2
     * returns just [origin, destination]
     */
    generateLineSegments: function (origin, destination, steps) {

        origin = Position.convert(origin);
        destination = Position.convert(destination);

        var pointList = [];

        var difference = origin.diff(destination).by(steps);

        for (var i = 0; i <= steps; i++) {
            var point = origin.add(difference.times(i)).times(Field.FIELD_SIZE);
            pointList.push(point);
        }

        return pointList;

    }


};