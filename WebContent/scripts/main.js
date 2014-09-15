

/*
 * WebMixer main.js
 * Rob Innes Hislop
 * copyright 2014
 */

window.onload = init;
var a;
var bufferLoader;
var bufferLoadCount = 0;	 
var sourceHash = {};		// Hash of audio sources
var playing = false;
var ready = false;
//TODO: Create new loops
var inputs = { drums:"./audio/drums.mp3",
              bass:"./audio/bass.mp3",
              guitar:"./audio/guitar.mp3",
              /*keys:"./audio/guitar.mp3",
              vocals:"./audio/guitar.mp3",
              strings:"./audio/guitar.mp3",
              accordian:"./audio/guitar.mp3",*/
              horn:"./audio/horns.mp3"
		};
var inputCount = 0;
for (var key in inputs)
	inputCount++;
var mixer = 0;


function init() {
  // Fix up prefixing
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  a = new AudioContext();
  
  // Create mixer
  displayStatus("Creating a mixer...")
  mixer = new WebMixer(a); 
  
  // Load files, add channel strips
  // Load one at a time to guarantee order
  for (key in inputs) {
	  displayStatus("Loading " + key + " file into buffer...")
	  var bufferHash = {};
	  bufferHash[key] = inputs[key];
	  bufferLoader = new BufferLoader(
			    a,
			    bufferHash,
			    finishedLoading
			    );
	  // Ideally this would be done after buffers are loaded but doing so 
	  // creates the channel strips in an arbitrary order
	  mixer.addChannelStrip(a,key); //TODO: addChannelStrip should return the strip
	  bufferLoader.load();
  }
  console.log(a.destination);
}

function WebMixer(context) {
	
	this.channelStrips = {};	// Hash table of channel strips
	this.createMixerUI();
	this.soloChannels = [];
	this.mixerWidth = 0;
	this.csWidth = 0;

	// Create a channel strip and add it to the hash
	this.addChannelStrip(context,'master');
	this.routeChannelStrip(this.channelStrips['master'], null, context.destination);
}

WebMixer.prototype.addChannelStrip= function(context,label) {
	// Create a channel strip and add it to the mixer
	this.channelStrips[label] = new ChannelStrip(context,label);
	
	// Update the mixer document object width
	if (this.csWidth == 0) {
		this.csWidth = $(".channel_strip").css("width");
		// Remove the 'px' from the width attribute
		this.csWidth = parseInt(this.csWidth.slice(0,this.csWidth.length - 2));
	}
	
	this.mixerWidth += this.csWidth;
	$("#mixer").css("width","" + this.mixerWidth + "px");
}

WebMixer.prototype.createMixerUI = function () {
	// Insert mixer div
	var mixDiv = document.createElement('div');
	mixDiv.className = 'mixer';
	mixDiv.id = 'mixer'; // Might add support for multiple mixers
	document.getElementsByClassName('container')[0].appendChild(mixDiv);
}

WebMixer.prototype.routeChannelStrip = function(channelStrip, source, destination) {
	if (source) {
		source.connect(channelStrip.analyserNode);
	}
	if (destination) {
		channelStrip.muteNode.connect(destination);
	}
}

function ChannelStrip(context,label) {
	
	// Create elements
	this.key = label;
	this.analyserNode = context.createAnalyser ? context.createAnalyser() : context.createAnalyserNode();
	this.pannerNode = 0; //Not Implemented
	this.gainNode = context.createGain ? context.createGain() : context.createGainNode();
	this.defaultGain = 0;
	this.muteNode = context.createGain ? context.createGain() : context.createGainNode();
	this.muted = false; //Not implemented
	this.solod = false; //Not implemented
		
	// Connect elements
	this.analyserNode.connect(this.gainNode);
	this.gainNode.connect(this.muteNode);
	
	// Set initial values
	this.muteNode.gain.value = 1;
	
	// Draw channel strip
	this.createChannelStripUI(label);
} 

