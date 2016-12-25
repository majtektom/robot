const i2c = require('i2c');


function Atmega_info()
{
	this.pradlewy = 0;
	this.pradprawy = 0;
	this.napiecie =0;
	this.pradserw =0;
	this.info=0;
	return this
}


function CAtmega()
{
	var _this = this;
	const address = 0x10;//adres atmegi na lini i2c
	var _atmega = new i2c(address, {device: '/dev/i2c-1'}); 
	var atmega_info =new Atmega_info();
	
	this.UpdateInfo = function () {
		 //prad silników
		_atmega.readBytes(0x11, 6, function(err, res) {
			//console.log(err+' prad: '+res);
			atmega_info.pradlewy= Number(res[1]) | Number(res[2])<<8;
			//pradlewy= pradlewy*(375*(247/1024))/10000;
			atmega_info.pradprawy=Number(res[3]) | Number(res[4])<<8;
			//pradprawy=pradprawy*(375*(247/1024))/10000;
		});
		//napiecie
		_atmega.readBytes(0x12, 4, function(err, res) {
			//console.log(err+' napiecie: '+Number(res[0])+' '+Number(res[1])+' '+Number(res[2])+' '+Number(res[3])+' '+Number(res[4]));
			atmega_info.napiecie=Number(res[1]) | Number(res[2])<<8;
			//napiecie=(napiecie*(247/1024)/10);//popraw
		});
		//prad serw
		_atmega.readBytes(0x13, 4, function(err, res) {
			atmega_info.pradserw=Number(res[1]) | Number(res[2])<<8;	
			//console.log(pradserw+ " "+ res[1] +" "+res[2]);
		});
		//info o systemie
		_atmega.readBytes(0x22, 3, function(err, res) {
			atmega_info.info=Number(res[1]);	
		});
		
	}
	
	this.Write = function (tab) {
		_atmega.write(tab, function(err) {});
	}
	this.GetInfo = function () {
		return atmega_info
	}
}

module.exports ={
	atmega: new CAtmega
}; 
