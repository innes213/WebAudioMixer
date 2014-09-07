

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
var inputList = [];		// List of input labels
	
//TODO: Create new loops
var inputs = { drums : './audio/guitar.mp3',
              bass   : './audio/guitar.mp3',
              guitar : './audio/guitar.mp3',
              horn   : './audio/guitar.mp3'};
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
	  bufferLoader = new BufferLoader(
			    a,
			    inputs[key],
			    finishedLoading
			    );
	  bufferLoader.load();
	  mixer.addChannelStrip(a,sources[sourceCount],key);
  }
  console.log(a.destination);
}

function WebMixer(audioContext) {
	this.aC = audioContext;
	this.channelStrips = {};	// Hash table of channel strips
	this.createMixerUI();
	this.addChannelStrip(this.ac, null, 'master');
}

WebMixer.prototype.addChannelStrip = function(context, inputSource, label) {
	// Create a channel strip and add it to the hash
	this.channelStrips[label] = new ChannelStrip(context, inputSource, label);
}

WebMixer.prototype.createMixerUI = function () {
	// Insert mixer div
	var mixDiv = document.createElement('div');
	mixDiv.className = 'mixer';
	document.getElementsByClassName('container')[0].appendChild(mixDiv);
}

function ChannelStrip(context, inputSource, label){
	this.analyserNode = null;
	this.gainNode = null;
	this.defaultGain = 0;
	this.muted = false;
	this.solod = false;
	this.createChannelStripUI(label);
} 

ChannelStrip.prototype.createChannelStripUI = function (desc) {
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
	
	document.getElementsByClassName('mixer')[0].appendChild(csDiv);
	
	// Create AudioNodes
	// Connect buffer to nodes, nodes to Master channel strip
}

function finishedLoading(bufferList) {
	
	// Create sources and connect to channel strips.
	for (var i = 0; i < bufferList.length(); i++) {
		
		sources[sourceCount] = a.createBufferSource();
		sources[sourceCount++].buffer = bufferList[i];

	}
	/*
	// Use this in addChannelStrip
	gainNode = a.createGain ? a.createGain() : a.createGainNode();
	source.connect(gainNode);
	gainNode.connect(a.destination);
	*/
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