ChannelStrip.prototype.createChannelStripUI = function(desc) {
	// Create channel strip UI
	// TODO: use this.key and eliminate desc argument
	/*
 		<div class="channel_strip" id="master">
			<div class="meter">
			</div>
			<div class="fader">
				<input type="range" oninput="changeGain(this);" min="0" max ="100" step="1" value="0">
			</div>
			<div class="lower-controls">
				<div class="label">
					<p>label</p>
				</div>
				<button class="mute">M</button>
				<button class="solo">S</button>
			</div>
		</div>
	 */	
	csDiv = document.createElement('div');
	csDiv.className = 'channel_strip';
	csDiv.id = desc.toLowerCase();
	
	meterDiv = document.createElement('div');
	meterDiv.className = 'meter';
	
	csDiv.appendChild(meterDiv);
	
	faderDiv = document.createElement('div');
	faderDiv.className = 'fader';
	
	faderInput = document.createElement('input');
	faderInput.type = 'range';

	cs = this;
	faderInput.min = '0';
	faderInput.max = '100';
	faderInput.step = '1';
	faderInput.value = '71'; // corresponds to unity;
	faderInput.addEventListener('input', function(){mixer.channelStrips[desc].changeGain(this);});
	
	faderDiv.appendChild(faderInput);
	csDiv.appendChild(faderDiv);
	
	lcDiv = document.createElement('div');
	lcDiv.className = 'lower-controls';
	
	labelDiv = document.createElement('div');
	labelDiv.className = 'label';
	
	labelP = document.createTextNode(desc.toUpperCase());
	labelDiv.appendChild(labelP);
	lcDiv.appendChild(labelDiv);
	
	mButton = document.createElement('button');
	mButton.className = 'mute';
	//mButton.Name = 'M';
	mButton.title = "mute";
	mButton.appendChild(document.createTextNode('M'));
	lcDiv.appendChild(mButton);
	
	if(this.key != 'master') {
		sButton = document.createElement('button');
		sButton.className = 'solo'
		//sButton.Name = 'S';
		sButton.title = 'solo';
		sButton.appendChild(document.createTextNode('S'));
		lcDiv.appendChild(sButton);
	}
	csDiv.appendChild(lcDiv);
	var masterDiv = document.getElementById('master');
	if (!masterDiv) {
		document.getElementById('mixer').appendChild(csDiv);
		
	} else {
		document.getElementById('mixer').insertBefore(csDiv,masterDiv);
	}
	this.changeGain(csDiv); // Make sure UI and AudioNode are in sync
}


function finishedLoading(bufferHash) {
	
	// Create sources and connect to channel strips.
	var key;
	for (key in bufferHash) {
		sourceHash[key] = a.createBufferSource();

		sourceHash[key].buffer = bufferHash[key];
		displayStatus(key + " source loaded successfully");
				
		mixer.routeChannelStrip(mixer.channelStrips[key],sourceHash[key],mixer.channelStrips['master'].analyserNode);
		
		if (++bufferLoadCount == inputCount){
			displayStatus("Ready!");
			ready = true;
		}
	}
}

function play() {
	if (!playing && ready){
		playing = true;
		for (var key in sourceHash)
			sourceHash[key].start(0);
		displayStatus("Playing");
	}
}

function stop() {
	playing = false;
	for (var key in sourceHash)
		sourceHash[key].stop();
	displayStatus("Ready!");
}

ChannelStrip.prototype.changeGain = function(element) {
	  var value = element.value;
	  var gain;
	  
	  if (value == '71') // Dirty hack to get unity gain
		  gain = 1;
	  else {
		  var fraction = parseInt(element.value) / parseInt(element.max); 
		  gain = 2 * fraction * fraction; // up to 6dB gain
	  }
	  
	  this.gainNode.gain.value = gain;
	  this.updateFaderUI();
	  console.log(this.key + " gain = " + dBFS(this.gainNode.gain.value).toFixed(2) + " dB");
}

ChannelStrip.prototype.updateFaderUI = function() {
	
	var str = "";
	if (this.gainNode.gain.value == 0)
		str = "-inf";
	else str = dBFS(this.gainNode.gain.value).toFixed(1) + "dB";
	
	//$("#"+this.key).attr("label",str);
	$("#"+this.key).attr("title",str);
	console.log(str);
}

function dBFS(val){
	return (20 * log10(val));
}

function log10(val) {
	// This function is necessary because javascript is stupid. 
	// Math.log() is base e. Uhh, shouldn't that be Math.ln()
	  return Math.log(val) / Math.LN10;
	}

function displayStatus(message) {
	var output = "Status: " + message;
	document.getElementById("status").innerHTML=output;
	console.log(output);
}

