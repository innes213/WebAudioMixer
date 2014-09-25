
/*
 * WebMixer main.js
 * Rob Innes Hislop
 * copyright 2014
 */

window.onload = init;

var a;						//AudioContext instance
var bufferLoader;			
var bufferLoadCount = 0;	 
var sourceHash = {};		// Hash of audio sources

var mixer = 0;				// Mixer instance

// Transport variables
var playing = false;
var ready = false;
var startTime = 0;
var playTime = 0;

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

function init() {
  // Fix up prefixing
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  a = new AudioContext();
  if (!a){
	  alert("This browser does not support Web Audio API");
  } else {

	  // Count number of sources
	  for (var key in inputs)
			inputCount++;
	  
	  // Create mixer
	  displayStatus("Creating a mixer...")
	  mixer = new WebMixer(a,"mixer"); 
	  
	  // Load files, add channel strips
	  // Call one at a time to guarantee order
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
  }
  //console.log(a.destination);
}

function finishedLoading(bufferHash) {
// Callback for bufferLoader
	
	// Create sources and connect to channel strips.
	var key;
	for (key in bufferHash) {
		sourceHash[key] = a.createBufferSource();

		sourceHash[key].buffer = bufferHash[key];
		displayStatus(key + " source loaded successfully");
				
		mixer.routeChannelStrip(mixer.channelStrips[key],sourceHash[key],mixer.channelStrips[mixer.endpointDesc].inputNode);
		
		if (++bufferLoadCount == inputCount){
			displayStatus("Ready!");
			ready = true;
		}
	}
}

function play(element) {
	if (playing) {
		playing = false;
		element.firstChild.data = "Play";
		// Remember where we left off
		playTime += a.currentTime - startTime;
		for (var key in sourceHash)
			sourceHash[key].disconnect();
		displayStatus("Paused at " + playTime.toFixed(2));
		
	} else if (!playing && ready) {
		playing = true;
		element.firstChild.data = "Pause";
		
		// Update startTime
		startTime = a.currentTime;

		for (var key in sourceHash){
			mixer.connectChannelStripInput(mixer.channelStrips[key],sourceHash[key]);
			// AudioSource.start() can only be called once!
			if (playTime == 0)
				sourceHash[key].start(playTime);
		}
		displayStatus("Playing");
	}
}

function stop() {
	playing = false;
	for (var key in sourceHash)
		// Stop destroys the graph
		sourceHash[key].stop();
	displayStatus("Graph is destroyed. Reload page to restart.");
}


function displayStatus(message) {
	var output = "Status: " + message;
	document.getElementById("status").innerHTML=output;
	console.log(output);
}

