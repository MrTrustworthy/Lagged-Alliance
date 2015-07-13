/**
 * Created by mt on 04.02.2015.
 */

var Inventory = function (owner) {

    this.owner = owner;

    this._items = [];

    this._equipped = {
        head: null,
        torso: null,
        legs: null,
        feet: null,
        weapon: null
    };

    // defines an inventorys position so the items can reference it
    // via calling this.container.position
    Object.defineProperty(this, "position", {
        get: function () {
            return this.owner.position;
        },
        set: function (position) {
            throw new ReferenceError("Can't change position of inventory!");
        }
    });
};

Inventory.SLOTS = {
    HEAD: "head",
    TORSO: "torso",
    LEGS: "legs",
    FEET: "feet",
    WEAPON: "weapon"
};

/**
 * This serializes a inventory. the equipped items are
 * serialized by calculating their index in this._items and restoring it later
 * @param inventory
 * @returns {{}}
 */
Inventory.serialize = function (inv) {

    // serialize the equipped items by storing their index in _items
    var equipSave = {};
    Object.keys(inv._equipped).forEach(function (key) {
        // if there IS a item in that slot
        if (!!inv._equipped[key]) {
            //determine the items index and save it
            // looks like that -> equipSave.weapon = 2
            equipSave[key] = inv._items.indexOf(inv._equipped[key]);
        }
    });

    // save the items. serialization will be done by Item
    var itemSave = [];
    inv._items.forEach(function (item) {
        itemSave.push(Item.serialize(item));
    });

    return {
        items: itemSave,
        equipped: equipSave
    }
};

/**
 * deserializes the inventory
 *
 * @param saved
 * @param actor
 * @returns {Inventory}
 */
Inventory.deserialize = function (saved, actor) {
    var inv = new Inventory(actor);

    saved.items.forEach(function (item) {
        inv.addItem(Item.deserialize(item));
    });
    // maps the equipped items to its slots based on the stored indexes
    Object.keys(saved.equipped).forEach(function (slot) {
        inv.equipItem(inv._items[saved.equipped[slot]]);
    });

    return inv;
};


/**
 * After checking, equips the item at the appropriate slot and removes the old one
 * @param item
 */
Inventory.prototype.equipItem = function (item) {
    if (!(item instanceof EquippableItem))throw new TypeError("Not equippable Item!");
    if (!this.hasItem(item)) throw new RangeError("Dont have that item!");

    // this overrides any previously set item on this slot
    this._equipped[item.equipSlot] = item;

    // re-draws the actors model to refresh the shown equipped items
    !!this.owner.model && this.owner.refreshModel();
};


/**
 * Adds an item
 * @param item
 */
Inventory.prototype.addItem = function (item) {
    if (!(item instanceof Item)) throw new TypeError("Not an item!");
    this._items.push(item);
    item.container = this;
};

/**
 * This returns in what slot the given item is equipped or NULL if it's not
 * @param item
 */
Inventory.prototype.equippedAt = function (item) {
    var equippedAt = null;
    Object.keys(this._equipped).forEach(function (key) {
        if (this._equipped[key] === item) equippedAt = key;
    }.bind(this));
    return equippedAt;
};

/**
 * Returns all equipped items directly
 * @returns {Array}
 */
Inventory.prototype.getEquippedItems = function(){
    return qp.getObjValues(this._equipped);
};

/**
 * Removes an item
 * @param item
 */
Inventory.prototype.removeItem = function (item) {
    if (!this.hasItem(item)) throw new RangeError("Dont have that item!");
    this._items.splice(this._items.indexOf(item), 1);

    // remove items from equipped
    var equippedAt = this.equippedAt(item);
    if(!!equippedAt) this._equipped[equippedAt] = null;

    item.container = null;
};

/**
 * Checks whether the item is in this inventory
 * @param item
 * @returns {boolean}
 */
Inventory.prototype.hasItem = function (item) {
    return this._items.indexOf(item) !== -1;
};

/**
 * This removes an item from this inventory, adds it to the level and
 * plays the drop-animation
 * @param item
 * @param field
 */
Inventory.prototype.dropItemOn = function(item, field){
    this.removeItem(item);
    this.owner.refreshModel();
    field.placeItem(item);
};

/**
 * This drops all items, eg. for the case that the player dies
 */
Inventory.prototype.dropAllItems = function(){
  this._items.forEach(function(item){
      this.dropItemOn(item, this.owner.placedOn);
  }.bind(this));
};
