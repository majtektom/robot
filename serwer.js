var wire=require('./1wire');
var express = require('express');
var app=express();
var session = require('express-session');
var body_parser=require('body-parser');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var passportSocketIo = require('passport.socketio');
//var cookie = require("cookie");
var cookieParser = require('cookie-parser');
//connect = require('connect');
var db = require('./nodeweb/db');
var http = require('http').Server(app);
var url = require('url');
//var url_parts = url.parse(request.url, true);
//var query = url_parts.query;
var io = require('socket.io')(http);
var i2c = require('i2c');
var fs = require("fs");//operacje na plikach

var socketioRedis = require("passport-socketio-redis");
var redis = require("redis").createClient();
var RedisStore = require('connect-redis')(session);
//var RedisUrl = require('redisurl');

var address = 0x10;//adres atmegi na lini i2c
var atmega = new i2c(address, {device: '/dev/i2c-1'}); 

var SerialPort = require("serialport");
var port = new SerialPort("/dev/ttyAMA0", {
  baudRate: 115200
}); 

var pradlewy=0;
var pradprawy=0;
var napiecie=0;

var wykryto_ruch=0;
// Configure the local strategy for use by Passport.
//
// Strategia lokalna wymaga `verify` funkcję, która odbiera dane uwierzytelniające (` username` i `password`) przedstawione przez użytkownika.
// Funkcja musi sprawdzić, czy hasło jest poprawne, a następnie wywołać `cb` z obiektu użytkownika, 
//który zostanie ustawiony na` req.user` się obsługą tras po uwierzytelnieniu.
passport.use(new Strategy(
  function(username, password, cb) {
    db.users.findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
  }));


// Configure Passport authenticated session persistence.
//
// W celu przywrócenia stanu uwierzytelniania całej żądań HTTP, 
//Paszport musi serializacji użytkowników do i użytkowników deserializowania z sesji.
// Typowa implementacja jest to tak proste, jak dostarczanie identyfikator użytkownika
// podczas szeregowania i odpytywania rekordu przez ID użytkownika z bazy danych przy deserializacji.
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  db.users.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});



// Configure view engine to render EJS templates. pug - inny silnik
app.set('views', __dirname + '/nodeweb/views');
app.set('view engine', 'ejs');
		
app.use(express.static(__dirname+'/nodeweb/'))
//app.use(express.json());
//app.use(express.urlencoded());
//app.use(express.methodOverride());
//app.use(app.router);

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
//app.use(require('morgan')('combined'));
app.use(cookieParser());
app.use(body_parser.urlencoded({ extended: true }));
app.use(session({ 
	secret: 'keyboard cat', 
	resave: false, 
	store:       sessionStore,
	saveUninitialized: false }));
// Sets up a session store with Redis
//var sessionStore = new RedisStore({ client: RedisUrl.connect(process.env.REDIS_URL) });
var sessionStore = new RedisStore({   host: 'localhost',   port: 6379, client: redis});
// app.use(session({
  // key: 'connect.sid',
  // secret: 'keyboard cat',
  // store: sessionStore,
  // resave: false, saveUninitialized: false 
// }));
//zabezpieczenia socketów
// io.use(socketioRedis.authorize({
    // passport:passport,
    // cookieParser: cookieParser,
    // secret:      'keyboard cat',    
    // store:       sessionStore,
    // success:     authorizeSuccess,  
    // fail:        authorizeFail     
// }));

function authorizeSuccess(data, accept)
{
    console.log('Authorized success');
    accept();
}

function authorizeFail(data, message, error, accept)
{
    if(error)
        accept(new Error(message));
}


// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


var server=http.listen(8080, function(){
  console.log('nasuchuję na porcie:',server.address().port);
});
// Define routes ----------------------------------------------------------------------------------
app.get('/',
  function(req, res) {
	require('connect-ensure-login').ensureLoggedIn(),
    res.render('home', {
		user: req.user,
		url: req.url
		});
  });
 
//app.get('/', function(req, res){
//  res.sendFile(__dirname + '/nodeweb/index.html');
//});

app.get('/login',
  function(req, res){
    res.render('home', { user: req.user,url: req.url });
  });
  
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  });
  
app.get('/logout',
  function(req, res){
    req.logout();
    res.redirect('/');
  });

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('profile', { 
		user: req.user,
		url: req.url
		});
  });
  
app.get('/foty',
   require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
	  var url_parts =url.parse(req.url,true);
	  var url1= req.url.split("?")
	  var query=url_parts.query;
	  if(!query.strona)query.strona=1;
	  if(query.del){
		  //usuwamy pliki
		  if(query.del=="ALL"){//usuwamy wszystkie
			  fs.readdir("/home/pi/robot/nodeweb/fotki",function(err, files){
			   if (err) {
				  return console.error(err);
			   } 
			    if (files.length > 0)
				for (var i = 0; i < files.length; i++) {
				  var filePath = "/home/pi/robot/nodeweb/fotki" + '/' + files[i];
				  if (fs.statSync(filePath).isFile())
					fs.unlinkSync(filePath);
				}
			  });
		  }else
			  fs.unlinkSync("/home/pi/robot/nodeweb/fotki/"+query.del);
			  
	  }
	 // console.log(req.url);
	 // console.log("query ",query);
	 //lista plików do wyświetlenia
	 fs.readdir("/home/pi/robot/nodeweb/fotki",function(err, files){
	   if (err) {
		  return console.error(err);
	   } 
		
		var ile=21;//21 obrazów na strone
		var ile_all=files.length;
		var start=(query.strona-1)*ile;
		var end=ile+start;
		var stron=Math.floor(ile_all/ile)+1;
		if(end > ile_all) end =ile_all;
		
		res.render('foty', { 
		user: req.user,
		list_foto: files,	
		ile_start: start,
		ile_end: end,
		strona: query.strona,
		stron: stron,
		ile_all: ile_all,
		url: url1[0]
		});
	});

  }); 



