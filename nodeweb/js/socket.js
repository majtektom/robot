var socket1 = io();
var socket1 = io.connect("http://"+location.hostname+":8080");
var time1=0;
var time2=0;
var info_o_atmedze=0;

socket1.on('restart', function(msg){
		$('#ping').text(msg);
	}); 
socket1.on('temperatura1', function(msg){
		$('#pTemp1').text("Chwytak ramienia: "+ msg + "°C");
	});
socket1.on('temperatura2', function(msg){
		$("#pTemp2").text("Wewnątrz: "+ msg + "°C");
		var d = new Date();
		time2 = d.getTime();
		$("#ping").text("Ping "+(time2-time1)+"ms");
	});
socket1.on('os_info', function(msg){
	var tab= msg.split(";");
	var info=tab[1].split(",");
	info[0]=info[0]*1;info[1]=info[1]*1;info[2]=info[2]*1;
	//$("#os_info2").text(msg);
	$("#os_info1").text("Uptime: "+Math.floor((tab[0]/86400)) +" dni "+Math.floor((tab[0]/3600)%24)+":"+Math.floor((tab[0]/60)%60)+":"+tab[0]%60);
	$("#os_info2").text("Obciążenie: "+info[0].toFixed(3)+" : "+info[1].toFixed(3)+" : "+info[2].toFixed(3));
	$("#os_info3").text("Wolna pamięć: "+(tab[2]/1024/1024).toFixed(2)+"MB" );
	info_o_atmedze=tab[3];
	if(info_o_atmedze>0)
		$("#hitarea").css('background-color', 'red');
	else	
		$("#hitarea").css('background-color', '#0F0');
	$("#os_info0").text("Info z atmegi: "+info_o_atmedze);
});
socket1.on('napiecie_i_prady', function(msg){
		var tab= msg.split(";");
		var rozdzelczosc=2.467/1024.0;
		var U_ref =2.467;
		var ADC_GAIN =10;
		var  MC33887_I_COEF = 0.00266;//1/375
		var poprawka_pradu=0.06;
		tab[0]=(tab[0]*rozdzelczosc*375.0)/100.0+poprawka_pradu;
		tab[1]=(tab[1]*rozdzelczosc*375.0)/100.0+poprawka_pradu;
		if(tab[0]==poprawka_pradu)tab[0]=0.0;
		if(tab[1]==poprawka_pradu)tab[1]=0.0;
		$("#silniki_prady").text("Silnik lewy: "+tab[0].toFixed(3)+"A Silnik prawy: "+ tab[1].toFixed(3)+"A");
		var dzielnik=10.85;//stosunek zbudowanego dzielnika napiecia
		var poprawka=-1.84;//nie wiem dlaczego ale inaczej jest zły wynik a i tak jakoś nie jest liniowo
		tab[2]=dzielnik*(tab[2]*rozdzelczosc)+poprawka;
		$("#napiecie").text(tab[2].toFixed(3)+"V");
		tab[3]=((tab[3]-526)*rozdzelczosc )*30.0;
		if(tab[3]<0)tab[3]=0;
		$("#serwa_prady").text("Serwa prądy:"+tab[3].toFixed(3)+"A");

	});
socket1.on('silniki', function(msg){
		var wynik = $('#silniki_test');
		var tab= wynik.text().split(";");
		wynik.text(tab[0]+'; '+msg);
	});
socket1.on('serwa', function(msg){
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
socket1.on('komunikacja_exe', function(msg){
		$("#komunikacja").text("Z analizy obrazu: "+msg.toString());
});
socket1.on('Init', function(msg){
		var tab= msg.split(";");
		//$("#komunikacja").text(msg);
		$('#barkLP').val(tab[0]/4);
		$('#barkGD').val(tab[1]/4); 
		$('#lokiec').val(tab[2]/4); 
		$('#nadgarstek').val(tab[3]/4); 
		$('#szczeki').val(tab[4]/4); 
		$('#prog_pradu').val(tab[5]);
		$('#opoznienie').val(tab[6]);
		//dane z programu exe
		if(tab[7]==1)//tryb pracy wykrywania obrazu
			$('#nagrywac_exe').attr('checked',true)
		else
			$('#nagrywac_exe').attr('checked',false)
		tab[8];tab[9];tab[10];tab[11];
		
	});

socket1.on('wykryto_ruch', function(msg){
		var wynik = $('#wykryto_ruch');
		wynik.text(msg+" razy wyktyto ruch");
	});
 //wywoływana cyklicznie
function updateUI() {
		socket1.emit('gettemperature', 't1,t2');
		socket1.emit('getprady', 'A;A;V');
		socket1.emit('wykryto_ruch', '');
		socket1.emit('os_info', '');
		var d = new Date();
		time1 = d.getTime();
}

//$(document).ready(function(){
$(function(){
	setInterval(updateUI,200);
	$("#streamimage").attr("src","http://"+location.hostname+":8090/?action=stream");
	//inicjacja zmiennych
	socket1.emit('Init', 0);

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
		socket1.emit('serwa', tt);
	});
		
	$('#prog_pradu,#opoznienie').change( function(){
		var data= new Int16Array(2);
		data[0]=$('#prog_pradu').val();
		data[1]=$('#opoznienie').val();
		var tt=data.join(";");
		socket1.emit('setAlarm', tt); 
		
	});
	
	$('#nagrywac_exe').click(function(){
		if($('#nagrywac_exe').prop('checked')) { 
			socket1.emit('nagrywac_exe', 1);
		} else {
			socket1.emit('nagrywac_exe', 2);
		}
	});
	
	$("#stopserwa").click(function(){
		var data= new Int16Array(8);
		data[0]=159;	data[1]=5; data[2]=0; 
		data[3]=0;		data[4]=0;	data[5]=0;
		data[6]=0;		data[7]=0;  
		var tt=data.join(";");
		socket1.emit('serwa', tt);
	});

	$("#zaparkuj_serwa").click(function(){
		var data= new Int16Array(8);
		data[0]=159;	data[1]=5; 		data[2]=0; 
		data[3]=1740*4;	data[4]=850*4;	data[5]=950*4;
		data[6]=1680*4;	data[7]=900*4;  
		var tt=data.join(";");
		socket1.emit('serwa', tt);
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
		socket1.emit('silniki', tt); 
	});
	

	$("#restart").click(function(){
		var data= new Int16Array(2);
		data[0]=0x20;	data[1]=0;;
		var tt=data.join(";");
		socket1.emit('restart', tt); 
	});
	

	
});