var cv = require('opencv');
var fs = require("fs");


// modules
var express = require('express')
  , http = require('http');

// configuration files
//var configServer = require('./lib/config/server');

// app parameters
var app = express();
app.set('port', 8081);
//app.use(express.static(configServer.staticFolder));
//app.use(morgan('dev'));

// serve index
//require('./lib/routes').serveIndex(app, configServer.staticFolder);

// HTTP server
var server = http.createServer(app);
server.listen(app.get('port'), function () {
  console.log('HTTP server listening on port ' + app.get('port'));
});

// face detection properties
var rectColor = [255, 0, 0];
var rectThickness = 5;

// initialize camera
//var camera = new cv.VideoCapture('/tmp/1.jmpg');//'bird.avi'
//camera.setWidth(camWidth);
//camera.setHeight(camHeight);
//przepisanie dwóch poprzednich klatek
var t_minus=0;
var kk;
var x=0;
var connection=0;	
var lowThresh = 0;
var highThresh = 100;
var nIters = 2;
var minArea = 2000;
var roznica = 0;
var BLUE  = [0, 255, 0]; // B, G, R
var RED   = [0, 0, 255]; // B, G, R
var GREEN = [0, 255, 0]; // B, G, R
var WHITE = [255, 255, 255]; // B, G, R
// WebSocket server
var io = require('socket.io')(server);
var path='/tmp/out/';
var tmp=0;
//czy katalog istnieje

function checkDirectorySync(directory) {
  try {
    fs.statSync(directory);
  } catch(e) {    
    try {
        fs.mkdirSync(directory);
    } catch(e) {
        return e;
    }
  }
}
checkDirectorySync(path);  

function przetwarzaj(){
	if(tmp!=0){
		fs.readFile(tmp, function(err, buf){
			io.emit('frame', { image: true, buffer: buf, type:'Private Msg' });
			//io.emit('frame', { image: true, buffer: buf.toString('base64') });
		});
			//cv.readImage(tmp, function(err, im){//cieknie edycja /etc/crontab rozwiązała sprawę
			//if (err) throw err;
			//if(connection>0) io.emit('frame', {image: true, buffer: im.toBuffer() });
		
			//});
		}
}
fs.watch(path, (eventType, filename) => {
 //console.log(path+filename+" event: "+eventType);
 if (filename && eventType=='change'){
 
	 var tab= filename.split(".");
	 if(tab[1]=="jpg"){
/*
		 cv.readImage(path+filename, function(err, im){//cieknie edycja /etc/crontab rozwiązała sprawę
			 if (err) throw err;
			//im.convertGrayscale()
			//im.canny(70, 300)
			//im.houghLinesP()
			var w=im.width();
			var h=im.height();  
			if(t_minus==0) t_minus=im.copy();
			ruch=0;
			
			//----------------------------------------
			//kk = new cv.Matrix(w, h); 
			kk=im.copy();
			var diff = new cv.Matrix(w, h); 
			diff.absDiff(im, t_minus);
			
			//diff.convertGrayscale();
			im_canny = diff.copy();
			im_canny.convertGrayscale();
			im_canny.canny(lowThresh, highThresh);
			im_canny.dilate(nIters);
			contours = im_canny.findContours();
			for (i = 0; i < contours.size(); i++) {
			if (contours.area(i) < minArea) {
				//if (contours.area(i) > 400) console.log('zaslaby ruch : ', contours.area(i));
				continue;
				} 
			var wynik=contours.area(i);
			//var wynik=  diff.countNonZero();
			console.log('ruch: ', wynik);
			 var arcLength = contours.arcLength(i, true);
			contours.approxPolyDP(i, 0.02 * arcLength, true);
			// switch(contours.cornerCount(i)) {
			  // case 3:
				// diff.drawContour(contours, i, GREEN);
				// break;
			  // case 4:
				// diff.drawContour(contours, i, WHITE );
				// break;
			  // default:
				// diff.drawContour(contours, i, RED);
			// }
			kk.drawContour(contours, i, RED);
			//var jj = new cv.Matrix(w, h); 
			///jj.absDiff(im,diff);
			kk.save('/home/pi/robot/nodeweb/fotki/' + filename )
			 }
				t_minus=im.copy();
			
		});
		if(connection>0) io.emit('frame', {image: true, buffer: kk.toBuffer() });
		kk.release();
		//diff.release();
		im_canny.release();
		im_canny=null;
		kk=null;
		diff=null;
		
*/		
		tmp=path+filename;
		setTimeout(przetwarzaj,20);
		
		
	}//czy jpg
  }	
 });



io.on('connection',  function (socket) {
	connection++;
	socket.on('disconnect', function(){
		connection--;
	});
	socket.on('error', function(reason){
		console.log('socket error: '+reason);
	});
});

