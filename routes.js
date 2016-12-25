var url = require('url');
var fs = require("fs");//operacje na plikach
var body_parser=require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var crypto = require('crypto')

module.exports = function(app) {
function hashPW(pwd){
	return crypto.createHash('sha256').update(pwd).digest('base64').toString();
}

function autoryzacja(req,res,next){
	//console.log(req.url)
	if(req.url!= "/login"){
		if(req.session.user){
			
		}else{
			req.session.error="brak dostępu";
			res.redirect('/login');
		}
	}
	next();
} 
app.use(autoryzacja);
app.use(body_parser.json()); // support json encoded bodies
app.use(body_parser.urlencoded({ extended: true })); // support encoded bodies

app.get('/',
  function(req, res) {
    res.render('home', {
		user: req.session.user,
		url: req.url
		});
  });

app.post('/login', 
  //passport.authenticate('local', { failureRedirect: '/' }),
  function(req, res) {
	var user={name:'tomtom'/*req.body.username*/, password:hashPW("2222")};
	//console.log(req);
	if(user.password === hashPW(req.body.password.toString())){
		req.session.regenerate(function(){
			req.session.user=user;
			req.session.success='uf, udało się :)';
			res.redirect('/');			
		});
	}else{
		req.session.regenerate(function(){
			req.session.error='oj, nieudało się :)';
			res.redirect('/login');			
		});
	}	
  });

app.get('/login',
  function(req, res){
    res.render('home', { user: req.session.user,url: req.url });
  });
  
app.get('/logout',
  function(req, res){
    //req.logout();
	req.session.destroy(function(){
		res.redirect('/login');
	})
  });

app.get('/profile',
  //require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
	  
    res.render('profile', { 
		user: req.session.user,
		url: req.url
		});
  });
  
app.get('/foty',
   //require('connect-ensure-login').ensureLoggedIn(),
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
		user: req.session.user,
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
  
}
