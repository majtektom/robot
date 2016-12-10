var socket = io();
var socket = io.connect("http://"+location.hostname+":8080");
var time1=0;
var time2=0;

socket.on('restart', function(msg){
		$('#ping').text(msg);
	}); 
socket.on('temperatura1', function(msg){
		$('#pTemp1').text("Wewnątrz: "+ msg + "°C");
	});
socket.on('temperatura2', function(msg){
		$("#pTemp2").text("Zewnątrz: "+ msg + "°C");
		var d = new Date();
		time2 = d.getTime();
		$("#ping").text("Ping "+(time2-time1)+"ms");
	});
socket.on('napiecie_i_prady', function(msg){
		var tab= msg.split(";");
		$("#silniki_prady").text("Silnik lewy: "+tab[0]+"A Silnik prawy: "+ tab[1]+"A");
		$("#napiecie").text(tab[2]+"V");

	});
socket.on('silniki', function(msg){
		var wynik = $('#silniki_test');
		var tab= wynik.text().split(";");
		wynik.text(tab[0]+'; '+msg);
	});
socket.on('serwa', function(msg){
		$("#test").text(msg);
		var tab= msg.split(";");
		if(tab[3]!=0 & tab[4]!=0 & tab[5]!=0 & tab[6]!=0 & tab[7]!=0 ){
				$('#barkLP').val(tab[3]/4);
				$('#barkGD').val(tab[4]/4); 
				$('#lokiec').val(tab[5]/4); 
				$('#nadgarstek').val(tab[6]/4); 
				$('#szczeki').val(tab[7]/4); 
		}
		
	});
socket.on('wykryto_ruch', function(msg){
		var wynik = $('#wykryto_ruch');
		wynik.text(msg+" razy wyktyto ruch");
	});
 //wywoływana cyklicznie
function updateUI() {
		socket.emit('gettemperature', 't1,t2');
		socket.emit('getprady', 'A;A;V');
		socket.emit('wykryto_ruch', '');
		var d = new Date();
		time1 = d.getTime();
}

//$(document).ready(function(){
$(function(){
	setInterval(updateUI,2000);
	$("#streamimage").attr("src","http://"+location.hostname+":8090/?action=stream");

	$('#barkLP,#barkGD,#lokiec,#nadgarstek,#szczeki').change( function() { 	
		var data= new Int16Array(8);
		//0x9F, ile serw, nr serwa,bajt1 danych, bajt2 danych
		data[0]=159;	data[1]=5; data[2]=0; 
		data[3]=$('#barkLP').val()*4;
		data[4]=$('#barkGD').val()*4; 
		data[5]=$('#lokiec').val()*4; 
		data[6]=$('#nadgarstek').val()*4; 
		data[7]=$('#szczeki').val()*4; 
		var tt=data.join(";");
		socket.emit('serwa', tt);
	});
		
	$("#stopserwa").click(function(){
		var data= new Int16Array(8);
		data[0]=159;	data[1]=5; data[2]=0; 
		data[3]=0;		data[4]=0;	data[5]=0;
		data[6]=0;		data[7]=0;  
		var tt=data.join(";");
		socket.emit('serwa', tt);
	});

	$("#zaparkuj_serwa").click(function(){
		var data= new Int16Array(8);
		data[0]=159;	data[1]=5; 		data[2]=0; 
		data[3]=1740*4;	data[4]=850*4;	data[5]=950*4;
		data[6]=1680*4;	data[7]=900*4;  
		var tt=data.join(";");
		socket.emit('serwa', tt);
		$('#barkLP').val(1740);
		$('#barkGD').val(850); 
		$('#lokiec').val(950); 
		$('#nadgarstek').val(1681); 
		$('#szczeki').val(900); 
	});


	$("#stopsilniki").click(function(){
		var data= new Int16Array(4);
		data[0]=0x10;	data[1]=0; data[2]=0;data[3]=0;
		var tt=data.join(";");
		socket.emit('silniki', tt); 
	});
	

	$("#restart").click(function(){
		var data= new Int16Array(2);
		data[0]=0x20;	data[1]=0;;
		var tt=data.join(";");
		//webiopi().callMacro("restart",tt,updatePing);
		socket.emit('restart', tt); 
	});

	
});