/**
 * Created by mt on 21.02.2015.
 */
"use strict";

var GeometryManager = function () {

    this._loadedPromise = null;

    this.JSONLoader = new THREE.JSONLoader();

    this.path = "./media/geometries/";
    this.suffix = ".json";

    this._geometries = {
        cornerwall: null,
        wall: null
    };

};

/**
 *
 * @returns {Deferred.promise|*}
 */
GeometryManager.prototype.loadAllGeometries = function () {

    // don't load twice
    if (!!this._loadedPromise) return this._loadedPromise;

    var deferred = new Deferred();

    var balance = 0;
    Object.keys(this._geometries).forEach(function (key) {

        balance++;
        this.JSONLoader.load(
            this.path + key + this.suffix,

            function (geometry) {

                this._geometries[key] = geometry;
                if (--balance === 0) deferred.resolve();

            }.bind(this)

        );

    }.bind(this));

    this._loadedPromise = deferred.promise;
    return deferred.promise;

};

/**
 *
 * @param name
 * @returns {*}
 */
GeometryManager.prototype.getGeometry = function (name) {
    if (!this._geometries[name]) throw new Error("Geometries not yet ready");
    return this._geometries[name];
};