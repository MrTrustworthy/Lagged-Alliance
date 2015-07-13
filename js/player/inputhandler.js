"use strict";

var InputHandler = function () {

    this.states = {
        DEFAULT: -1,
        CLICKED: 0,
        RIGHTCLICKED: 1,
        DRAGGING: 2
    };

    this.buttons = {
        RIGHT: 2,
        LEFT: 0
    };

    this.currentState = this.states.DEFAULT;
    this.currMousePos = null;
    this.lastMousePos = null;
    this.scroll = 0;

    // values to keep track of mouse down-up-click
    this._mouseDownTime = null;

    this._gameCanvas = document.getElementById("gameCanvas");

    this.loadConnections();
};

/**
 * This adds a function to be executed when a certain key is pressed on the canvas
 * @param keyChar
 * @param handleFunc
 */
InputHandler.prototype.addKeyListener = function (keyChar, handleFunc) {

    // do this for both the lower- and uppercase character
    var keyCodes = [
        keyChar.toUpperCase().charCodeAt(0),
        keyChar.toLowerCase().charCodeAt(0)
    ];

    keyCodes.forEach(function (keyCode) {
        document.addEventListener("keydown", function(event){
            if(event.keyCode === keyCode) handleFunc();
        });
    }.bind(this));

};

/**
 *
 * @returns {{states: *, state: *, currMousePos: *, lastMousePos: *, scroll: *}}
 */
InputHandler.prototype.getInput = function () {
    return {
        states: this.states,
        state: this.currentState,
        currMousePos: this.currMousePos,
        lastMousePos: this.lastMousePos,
        scroll: this.scroll
    }

};

/**
 *
 */
InputHandler.prototype.reset = function () {

    this.lastMousePos = this.currMousePos;
    if (this.currentState === this.states.CLICKED ||
        this.currentState === this.states.RIGHTCLICKED) {
        this.currentState = this.states.DEFAULT;
    }
    this.scroll = 0;
};


/**
 *
 */
InputHandler.prototype.loadConnections = function () {



    // prevent default right/left clicks
    this._gameCanvas.oncontextmenu = function () {
        return false;
    }.bind(this);
    this._gameCanvas.onclick = function (evt) {
        return false;
    }.bind(this);

    /**
     * real listeners start here
     */
    this._gameCanvas.onmousewheel = function (evt) {
        if (evt.wheelDelta > 0) {
            this.scroll += 1;
        } else if (evt.wheelDelta < 0) {
            this.scroll -= 1;
        }

    }.bind(this);

    this._gameCanvas.onmousedown = function (evt) {

        if (evt.button === this.buttons.LEFT) {
            this.currentState = this.states.DRAGGING;
            this._mouseDownTime = Date.now();
        }
        // else if (evt.button === this.buttons.RIGHT) {
        // 	this.currentState = this.states.RIGHTCLICKED;
        // }

        this.currMousePos = new Position(evt.x, evt.y);

    }.bind(this);


    this._gameCanvas.onmouseup = function (evt) {

        if (evt.button === this.buttons.LEFT) {

            if (this._mouseDownTime + 300 >= Date.now()) {

                this.currentState = this.states.CLICKED;

            } else {

                this.currentState = this.states.DEFAULT;
            }

        } else if (evt.button === this.buttons.RIGHT) {

            this.currentState = this.states.RIGHTCLICKED;

        }

        this.currMousePos = new Position(evt.x, evt.y);

    }.bind(this);


    this._gameCanvas.onmousemove = function (evt) {
        this.currMousePos = new Position(evt.x, evt.y);
    }.bind(this);

};



