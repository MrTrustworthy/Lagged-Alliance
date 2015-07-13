var Armory = {

	weapons: [{
			name: "AK-47",
			range: 12,
			damage: 8,
			ammoType: "9mm",
			attacks: [
				new BurstShot("Burst!", 6, 1, 6),
				new Explosion("ROCKET!", 40, 2, 1),
				new SingleShot("Single Shot", 8, 3, 1),
				new SingleShot("Snipe!", 15, 7, 1)
			]

		}



	],

	ammo: {
		"9mm": 18,
		"12-gauge": 6,
		".45 caliber": 12,
		"7.62mm NATO": 30
	},



	generateWeapon: function(name) {

		var blueprint = Armory.weapons.filter(function(w) {
			return w.name === name;
		})[0];

		var weapon = new Weapon();
		weapon.name = blueprint.name;
		weapon.range = blueprint.range;
		weapon.damage = blueprint.damage;
		weapon.ammo.type = blueprint.ammoType;

		var ammo = new SimpleStat(Armory.ammo[blueprint.ammoType]);
		weapon.setAmmo(ammo);

		blueprint.attacks.forEach(function(att) {
			weapon.addAttack(att);
		});

		return weapon;

	}



};