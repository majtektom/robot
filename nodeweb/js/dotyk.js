var socket = io();
// polyfill
var reqAnimationFrame = (function () {
	return window[Hammer.prefixed(window, 'requestAnimationFrame')] || function (callback) {
		window.setTimeout(callback, 1000 / 60);
	};
})();

var screen = document.querySelector(".device-screen");
var el = document.querySelector("#hitarea");
var wynik = $('#silniki_test');


var START_X = Math.round((screen.offsetWidth - el.offsetWidth) / 2);
var START_Y = Math.round((screen.offsetHeight - el.offsetHeight) / 2);

var ticking = false;
var transform;
var timer;
var mc = new Hammer.Manager(el);
mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
mc.on("panstart panmove", onPan);
mc.on("hammer.input", function(ev) {
	if(ev.isFinal) {
		resetElement();
	}
});

function resetElement() {
	el.className = 'animate';
	transform = {
		translate: { x: START_X, y: START_Y },
		scale: 1,
		angle: 0,
		rx: 0,
		ry: 0,
		rz: 0
	};
	wynik.text('x= '+ 0+' y= '+ 0);
	var data= new Int16Array(4);
	data[0]=0x10;	data[1]=0; data[2]=0;data[3]=0;
	var tt=data.join(";");
	socket.emit('silniki', tt); 
	requestElementUpdate();
}

function updateElementTransform() {
	var value = [
		'translate3d(' + transform.translate.x + 'px, ' + transform.translate.y + 'px, 0)'
	];

	value = value.join(" ");
	el.style.webkitTransform = value;
	el.style.mozTransform = value;
	el.style.transform = value;
	ticking = false;
}

function requestElementUpdate() {
	if(!ticking) {
		reqAnimationFrame(updateElementTransform);
		ticking = true;
	}
}


function onPan(ev) {
	el.className = '';
	transform.translate = {
		x: START_X + ev.deltaX,
		y: START_Y + ev.deltaY
	};
	
	var data= new Int16Array(4);
	var flagi=0;
	var predkosc= ev.deltaY*2; 
	var obrot= ev.deltaX*2;
	if(predkosc<-255)predkosc=-255;
	if(predkosc>255)predkosc=255;
	if(obrot<-255)obrot=-255;
	if(obrot>255)obrot=255;
	obrot=-obrot;
	predkosc=-predkosc;
	wynik.text('x= '+ predkosc+' y= '+ obrot);
	if(predkosc<0){
		predkosc=-predkosc;
		flagi|=(1<<0)&0x01;
	}
	if(obrot<0){
		obrot=-obrot;
		flagi|=(1<<1)&0x02;
	}	 
	
	data[0]=0x10;	data[1]=flagi; data[2]=predkosc; data[3]=obrot; 
	var tt=data.join(";");
	socket.emit('silniki', tt);
					
	requestElementUpdate();
}

resetElement();

document.querySelector(".device-button").addEventListener("click", function(){
document.querySelector(".device").classList.toggle('hammertime');
}, false);


