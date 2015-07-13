var MapDialog = function (world) {

    DialogBase.call(this, "mapDialog", "m");

    this.world = world;

    this.canvas = document.getElementById("mapCanvas");
    this.canvas.width = 500;
    this.canvas.height = 500;
    this.context = this.canvas.getContext("2d");

    this.fieldSize = Math.min(this.canvas.width, this.canvas.height) / this.world.length;

    this.applyListener();

};

MapDialog.prototype = Object.create(DialogBase.prototype);


/**
 * This generates the content of the dialog.
 * gets called BEFORE displaying the dialog from basedialog.toggle()
 * @returns {boolean} if content-creation was successful
 */
MapDialog.prototype.calculateContent = function () {


    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.world.forEach(function (level, x, y) {

        var color;
        var offset = 5;

        var playerOffset = 10;
        var aiOffset = 35;
        var teamRectSize = 10;


        //the border for the selected world
        if (level.equals(game.gameWorld.activeLevel)) {
            color = "#0000FF";
        } else {
            color = "#FFFFFF";
        }


        this.context.fillStyle = color;
        this.context.fillRect(
            x * this.fieldSize,
            y * this.fieldSize,
            this.fieldSize,
            this.fieldSize
        );

        // the background pics
        var playerAmount = 0;
        level.controllerQ.playerController.getTeams().forEach(function (team) {
            playerAmount += team._actors.length;
        });

        var aiAmount = 0;
        level.controllerQ.aiController.getTeams().forEach(function (team) {
            aiAmount += team._actors.length;
        });


        if (playerAmount === 0) color = "#222222";
        else color = "#888888";

        this.context.fillStyle = color;
        this.context.fillRect(
            x * this.fieldSize + offset,
            y * this.fieldSize + offset,
            this.fieldSize - offset * 2,
            this.fieldSize - offset * 2
        );


        // now the teams
        for (var i = 1; i <= playerAmount; i++) {
            this.context.fillStyle = "#00FF00";
            this.context.fillRect(
                x * this.fieldSize + playerOffset,
                y * this.fieldSize + i * 2 * teamRectSize,
                teamRectSize,
                teamRectSize
            )
        }

        for (var i = 1; i <= aiAmount; i++) {
            this.context.fillStyle = "#FF0000";
            this.context.fillRect(
                x * this.fieldSize + aiOffset,
                y * this.fieldSize + i * 2 * teamRectSize,
                teamRectSize,
                teamRectSize
            )
        }


    }.bind(this));
    // returns true to signal that content has been created
    return true;

};

MapDialog.prototype.applyListener = function () {

    this.canvas.addEventListener("click", function (evt) {

        // can't move in battle mode
        if (this.world.activeLevel.isInBattle) {
            console.log("Can't switch maps when in combat!");
            return;
        }

        var x = Math.floor(evt.offsetX / this.fieldSize);
        var y = Math.floor(evt.offsetY / this.fieldSize);
        var newPosition = new Position(x, y);

        this.toggle();

        if (this.world.activeLevel.isInBattle) {
            console.log("Can't switch maps while in battle!");
            return;
        }

        // make sure the selected is a member of the playercontroller
        var selected = this.world.activeLevel.controllerQ.playerController.getSelectedMember();

        if (!!selected) {
            if (confirm("Are you sure you want to move the group?")) {
                var team = selected.team;
                this.world.moveTeam(team, newPosition);
                this.world.switchToMap(newPosition);
            }
        } else {
            this.world.switchToMap(newPosition);
        }

    }.bind(this));

};