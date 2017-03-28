var url = require('url');
var fs = require("fs");//operacje na plikach
var body_parser=require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var db = require('./db');

module.exports = function(app) {


function autoryzacja(req,res,next){
	//console.log(req.url)
	if(req.url!= "/login"){
		if(req.session.user){
			next();
		}else{
			req.session.error="brak dostępu";
			res.redirect('/login');
		}
	}else next();
	
} 
app.use(cookieParser('magicString'));
app.use(session({
  secret: 'tajne-poufne',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use(autoryzacja);
app.use(body_parser.json()); // support json encoded bodies
app.use(body_parser.urlencoded({ extended: true })); // support encoded bodies
//trasy
app.get('/',home )
app.post('/login',loginpost) 
app.get('/login',login)
app.get('/logout',logout)
app.get('/profile',profile)
app.get('/foty',foty)

//funkcje tras
function home(req, res) {
    res.render('home', {
		url: req.url,
		session: req.session
		});
}

function loginpost(req, res) {
	db.users.findByUsername(req.body.username,  function(err, user) {
        if (err || !user ) { 
			req.session.regenerate(function(){
				req.session.error='oj, nie udało się :)';
				res.redirect('/login');
			})
		}else
		if (user.password === db.users.hashPW(req.body.password.toString())) { 
			   req.session.regenerate(function(){
					req.session.user=user;
					req.session.success='uf, udało się :)';
					res.redirect('/');			
				});
		}else{
				req.session.regenerate(function(){
					req.session.error='oj, nie udało się, błędne hasło:)';
					res.redirect('/login');			
				});   
		   }
     });
}

function login(req, res){
    res.render('home', { user: req.session.user,url: req.url ,session: req.session});
}

function logout(req, res){
	req.session.destroy(function(){
		res.redirect('/login');
	})
}  

function profile(req, res){
    res.render('profile', { 
		url: req.url,
		session: req.session
		});
}
  
function foty(req, res){
	  var url_parts =url.parse(req.url,true);
	 // var url1= req.url.split("?")
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
			session: req.session,
			list_foto: files,	
			ile_start: start,
			ile_end: end,
			strona: query.strona,
			stron: stron,
			ile_all: ile_all,
			url: req.url
			});
	});

  } 
  
}
