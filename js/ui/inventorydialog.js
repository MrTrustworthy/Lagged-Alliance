/**
 * Created by mt on 06.02.2015.
 */

var InventoryDialog = function () {

    DialogBase.call(this, "inventoryDialog", "i");


    this.equipCanvas = document.getElementById("inventoryEquippedCanvas");
    this.equipCanvas.width = 250;
    this.equipCanvas.height = 500;
    this.equipContext = this.equipCanvas.getContext("2d");

    //this.itemCanvas = document.getElementById("inventoryItemCanvas");
    //this.itemCanvas.width = 200;
    //this.itemCanvas.height = 500;
    //this.itemContext = this.itemCanvas.getContext("2d");


};

InventoryDialog.prototype = Object.create(DialogBase.prototype);


/**
 * This generates the content of the dialog.
 * gets called BEFORE displaying the dialog from basedialog.toggle()
 * @returns {boolean} if content-creation was successful and the dialog can be shown
 */
InventoryDialog.prototype.calculateContent = function () {

    // abort condition returns false to block dialog showing
    if (!game.getSelected()) {
        console.log("No player selected!");
        return false;
    }

    // selected player inventory
    var player = game.getSelected();
    var inventory = player.inventory;
    var level = game.getLevel();

    // Equip items
    this.equipContext.clearRect(0, 0, this.equipCanvas.width, this.equipCanvas.height);

    var x = 10;
    var y = 60;
    this.equipContext.font = "16px Georgia";
    this.equipContext.fillText("EQUPPED ITEMS", x, y);
    y += 60;

    // draw all equipped items
    Object.keys(inventory._equipped).forEach(function (key) {
        var item = inventory._equipped[key] ? inventory._equipped[key].toString() : "Empty";
        this.equipContext.fillText(key.toUpperCase() + ":", x, y);
        this.equipContext.fillText(item, x+100, y);
        y += 40;
    }.bind(this));


    ///---------------------------------------------

    var itemTable = document.getElementById("inventoryItemsTable");
    itemTable.innerHTML = "";


    // create a table row for all items
    inventory._items.forEach(function (item) {


        var row = itemTable.insertRow();

        // name and where it is equipped
        var itemName = row.insertCell(0);
        itemName.innerHTML = item.name;

        // find out whether the item is equipped at some slot or not
        var itemEquipped = row.insertCell(1);
        itemEquipped.innerHTML = inventory.equippedAt(item) ? inventory.equippedAt(item) : "";


        //onclick for equipping/using
        var useFunction = function(){
            inventory.equipItem(item);
            this.calculateContent();
        }.bind(this);
        itemEquipped.onclick = useFunction;
        itemName.onclick = useFunction;


        // drop item button
        var itemEquipped = row.insertCell(2);
        var dropButton = document.createElement("BUTTON");
        dropButton.onclick = function () {
            var freeField = level.map.neighboursOf(player.placedOn).filter(function (fld) {
                return !fld.isBlocked;
            })[0];
            inventory.dropItemOn(item, freeField);
            this.calculateContent();
        }.bind(this);
        dropButton.innerHTML = "Drop";
        itemEquipped.appendChild(dropButton);


    }.bind(this));

    // can open!
    return true;
};
