/*
 * from Getting Started with Web Audio API
 * http://www.html5rocks.com/en/tutorials/webaudio/intro/
 * 
 * Modified to use a hash instead of list.
 */

function BufferLoader(context, urlHash, callback) {
  this.context = context;
  this.urlHash = urlHash;
  this.onload = callback;
  this.bufferHash = {};
  this.loadCount = 0;
  this.urlHashLength = 0;

  var key;
  for (key in urlHash){
	  this.urlHashLength++;
  }
}

BufferLoader.prototype.loadBuffer = function(url, key) {

	// Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
	  
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferHash[key] = buffer;
        if (++loader.loadCount == loader.urlHashLength) {
        	loader.onload(loader.bufferHash);
        }
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }
  request.send();
}

BufferLoader.prototype.load = function() {
    var key;
	for (key in this.urlHash) {
	  this.loadBuffer(this.urlHash[key], key);
	}
}
