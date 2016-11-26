//var W1Temp1 = require('w1temp');
var Thermometer = require('therm-ds18b20');

// turn on gpio pin 13 as W1 power if you want to 
//W1Temp.setGpioPower(13);
 
// set gpio pin 6 to use as W1 data channel 
// if is not set by instructions above (required root permissions) 
//W1Temp.setGpioData(7);
 
// print list of available sensors uids (ex.: [ '28-00000636a3e3' ]) 
//W1Temp1.getSensorsUids().then(function (sensorsUids) {
//  console.log(sensorsUids);
//});
t1=0;
t2=0;
// get instance of temperature sensor 
//W1Temp1.getSensor('28-0000049b5ab1').then(function (sensor) {
//  t1 = sensor.getTemperature();
//  console.log('Actual temp1:', t1, '°C');
//  sensor.on('change', function (temp) {
//	t1=temp;  
//    console.log('Temp changed1:', t1, '°C');
//  });
//});

//W1Temp1.getSensor('28-000004c42e79').then(function (sensor) {
//  t2 = sensor.getTemperature();
//  console.log('Actual temp2:', t2, '°C');
//  sensor.on('change', function (temp) {
//	t2=temp;  
//	console.log('Temp changed2:', t2, '°C');
// });
//});
//W1Temp1.getSensor('28-0000049b5ab1').then(function (sensor){
// sensor2=sensor;
//});

//W1Temp1.getSensor('28-000004c42e79').then(function (sensor){
// sensor1=sensor;
//});
// Example 2 - Get data on demand
var therm2 = new Thermometer({
    id: '28-0000049b5ab1', 
   interval:1000
}).on('data', function(data) {
    if(data) {
	t1=data.C;
	//console.log(t1);
    }
}).run();



var therm1 = new Thermometer({
    id: '28-000004c42e79',
   interval:1000
}).on('data', function(data) {
    if(data) {
        t2=data.C;
       // console.log(data);
    }
}).run();


module.exports = 
{
	GetTempe1: function (){
		return t1;
	},
	GetTempe2: function (){
		return t2;
	}
};
//sensor1.on('change', function (temp) {
//   console.log('Temp changed1:', temp, '°C');
//  });

//sensor2.on('change', function (temp) {
//    console.log('Temp changed2:', temp, '°C');
//  });


//app.get('/', function(req, res){
//  res.send('<h1>Hello world</h1>');
//});
