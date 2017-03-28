var fs = require("fs");

// WebSocket server
var io = require('socket.io').listen(8081, function(){
  console.log('nasuchuję na porcie:',io.address().port);
});
var connection=0;	


var path='/tmp/out/';
var tmp=0;


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

		}
}
fs.watch(path, (eventType, filename) => {
 //console.log(path+filename+" event: "+eventType);
 if (filename && eventType=='change'){
 
	 var tab= filename.split(".");
	 if(tab[1]=="jpg"){
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

