//kamera
var phi = 0, flipped = 0, mirrored = 0;
function setXformClass () {
	$('.xform').each(function(idx,el) {
		el.className = "xform x" +(flipped ? "-flipped":"") + (mirrored ? "-mirrored" : "") + "-rotated-" + phi;
	});
}
// set rotation angle phi and toggle rotate class
	$('#rotate').click(function() {
		phi = (phi + 90) % 360;
		setXformClass();
		if (phi % 180) {
			$('.xform-p').addClass('rotated');
		} else {
			$('.xform-p').removeClass('rotated');
		}
	});
	// toggle mirror class component
	$('#mirror').click(function() {
		mirrored = ! mirrored;
		setXformClass();
	});
	// toggle flip class component
	$('#flip').click(function() {
		flipped = ! flipped;
		setXformClass();
	});
	
var socket_kamera = io.connect("http://"+location.hostname+":8081");
socket_kamera.binaryType = 'arraybuffer';
socket_kamera.send(new ArrayBuffer);

var canvas = document.getElementById('canvas-video');
var context = canvas.getContext('2d');
var img = new Image();

// show loading notice
context.fillStyle = '#333';
context.fillText('Loading...', canvas.width/2-30, canvas.height/3);

socket_kamera.on('frame', function (data) {
  // Reference: http://stackoverflow.com/questions/24107378/socket-io-began-to-support-binary-stream-from-1-0-is-there-a-complete-example-e/24124966#24124966
  var uint8Arr = new Uint8Array(data.buffer);
  var str = String.fromCharCode.apply(null, uint8Arr);
  var base64String = btoa(str);

  img.onload = function () {
    context.drawImage(this, 0, 0, canvas.width, canvas.height);
  };
  img.src = 'data:image/png;base64,' + base64String;
});