//uart
port.on('open', function() {
  // port.write("test", function(err) {
  // if (err) { return console.log('Error on write: ', err.message); }
  // });
});

port.on('error', function(err) {
  console.log('Error uart: ', err.message);
})

port.on('data', function(data) {
  //console.log('data uart: ', data);
})

//io.on('connection', require('./kamera_ruch'));

io.on('connection', function(socket){
	console.log('a user connected:'+socket);
	
	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
	socket.on('error', function(reason){
		console.log('socket error: '+reason);
	});
  
	socket.on('gettemperature', function(msg){
		//console.log('gettemperature: '+msg);
		t1=wire.GetTempe1();
		t2=wire.GetTempe2();

		io.emit('temperatura1',t1);
		io.emit('temperatura2',t2);
		//console.log('temparatury: T1: '+t1+'°C T2:'+t1+'°C')
	});
	
	socket.on('restart', function(msg){
		console.log('restart: '+msg);
		var tab= msg.split(";")
		//dopisz resetowanie systemu i atmegi
		atmega.write(tab, function(err) {});
		io.emit('restart','restart');
	});
	
	socket.on('silniki', function(msg){
		//console.log('silniki: '+msg);
		var tab= msg.split(";")
		//var dane = new Uint8Array(4);
		//console.log(dane);
		atmega.write(tab, function(err) {});
		io.emit('silniki',tab);
	});
	
	socket.on('getprady', function(msg){
		//console.log('getprady: '+msg);
		//prad
		atmega.readBytes(0x11, 6, function(err, res) {
			//console.log(err+' prad: '+res);
			pradlewy= Number(res[1]) | Number(res[2])<<8;
			pradlewy= pradlewy*(375*(247/1024))/10000;
		    pradprawy=Number(res[3]) | Number(res[4])<<8;
			pradprawy=pradprawy*(375*(247/1024))/10000;
		});
		//napiecie
		atmega.readBytes(0x12, 4, function(err, res) {
			//console.log(err+' napiecie: '+Number(res[0])+' '+Number(res[1])+' '+Number(res[2])+' '+Number(res[3])+' '+Number(res[4]));
			napiecie=Number(res[1]) | Number(res[2])<<8;
			napiecie=(napiecie*(247/1024)/10);//popraw
			
		});
		var dane=pradlewy.toFixed(3)+";"+pradprawy.toFixed(3)+";"+napiecie.toFixed(3);
		//console.log('getprady: '+dane);
		io.emit('napiecie_i_prady',dane);
	});
	
	socket.on('serwa', function(msg){
		//console.log('serwa: '+msg);
		
		var data1= new Uint8Array(6);
		//spowalniamy serwa z zadaną prędkością będzie dążyć do zadanego położenia
		//0x7F, nr serwa,bajt/2 danych, bajt/2 danych
		data1[0]=135;	data1[1]=0;		
		data1[2]=5; 	data1[3]=0;  	
		port.write(data1);
						data1[1]=1;		
		data1[2]=5; 	 	
		port.write(data1);
						data1[1]=2;		
		data1[2]=5; 	 	
		port.write(data1);
						data1[1]=3;		
		data1[2]=5; 	 	
		port.write(data1);
						data1[1]=4;		
		data1[2]=5; 	 	
		port.write(data1);

		
		var tab= msg.split(";")
		var data= new Uint8Array(13);
		//0x9F, ile serw, nr serwa,bajt1 danych, bajt2 danych
		data[0]=tab[0];		data[1]=tab[1];		data[2]=tab[2]; 
		data[3]=tab[3]&0x7F;  data[4]=(tab[3]>>7)&0x7F;
		data[5]=tab[4]&0x7F;  data[6]=(tab[4]>>7)&0x7F;
		data[7]=tab[5]&0x7F;  data[8]=(tab[5]>>7)&0x7F;;
		data[9]=tab[6]&0x7F;  data[10]=(tab[6]>>7)&0x7F;
		data[11]=tab[7]&0x7F; data[12]=(tab[7]>>7)&0x7F;
		//console.log('serwa: '+data);
		port.write(data);
		io.emit('serwa',msg);
	});
	
	socket.on('wykryto_ruch', function(msg){
		io.emit('wykryto_ruch',wykryto_ruch);
	});
	
});

fs.watch("/home/pi/robot/nodeweb/fotki/", (eventType, filename) => {
   //console.log(filename+" "+eventType);
   if (filename && eventType=='rename'){
 	 var tab= filename.split(".");
	 if(tab[1]=="jpg"){
		wykryto_ruch++;
		
	}//czy jpg
  }	
 });
