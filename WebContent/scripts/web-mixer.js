/*
 * WebMixer web-mixer.js
 * Rob Innes Hislop
 * copyright 2014
 */


function WebMixer(context, id) {
	
	this.id = id;
	this.channelStrips = {};	// Hash table of channel strips
	this.createMixerUI();
	this.soloChannels = []; // This could be just a list of keys, not the whole 
	this.soloBus = false; 
	this.mixerWidth = 0;
	this.csWidth = 0;
	this.endpointDesc = context.destination.channelInterpretation;
	
	// Create a channel strip and add it to the hash
	this.addChannelStrip(context,this.endpointDesc);
	this.routeChannelStrip(this.channelStrips[this.endpointDesc], null, context.destination);

}

WebMixer.prototype.addChannelStrip= function(context,id) {
	// Create a channel strip and add it to the mixer
	this.channelStrips[id] = new ChannelStrip(context,this,id);
	
	// Update the mixer document object width
	if (this.csWidth == 0) {
		this.csWidth = $(".channel_strip").css("width");
		// Remove the 'px' from the width attribute
		this.csWidth = parseInt(this.csWidth.slice(0,this.csWidth.length - 2));
		//return this.channelStrips[label];
	}
	
	this.mixerWidth += this.csWidth;
	$("#"+this.id).css("width","" + this.mixerWidth + "px");
}

WebMixer.prototype.createMixerUI = function () {
	// Insert mixer div
	var mixDiv = document.createElement("div");
	mixDiv.className = "mixer";
	mixDiv.id = this.id; 
	document.getElementsByClassName('container')[0].appendChild(mixDiv);
}

WebMixer.prototype.routeChannelStrip = function(channelStrip, source, destination) {
	if (source) 
		this.connectChannelStripInput(channelStrip,source);
	
	if (destination)
		this.connectChannelStripOutput(channelStrip, destination);
}

WebMixer.prototype.connectChannelStripInput = function (channelStrip, source) {
	source.connect(channelStrip.inputNode);
}

WebMixer.prototype.connectChannelStripOutput = function(channelStrip, destination) {
	channelStrip.muteNode.connect(destination);
}
/*
WebMixer.prototype.disconnectChannelStripOutput = function(channelStrip) {
	channelStrip.muteNode.disconnect();
}
*/

function FFTMeter(context){
	
	this.animationRunning = false;
	this.CANVAS_WIDTH = $(".meter").css("width");
	this.CANVAS_HEIGHT = $(".meter").css("height");
	this.numBands = 16; // Best if numBands is power of 2
	this.rectWidth = Math.floor(this.CANVAS_WIDTH / this.numBands);
	
	this.analyserNode = context.createAnalyser ? context.createAnalyser() : context.createAnalyserNode();
}

FFTMeter.prototype.connect = function(audioNode) {
	this.analyserNode.connect(audioNode)
}

function ChannelStrip(context, mixer, id) {
	
	// Create AudioNodes
	this.id = id;
	this.mixer = mixer; // Reference to parent. Use with caution
	this.inputNode = context.createGain? context.createGain() : context.createGainNode();
	//this.analyserNode = context.createAnalyser ? context.createAnalyser() : context.createAnalyserNode();
	this.fftMeter = new FFTMeter(context);
	this.insertNodes = 0; // Not implemented. This will be an array of effects
	this.pannerNode = context.createPanner ? context.createPanner() : context.createPannerNode();
	this.faderNode = context.createGain ? context.createGain() : context.createGainNode();
	this.muteNode = context.createGain ? context.createGain() : context.createGainNode();
	
	// Set initial state, parameters 
	this.panXdeg = 0;
	this.panZdeg = 90;
	
	this.faderGain = 1;
	this.faderMin = 0;
	this.faderMax = 100;
	this.faderUnity = Math.round((this.faderMax - this.faderMin) / Math.sqrt(2)); // Unity
	this.faderDefault = this.faderUnity;
	this.muted = false;
	this.soloed = false;
		
	// Connect elements
	this.inputNode.connect(this.fftMeter.analyserNode);
	//this.analyserNode.connect(this.pannerNode);
	this.fftMeter.connect(this.pannerNode);
	this.pannerNode.connect(this.faderNode);
	this.faderNode.connect(this.muteNode);
	
	// Set initial values
	// TODO: This is dangerous as defaults may not equal UI settings. Redo this
	this.inputNode.gain.value = 1; //TODO: set programatically
	/*
	 * As of W3C Working Draft 11 September 2014
	 * Panner node currently outputs 2 channels always
	 */
	this.pannerNode.PanningModeType = "equalpower";
	this.pannerNode.setPosition(0,0,1); //TODO: set programmatically
	this.muteNode.gain.value = 1; //TODO: Set programmatically
	
	// Draw channel strip
	this.createChannelStripUI();
} 

