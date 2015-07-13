/**
 * Created by mt on 06.02.2015.
 */

var DialogBase = function(dialogID, toggleKey){

    this.dialog = document.getElementById(dialogID);

    game.inputHandler.addKeyListener(toggleKey, function(){
        this.toggle();
    }.bind(this));

};

/**
 * If dialog is open, close it.
 * If dialog is closed, calculate content
 * if content creation is successful, open dialog.
 */
DialogBase.prototype.toggle = function(args) {
    if (this.dialog.open) this.dialog.close();
    else this.calculateContent(args) && this.dialog.show();;
};

/**
 * Has to be implemented by the subclasses
 */
DialogBase.prototype.calculateContent = function(){
    throw new EvalError("Not yet implemented");
};