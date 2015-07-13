var PlayerStats = function () {

    this.level = null; // integer!!

    // those two are completely based on the attributes!!
    this.HP = null;
    this.AP = null;

    // badum
    this.attributes = {
        strength: null,
        dexterity: null,
        accuracy: null,
        constitution: null,
        intelligence: null,
        character: null
    };


};

PlayerStats.prototype.recalculateHP = function () {
    this.HP = new SimpleStat(
        Math.floor((
        this.attributes.strength.val * 0.5 +
        this.attributes.constitution.val
        ) / 2)
    );
};

PlayerStats.prototype.recalculateAP = function () {
    this.AP = new SimpleStat(
        Math.floor((
        this.attributes.strength.val * 0.2 +
        this.attributes.dexterity.val * 0.5 +
        this.attributes.intelligence.val * 0.2 +
        this.attributes.character.val * 0.2
        ) / 4)
    );
};

PlayerStats.prototype.calculateHitChance = function () {
    return this.attributes.accuracy;
};


PlayerStats.generateRandom = function () {

    var ps = new PlayerStats();

    ps.level = qp.randInt(1, 6);

    Object.keys(ps.attributes).forEach(function (key) {
        ps.attributes[key] = new SimpleStat(qp.randInt(35, 75));
    });

    ps.recalculateHP();
    ps.recalculateAP();

    return ps;
};

/**
 * Serializes the stats for saving
 */
PlayerStats.serialize = function (playerstats) {
    var serialized = {
        attributes: {}
    };
    Object.keys(playerstats.attributes).forEach(function (key) {
        serialized.attributes[key] = SimpleStat.serialize(playerstats.attributes[key]);
    });
    serialized.HP = SimpleStat.serialize(playerstats.HP);
    serialized.AP = SimpleStat.serialize(playerstats.AP);
    serialized.level = playerstats.level;

    return serialized;
};

/**
 * De-Serializes the stats for loading
 */
PlayerStats.deserialize = function (saved) {
    var ps = new PlayerStats();
    Object.keys(saved.attributes).forEach(function (key) {
        ps.attributes[key] = SimpleStat.deserialize(saved.attributes[key]);
    });
    ps.level = saved.level;
    ps.recalculateHP();
    ps.recalculateAP();
    return ps;
};