ChannelStrip.prototype.createChannelStripUI = function() {
	// TODO: Consider breaking channel strip into components
	// Create channel strip UI
	// Styles are set in CSS
	var desc = this.id;
	
	csDiv = document.createElement('div');
	csDiv.className = 'channel_strip';
	csDiv.id = desc.toLowerCase();
	
	// Meter
	
	meterDiv = document.createElement("div");
	meterDiv.className = "meter";
	
	csDiv.appendChild(meterDiv);
	
	// Panner and pan control
	
	pannerDiv = document.createElement("div");
	pannerDiv.className = "panner";
	
	pannerInput = document.createElement("input");
	pannerInput.className = "panner-slider";
	pannerInput.type = "range";
	pannerInput.min = "-45";
	pannerInput.max = "45";
	pannerInput.step = "1";
	pannerInput.value = this.panXdeg.toString();
	pannerInput.addEventListener("input", function(){
		mixer.channelStrips[desc].updatePan(this);
		});
	this.updatePanUI(pannerInput);
	
	pannerDiv.appendChild(pannerInput);
	csDiv.appendChild(pannerDiv);
	
	// Fader and fader control
	
	faderDiv = document.createElement("div");
	faderDiv.className = "fader";
	
	faderInput = document.createElement("input");
	faderInput.type = "range";
	faderInput.className = "fader-slider";
	cs = this;
	faderInput.min = this.faderMin.toString();
	faderInput.max = this.faderMax.toString();
	faderInput.step = "1";
	faderInput.value = this.faderDefault;
	faderInput.addEventListener("input", function(){
		mixer.channelStrips[desc].updateGain(this);
		});
	
	this.updateFaderUI(faderInput);
	faderDiv.appendChild(faderInput);
	csDiv.appendChild(faderDiv);
	
	// Lower controls
	
	lcDiv = document.createElement("div");
	lcDiv.className = "lower-controls";
	
	// Label
	
	labelDiv = document.createElement("div");
	labelDiv.className = "label";
	
	labelP = document.createTextNode(desc.toUpperCase());
	labelDiv.appendChild(labelP);
	lcDiv.appendChild(labelDiv);
	
	// Mute button
	
	mButton = document.createElement("button");
	mButton.className = "mute";
	mButton.title = "mute";
	mButton.appendChild(document.createTextNode("M"));
	mButton.addEventListener("click", function(){
		mixer.channelStrips[desc].mute(this);
		});
	lcDiv.appendChild(mButton);
	
	// Solo button
	
	if(this.id != this.mixer.endpointDesc) {
		sButton = document.createElement("button");
		sButton.className = "solo"
		sButton.title = "solo";
		sButton.appendChild(document.createTextNode("S"));
		sButton.addEventListener('click', function(){
			mixer.channelStrips[desc].solo(this);
			});
		lcDiv.appendChild(sButton);
	}
	csDiv.appendChild(lcDiv);
	
	
	// Place channel strip in mixer
	// Check of a master fader already exists, if so, insert before it
	var masterDiv = document.getElementById(this.mixer.endpointDesc);
	if (!masterDiv) {
		document.getElementById(this.mixer.id).appendChild(csDiv);		
	} 
	else {
		document.getElementById('mixer').insertBefore(csDiv,masterDiv);
	}
	
	console.log(csDiv);
}

