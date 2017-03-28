// Load the TCP Library
const net = require('net');

const child_process = require('child_process');


function CAppExe()
{
	var _this = this;
	var clients_socket = [];
	var socketio=null;//wskaznik do socket.io musimy go ustawic zanim będziemy mogli korzystać
	var process_options= { 
			env: {user:'pi'},
			detached: false,
			stdio: ['pipe','pipe','pipe']
	};
	var child_exe=child_process.spawn("/home/pi/robot/opencv_ruch/wykryj",['-parametr','par2'],process_options);
	var wykryto_ruch=0;
	child_exe.stdout.on('data',function(data){ 
		
		console.log("wynik z exe "+data);
	});
	child_exe.stderr.on('data',function(data){ console.log("exe bład "+data.toString());});
	child_exe.on('exit',function(code){		console.log("proces zakończony z kodem: "+code);	});
	
	 this.SetSocketIO=function(socio) {
		 socketio=socio
	 }
	 this.KillApp=function() {
		 child_exe.kill();
	 }
	// Send a message to all clients
	 this.broadcast=function(message, sender) {
		clients_socket.forEach(function (client) {
		  // Don't want to send it to sender
		  if (client === sender) return;
		  client.write(message);
		});
	   // process.stdout.write(message)// Log it to the server output too
	}
	this.WyslijAll =function (message) {
		clients_socket.forEach(function (client) {
		  client.write(message.toString());
		});
	   // process.stdout.write(message)// Log it to the server output too
	}
	this.GetWykrytoRuch =function () {
		return wykryto_ruch;
	}
	// Start a TCP Server
	var ServerSocket=net.createServer(function (socket) {

		// Identify this client
		socket.name = socket.remoteAddress + ":" + socket.remotePort 

		// Put this new client in the list
		clients_socket.push(socket);

		// Handle incoming messages from clients.
		socket.on('data', function (data) {
			if(data[0]==1) wykryto_ruch++;
			//console.log("wykryto1 "+wykryto_ruch.toString());
			 socketio.emit('komunikacja_exe',data);//wysyłanie wiadomości na front
		});

		// Remove the client from the list when it leaves
		socket.on('end', function () {
			clients_socket.splice(clients_socket.indexOf(socket), 1);
			//broadcast(socket.name + " left the chat.\n",socket);
		});
		
	}).listen(8085, function(){
	  console.log('komunikacja z programem wykrywaj na porcie:',ServerSocket.address().port);
	});
}

module.exports ={
	AppExe: new CAppExe
}; 