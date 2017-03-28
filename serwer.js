var express = require('express');
var app=express();
var http = require('http').Server(app);
var url = require('url');
const io = require('socket.io')(http);
const os = require('os');
const child_process = require('child_process');

var wire=require('./1wire');
const atmega = require('./atmega');
const serwa = require('./serwa');
const app_exe = require('./app_exe');


var prog_pradu_silniki=80;
var opoznienie_alar_prad=1200;
var sterowanie_silnikami=[0x10,0,0,0]; 
var wykryto_ruch=0;

var info_exe= new Uint8Array(5); 
var bezwladnosc=0;
info_exe[0]=1;
app_exe.AppExe.SetSocketIO(io);

var process_options= { 
		env: {user:'pi'},
		encoding:'utf8'
};
var child_js=child_process.fork("/home/pi/robot/kamera_ruch.js",['-parametr','par2'],process_options);
//odbieranie z wątku
child_js.on('message',(message)=>{
	console.log("Wątek node: "+message);
});
//wysyłanie do wątku
//child_js.send({cld:command}); 

// Configure view engine to render EJS templates. pug - inny silnik
app.set('views', __dirname + '/nodeweb/views');
app.set('view engine', 'ejs');
		
app.use(express.static(__dirname+'/nodeweb/'))
app.set('port',process.env.PORT || 8080)
var server=http.listen(app.get('port'), ()=>{
  console.log('nasuchuję na porcie:',server.address().port);
});
function Shutdown(){
	console.log("wysłano kill signal.");
	app_exe.AppExe.KillApp();
	child_js.kill();
	server.close(()=> {
		console.log("Closed out remaining connections.");
	});
	process.exit();
 }
 
try {
var routes = require('./routes')(app); 

io.on('connection', (socket)=>{
	;//console.log('user connected:'+socket);
	
	socket.on('disconnect', ()=>{
		;//console.log('user disconnected');
	});
	socket.on('error', (reason)=>{
		console.log('socket error: '+reason);
	});
  
	socket.on('gettemperature', (msg)=>{
		//console.log('gettemperature: '+msg);
		t1=wire.Termometr.GetTempe1();
		t2=wire.Termometr.GetTempe2();
		io.emit('temperatura1',t1);
		io.emit('temperatura2',t2);
		//console.log('temparatury: T1: '+t1+'°C T2:'+t1+'°C')
	});
	
	socket.on('restart', (msg)=>{
		console.log('restart: '+msg);
		var tab= msg.split(";")
		//dopisz resetowanie systemu i atmegi
		atmega.atmega.Write(tab);
		io.emit('restart','restart');
	});
	
	socket.on('silniki', (msg)=>{
		//console.log('silniki: '+msg);
		sterowanie_silnikami= msg.split(";")
		//var dane = new Uint8Array(4);
		//console.log(dane);
		
		io.emit('silniki',sterowanie_silnikami);
	});
	
	socket.on('os_info', (msg)=>{
		//console.log('silniki: '+msg);
		var tab=os.uptime()+";"+os.loadavg()+";"+os.freemem();//JSON.stringify(os.cpus())
		tab+=";"+atmega.atmega.GetInfo().info;
		io.emit('os_info',tab);
	});
	
	socket.on('getprady', (msg)=>{
		//console.log('getprady: '+msg);
		var info=atmega.atmega.GetInfo();
		var dane=info.pradlewy.toFixed(3)+";"+info.pradprawy.toFixed(3)+";"+info.napiecie.toFixed(3)+";"+info.pradserw.toFixed(3);
		//console.log('getprady: '+dane);
		io.emit('napiecie_i_prady',dane);
	});
	
	socket.on('setAlarm', (msg)=>{
		var tab= msg.split(";")
		prog_pradu_silniki=tab[0];
		if(prog_pradu_silniki>255)prog_pradu_silniki=255;
		opoznienie_alar_prad=tab[1];
		var data1= new Uint8Array(5);
		data1[0]=0x20;
		data1[1]=prog_pradu_silniki;
		data1[2]=0x21;
		data1[3]=opoznienie_alar_prad&0xFF;
		data1[4]=(opoznienie_alar_prad>>8)&0xFF;
		//console.log("prog:"+tab[0] +" opoz:"+tab[1] +" "+data1[3]+" "+data1[4]);
		process.nextTick(function() {
			atmega.atmega.Write(data1);
		});
		
		io.emit('setAlarm',tab);
	});
	socket.on('nagrywac_exe', (msg)=>{
			info_exe[0]=msg;
	});
	
	socket.on('Init', (msg)=>{
		var ss=serwa.serwa.GetInfo();
		var tab=ss.barkLP+";"+
				ss.barkGD+";"+
				ss.lokiec+";"+
				ss.nadgarstek+";"+
				ss.szczeki+";"+ 
				prog_pradu_silniki+";"+
				opoznienie_alar_prad+";"+
				info_exe[0]+";"+info_exe[1]+";"+info_exe[2]+";"+info_exe[3]+";"+info_exe[4];
		io.emit('Init',tab);
	});
	
	socket.on('serwa', (msg)=>{
		//console.log('serwa: '+msg);
		serwa.serwa.Write(msg);
		io.emit('serwa',msg);
	});
	
	socket.on('wykryto_ruch', (msg)=>{
		io.emit('wykryto_ruch',wykryto_ruch);
	});
	
});
 
 //pętla główna wywoływana co 100ms
 function Update() {
	 process.nextTick(function() {
		 atmega.atmega.UpdateInfo();
		//aktualizacja sterowania silnikami 
		//jak przez 1s  nie zaktualizujemy silników to atmega wyłączy silniki
		atmega.atmega.Write(sterowanie_silnikami);
	 });
	//pytamy program exe po gniazdach co tam u niego i wydajemy rozkazy
	//trzeba wywoływać parę razy na sekundę inaczej zatrzyma się wykrywanie
	var buf= new Uint8Array(5); 
	buf[0]=info_exe[0];buf[1]=info_exe[1];buf[2]=info_exe[2];buf[3]=info_exe[3];buf[4]=info_exe[4];
	if(serwa.serwa.IsEnable()!=0 || sterowanie_silnikami[2]!=0 || sterowanie_silnikami[3]!=0){
		buf[0]=2;//gdy chodzą silniki albo serwa wyłącz wykrywanie ruchu
		bezwladnosc=7;
	}else{
		//SocketWyslijAll(info_exe);
		if(bezwladnosc<0) //małe opużnienie na bezwładność
			;
		else {
		bezwladnosc--;
		buf[0]=2;//gdy chodzą silniki albo serwa wyłącz wykrywanie ruchu
		}
	}
	process.nextTick(function() {
		app_exe.AppExe.WyslijAll(buf);
		wykryto_ruch = app_exe.AppExe.GetWykrytoRuch();
		//console.log(wykryto_ruch);
	});
 }
 setInterval(Update,200);
 
// listen for TERM signal .e.g. kill 
process.on ('SIGTERM', Shutdown);
// listen for INT signal e.g. Ctrl-C
process.on ('SIGINT', Shutdown); 


} catch (err) {
	
	console.log(err);
	Shutdown();
	}

