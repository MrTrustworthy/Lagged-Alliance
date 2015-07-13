var Audiomanager = function() {

	this.context = new window.AudioContext();

	this.path = "./media/sounds/";
	this.extension = ".mp3";

	this.volume = 0;

	this.gainNode = this.context.createGain();
	this.setVolume(this.volume);

	this.soundBuffers = {
		"explosion": {
			"buffer": null,
			"source": null,
			"loop": false
		},
		"shot": {
			"buffer": null,
			"source": null,
			"loop": false
		},
		"ambient": {
			"buffer": null,
			"source": null,
			"loop": true
		}
	};

	this.loadedPromise = this.loadSounds();
};

Audiomanager.prototype.setVolume = function(amount){
	this.gainNode.gain.value = amount/100;
};


Audiomanager.prototype.playSound = function(soundName) {

	this.loadedPromise.then(function(soundBuffers) {


		var source = this.context.createBufferSource();

		//creating references to the later needed vals
		source.buffer = soundBuffers[soundName].buffer;
		source.loop = soundBuffers[soundName].loop;
		soundBuffers[soundName].source = source;

		//de-reference the source when it's done playing
		source.onend = function(){
			soundBuffers[soundName].source = null;
		};

		source.connect(this.gainNode);
		this.gainNode.connect(this.context.destination);


		source.start(0);

	}.bind(this));
};

Audiomanager.prototype.stopSound = function(soundName){
	var src = this.soundBuffers[soundName].source;
	if(!src) console.warn("Sound isn't playing right now!");
	else src.stop();

};


Audiomanager.prototype.loadSounds = function() {

	var deferred = new Deferred();

	var soundNames = Object.keys(this.soundBuffers);
	var toDo = soundNames.length;


	// function to execute after each update
	var loadedFunc = function() {
		if (--toDo === 0) {
			deferred.resolve(this.soundBuffers);
			console.info("Audiomanager up and running", this);
		}
	}.bind(this);

	// load each sound
	soundNames.forEach(function(soundName) {

		//load the sounds
		var url = this.path + soundName + this.extension;
		var request = new XMLHttpRequest();

		request.open('GET', url, true);
		request.responseType = 'arraybuffer';

		// Decode asynchronously
		request.onload = function() {

			this.context.decodeAudioData(

				request.response,

				// when loaded, append it to this.soundBuffers and update
				function(buffer) {
					this.soundBuffers[soundName].buffer = buffer;
					deferred.update(this.soundBuffers[soundName]);
					loadedFunc();

				}.bind(this),

				function(r) {
					console.error("Error loading sound!", r);
					loadedFunc();
				}
			);

		}.bind(this);

		request.send();

	}.bind(this));

	return deferred.promise;
};