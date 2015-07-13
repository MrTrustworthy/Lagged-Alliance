/**
 * Created by mt on 22.02.2015.
 */
/**
 * Created by mt on 06.02.2015.
 */

var EditDialog = function () {

    DialogBase.call(this, "editDialog", "g");
    this.content = document.getElementById("editDiv");

};

EditDialog.prototype = Object.create(DialogBase.prototype);


/**
 * This generates the content of the dialog.
 * gets called BEFORE displaying the dialog from basedialog.toggle()
 *
 * @returns {boolean} if content-creation was successful and the dialog can be shown
 */
EditDialog.prototype.calculateContent = function (field) {

    if (!field) return false;
    this.content.innerHTML = "";


    var current = (field.occupant && !(field.occupant instanceof Actor)) ? field.occupant.envType.name : "Empty"
    var lvl = game.getLevel();
    var br = document.createElement("br");

    // change objects on field button
    var placedHeader = document.createTextNode("Currently placed Objects: " + current);
    this.content.appendChild(br);
    this.content.appendChild(placedHeader);
    this.content.appendChild(br);
    this.content.appendChild(br);

    // remove objects
    if (!!field.occupant) {
        var btnRemove = document.createElement("BUTTON");
        btnRemove.innerHTML = "Remove Object";
        btnRemove.onclick = function () {
            game.getLevel().removeObject(field.occupant);
            this.toggle();
        }.bind(this);
        this.content.appendChild(btnRemove);
    }

    // add objects
    Object.keys(EnvTypes).forEach(function (key) {
        var typeBtn = document.createElement("BUTTON");
        typeBtn.innerHTML = "-> " + key;

        typeBtn.onclick = function () {

            !!field.occupant && lvl.removeObject(field.occupant);

            var newObj = new EnvironmentObject();
            newObj.envType = EnvTypes[key];
            lvl.addObject(newObj, field);
            lvl.refresh();
            this.toggle();
        }.bind(this);

        this.content.appendChild(typeBtn);

    }.bind(this));


    // Change fieldtype buttons
    var typeHeader = document.createTextNode("Current Field Type:" + field.fieldType.name);
    this.content.appendChild(br);
    this.content.appendChild(typeHeader);
    this.content.appendChild(br);

    var allTypes = Field.FieldTypeGenerator.getAll();

    Object.keys(allTypes).forEach(function (key) {

        var fieldTypeBtn = document.createElement("BUTTON");
        fieldTypeBtn.innerHTML = "type: " + key;
        this.content.appendChild(fieldTypeBtn);

        fieldTypeBtn.onclick = function () {
            console.info("eyyy");
            field.fieldType = allTypes[key];
            game.getLevel().refresh();
            this.toggle();
        }.bind(this);




    }.bind(this));


    // can open!
    return true;
};
