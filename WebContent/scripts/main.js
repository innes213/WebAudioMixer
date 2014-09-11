

/*
 * WebMixer main.js
 * Rob Innes Hislop
 * copyright 2014
 */

window.onload = init;
var a;
var bufferLoader;
var loadedSources;		// 
var sources = [];		// Array of audio sources
var sourceCount = 0;	// Count of audio sources
	
//TODO: Create new loops
var inputs = { drums:"./audio/guitar.mp3",
              bass:"./audio/guitar.mp3",
              guitar:"./audio/guitar.mp3",
              horn:"./audio/guitar.mp3"
		};
var sources = [];
var mixer = 0;


function init() {
  // Fix up prefixing
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  a = new AudioContext();
  
  // Create mixer
  mixer = new WebMixer(a); 
  // Load files, add channel strips
  for (var key in inputs){
	  console.log(key + ' : ' + inputs[key]);
	/*  bufferLoader = new BufferLoader(
			    a,
			    inputs[key],
			    finishedLoading
			    );
	  bufferLoader.load();
	  */
	  mixer.addChannelStrip(a,key); //TODO: addChannelStrip should return the strip
	  //mixer.routeChannelStrip(a,key,sources[sourceCount],mixer.channelStrips['master'].analyserNode);
  }
  console.log(a.destination);
}

function WebMixer(context) {
	//this.aC = context;
	this.channelStrips = {};	// Hash table of channel strips
	this.createMixerUI();
	this.soloChannels = [];
	this.mixerWidth = 00;
	this.csWidth = 0;

	// Create a channel strip and add it to the hash
	this.addChannelStrip(context,'master');
	//this.routeChannelStrip(this.channelStrips['master'], null, context.destination);
}

WebMixer.prototype.addChannelStrip= function(context,label) {
	// Create a channel strip and add it to the mixer
	this.channelStrips[label] = new ChannelStrip(context,label);
	
	// Update the mixer document object width
	if (this.csWidth == 0) {
		this.csWidth = $(".channel_strip").css("width");
		this.csWidth = parseInt(this.csWidth.slice(0,this.csWidth.length - 2));
		console.log(this.csWidth);
	}
	
	this.mixerWidth += this.csWidth;
	$("#mixer").css("width","" + this.mixerWidth + "px");
	console.log(this.mixerWidth);
}

WebMixer.prototype.createMixerUI = function () {
	// Insert mixer div
	var mixDiv = document.createElement('div');
	mixDiv.className = 'mixer';
	mixDiv.id = 'mixer'; // Might add support for multiple mixers
	document.getElementsByClassName('container')[0].appendChild(mixDiv);
}

WebMixer.prototype.routeChannelStrip = function(channelStrip, source, destination) {
	if (source)
		source.connect(channelStrip.analyserNode);
	if (destination)
		channelStrip.muteNode.connect(destination);
}

function ChannelStrip(context,label) {
	
	// Create elements
	//TODO: find a way to create AudioNodes without using global variable (this isn't modular)
	this.analyserNode = context.createAnalyser ? context.createAnalyser() : context.createAnalyserNode();
	this.gainNode = context.createGain ? context.createGain() : context.createGainNode();
	this.defaultGain = 0;
	this.muteNode = context.createGain ? context.createGain() : context.createGainNode();
	this.muted = false;
	this.solod = false;
	
	// Connect elements
	this.analyserNode.connect(this.gainNode);
	this.gainNode.connect(this.muteNode);
	
	// Draw channel strip
	this.createChannelStripUI(label);
} 

ChannelStrip.prototype.createChannelStripUI = function(desc) {
	// Create channel strip UI
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
	faderInput.oninput = 'changeGain(this);';
	faderInput.min = '0';
	faderInput.max = '100';
	faderInput.step = '1';
	faderInput.value = this.defaultGain.toString();
	
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
	mButton.Name = 'M';
	mButton.appendChild(document.createTextNode('M'));
	lcDiv.appendChild(mButton);
	
	sButton = document.createElement('button');
	sButton.className = 'solo'
	sButton.Name = 'S';
	sButton.appendChild(document.createTextNode('S'));
	lcDiv.appendChild(sButton);
	
	csDiv.appendChild(lcDiv);
	var masterDiv = document.getElementById('master');
	if (!masterDiv) {
		document.getElementById('mixer').appendChild(csDiv);
		
	} else {
		document.getElementById('mixer').insertBefore(csDiv,masterDiv);
	}
}

function finishedLoading(bufferList) {
	
	// Create sources and connect to channel strips.
	for (var i = 0; i < bufferList.length(); i++) {
		
		sources[sourceCount] = a.createBufferSource();
		sources[sourceCount++].buffer = bufferList[i];
		console.log(sourceCount + "source loaded successfully")

	}
}
/*

WebMixer.play = function() {
	source.start(0);
};

WebMixer.stop = function() {
	source.stop();
};

WebMixer.channelStrips = [];
WebMixer.createChannelStrip = function() {
	
};
*/
function changeGain(element) {
	  var volume = element.value;
	  var fraction = parseInt(element.value) / parseInt(element.max);
	  gainNode.gain.value = math.pow(10,fraction);
	  console.log(gainNode.gain.value);
}

/*
function createSource(buffer) {
	var source = a.createBufferSource();
	var gainNode = a.createGain ? a.createGain() : a.createGainNode();
	source.buffer = buffer;
	source.loop = true;
	source.connect(gainNode);
	gainNode.connect(context.destination);
	
	return {
		source: source, 
		gainNode: gainNode
	};
}
*/
