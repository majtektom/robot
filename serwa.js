var SerialPort = require("serialport");

function Serwa_info()
{
	this.barkLP=1740*4
	this.barkGD=850*4;
	this.lokiec=950*4;
	this.nadgarstek=1680*4;
	this.szczeki=900*4; 
	this.StopSerwa=0;
	return this
}

function CSerwa(){
	var port = new SerialPort("/dev/ttyAMA0", {
	  baudRate: 115200
	}); 
	
	var serwa_info =new Serwa_info();	
	
	this.GetInfo =  () =>{
		return serwa_info
	}
	this.IsEnable =  () =>{
		return serwa_info.StopSerwa
	}
	//uart
	port.on('open', ()=> {
	  // port.write("test", function(err) {
	   console.log("open uart\n");

	  var data1= new Uint8Array(6);
		//spowalniamy serwa z zadaną prędkością będzie dążyć do zadanego położenia
		//0x7F, nr serwa,bajt/2 danych, bajt/2 danych
		data1[0]=135;	data1[1]=0;		
		data1[2]=20; 	data1[3]=0;  	
		port.write(data1);
						data1[1]=1;		
		//data1[2]=0; 	 	
		port.write(data1);
						data1[1]=2;		
		//data1[2]=0; 	 	
		port.write(data1);
						data1[1]=3;		
		//data1[2]=0; 	 	
		port.write(data1);
						data1[1]=4;		
		//data1[2]=0; 	 	
		port.write(data1);
	});

	port.on('error', (err) =>{
	  console.log('Error uart: ', err.message);
	})

	port.on('data', (data) =>{
	  //console.log(' data uart: ', data);
	})
	
	this.Write =  (data) =>{
		var tab= data.split(";")
		var data= new Uint8Array(13);
		if(tab[3]!=0 & tab[4]!=0 & tab[5]!=0 & tab[6]!=0 & tab[7]!=0 ){
			serwa_info.barkLP=		tab[3];
			serwa_info.barkGD=		tab[4];
			serwa_info.lokiec=		tab[5];
			serwa_info.nadgarstek=	tab[6];
			serwa_info.szczeki=		tab[7];
			serwa_info.StopSerwa=1;
		}else serwa_info.StopSerwa=0;
		//0x9F, ile serw, nr serwa,bajt1 danych, bajt2 danych
		data[0]=tab[0];		data[1]=tab[1];		data[2]=tab[2]; 
		data[3]=tab[3]&0x7F;  data[4]=(tab[3]>>7)&0x7F;
		data[5]=tab[4]&0x7F;  data[6]=(tab[4]>>7)&0x7F;
		data[7]=tab[5]&0x7F;  data[8]=(tab[5]>>7)&0x7F;;
		data[9]=tab[6]&0x7F;  data[10]=(tab[6]>>7)&0x7F;
		data[11]=tab[7]&0x7F; data[12]=(tab[7]>>7)&0x7F;
		//console.log('serwa: '+data);
		port.write(data);
	}
	
}

module.exports ={
	serwa: new CSerwa
}; 