ChannelStrip.prototype.updatePan = function(element) {
	
	this.panXdeg = parseInt(element.value);
	// According to SO post: http://stackoverflow.com/questions/14378305/how-to-create-very-basic-left-right-equal-power-panning-with-createpanner
	// need to add z component for natural sound
	// Still doesn't sound like a traditional panner but panner seems geared toward
	// 3D sound.
	this.panZdeg = 90 + this.panXdeg;
	if (this.panZdeg > 90)
		this.panZdeg = 180 - this.panZdeg;
	
	var x = Math.sin(this.panXdeg * (Math.PI / 180));
	var z = Math.sin(this.panZdeg * (Math.PI / 180));
	this.pannerNode.setPosition(x, 0, z);
	
	console.log(this.panXdeg + " : " + this.panZdeg);
	
	// Update UI element
	this.updatePanUI(element);
}

ChannelStrip.prototype.updatePanUI = function(element) {
	
	var str = "x: " + this.panXdeg + " deg, y: 0 deg, z: " + this.panZdeg + "deg";
	element.title = str;
	//console.log(element);
}
ChannelStrip.prototype.updateGain = function(element) {
	  var value = element.value;
	  var gain;
	  
	  if (value == this.faderUnity) // Dirty hack to get unity gain
		  gain = 1;
	  else {
		  var fraction = parseInt(element.value) / parseInt(element.max); 
		  gain = 2 * fraction * fraction; // up to 6dB gain
	  }
	  
	  this.faderNode.gain.value = gain;
	  this.updateFaderUI(element);
	  //console.log(this.key + " gain = " + dBFS(this.gainNode.gain.value).toFixed(2) + " dB");
}

ChannelStrip.prototype.updateFaderUI = function(element) {
	
	var str = "";
	if (this.faderNode.gain.value == 0)
		str = "-inf";
	else str = dBFS(this.faderNode.gain.value).toFixed(1) + "dB";
	
	element.title = str;
	console.log(element);
}

ChannelStrip.prototype.mute = function(element){
	this.muted = !this.muted;
	
	this.updateOutputNode();
	this.updateMuteUI(element);
}

ChannelStrip.prototype.updateOutputNode = function() {
	var isMuted;

	isMuted = this.muted || (this.mixer.soloBus && !this.soloed);
	isMuted ? this.muteNode.gain.value = 0 : this.muteNode.gain.value = 1;
	//console.log("Muted: " + isMuted);
}

ChannelStrip.prototype.updateMuteUI = function(element) {

	this.muted ? element.style.background = "#ff3333" : element.style.background = "#663333";
}

ChannelStrip.prototype.solo = function(element) {
	// Soloing is actually a mixer level function even though it is triggered by the ChannelStrip UI
	
	this.soloed = !this.soloed;
	
	//Update list of solo'd channels
	var index;
	index = this.mixer.soloChannels.indexOf(this);

	if (index == -1)
		this.mixer.soloChannels.push(this);
	else
		this.mixer.soloChannels.splice(index,1);
	
	// Update mixer soloBus boolean
	this.mixer.soloBus = (this.mixer.soloChannels.length > 0);

	// Update mute/solo node of all channels (except master)
	for (var k in this.mixer.channelStrips)
		if (k != this.mixer.endpointDesc)
			this.mixer.channelStrips[k].updateOutputNode();	
	this.updateSoloUI(element);
			
}

ChannelStrip.prototype.updateSoloUI = function(element) {
	this.soloed ? element.style.background = "#ffff33" : element.style.background = "#666633";
}

function dBFS(val){
	return (20 * log10(val));
}

function log10(val) {
	// Helper function to deal with the fact that
	// javascript log() function is base e
	  return Math.log(val) / Math.LN10;
	}