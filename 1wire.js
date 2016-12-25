//var W1Temp1 = require('w1temp');
var Thermometer = require('therm-ds18b20');


function CTermometr() {
	var _this = this;
	var temperatura1=0;
	var temperatura2=0;
	var therm2 = new Thermometer({
			id: '28-0000049b5ab1', 	interval:1000
			}).on('data', function(data) {
					if(data) {
						_this.temperatura1=data.C;
					}
					}).run();

	var therm1 = new Thermometer({
			id: '28-000004c42e79',	interval:1000
			}).on('data', function(data) {
				if(data) {
				_this.temperatura2=data.C;
				 //console.log(data);
				}
			}).run();
			
	this.GetTempe1 = function() {
		 return _this.temperatura1;
	}

}

CTermometr.prototype.GetTempe2 = function () {
    return this.temperatura2;
}

//var zmienna ="ala ma kota";

//exports.zmienna = zmienna
module.exports ={
	Termometr: new CTermometr//,
	//zmienna: zmienna
}; 

