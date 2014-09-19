

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
  mixer = new WebMixer(a,"mixer"); 
  
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
	  mixer.addChannelStrip(a,key); 
	  bufferLoader.load();
  }
  console.log(a.destination);
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


function displayStatus(message) {
	var output = "Status: " + message;
	document.getElementById("status").innerHTML=output;
	console.log(output);
}

