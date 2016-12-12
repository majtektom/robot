#ifndef __DEFINE_H
#define __DEFINE_H
// Iloœæ elementów tablicy
#define ELEMS(p) (sizeof(p)/sizeof(p[0]))

// Makra upraszczaj¹ce dostêp do portów
// *** Port
#define PORT(x) XPORT(x)
#define XPORT(x) (PORT##x)
// *** Pin
#define PIN(x) XPIN(x)
#define XPIN(x) (PIN##x)
// *** DDR
#define DDR(x) XDDR(x)
#define XDDR(x) (DDR##x)


//definicje stalych

//silniki robota
#define M_SLEEP_IO		G//na ktorej lini portu
#define M_SLEEP			PG3	//usypianie driverow
#define M_FS_IO 		C//na ktorej lini portu
#define M_FS 			PC2//diagnostyczne do silnikow
//pierwszy silnik
#define M_M1_IN1_IO		A
#define M_M1_IN1		PA3//KIERUNEK OBROTOW 1 SILNIKA
#define M_M1_IN2_IO		A
#define M_M1_IN2		PA4//KIERUNEK OBROTOW 1 SILNIKA
#define M_M1_PWM_IO		E
#define M_M1_PWM		PE3//pwm 1 SILNIKA w³aczenie/wy³aczenie
#define M_M1_SENS_IO	F
#define M_M1_SENS 		PF1//pobierany prad przez silnik
//drugi silnik
#define M_M2_IN1_IO		A
#define M_M2_IN1		PA5//KIERUNEK OBROTOW 2 SILNIKA
#define M_M2_IN2_IO		A
#define M_M2_IN2		PA6//KIERUNEK OBROTOW 2 SILNIKA
#define M_M2_PWM_IO		E
#define M_M2_PWM 		PE4//pwm 2 SILNIKA w³aczenie/wy³aczenie
#define M_M2_SENS_IO	F
#define M_M2_SENS 		PF3//pobierany prad przez silnik

//klucze tranzystorowe 1 to przewodzi
#define KEY1_IO			D
#define KEY1 			PD4//1 klucz
#define KEY2_IO			D
#define KEY2 			PD5//2 klucz

//diody led
#define LED1_IO			D
#define LED1 			PD7//1 dioda led
#define LED2_IO			D
#define LED2 			PD6//2 dioda led
#define LED3_Z_IO		E
#define LED3_Z			PE2//3 dioda led na zasialczu
#define LED4_Z_IO		E
#define LED4_Z			PE6//4 dioda led na zasialczu

// napiecie na baterii
#define V_BAT_IO		F
#define V_BAT			PF7//napiecie na baterii

// napiecie na baterii
#define PRAD_SERW_IO	F
#define PRAD_SERW		PF6//prad pobierany przez serwa

//zlacze mobot rcrv2
#define RC_TX_IO		E
#define RC_TX 			PE1//tx
#define RC_RX_IO		E
#define RC_RX			PE0//rx

//sonar
#define SONAR_RESET_IO		G
#define SONAR_RESET			PG0//reset sonaru
#define SONAR_I2C_SDA_IO	D
#define SONAR_I2C_SDA		PD1//transmisja SDA(dane) I2C
#define SONAR_I2C_SCL_IO	D
#define SONAR_I2C_SCL		PD0//transmisja SCL(zegar) I2C
#define SONAR_END_P_IO		E
#define SONAR_END_P			PE7//przerwanie ze koniec pomiaru

//czyjniki odleglosci SHARP
#define SHARP1_IO		F
#define SHARP1 			PF6//analogowy sygnal ze czujnika odleglosci
#define SHARP2_IO		F
#define SHARP2 			PF7//analogowy sygnal z czyjnika odleglosci

enum ALERTY{	AL_OK=0,AL_PRAD_SILNIKOW,AL_NAPIECIE	};
struct TELEMETRIA
{
	unsigned int prad_silnika1;
	unsigned int prad_silnika2;
	unsigned int prad_serw;
	unsigned int napiecie;
	//predkosc robota
	int predkosc;
	//obrot robota
	int obroty;
	//do odmierzania odcinków czasu
	unsigned int g_time_tmp1;
	unsigned int g_time_tmp2;
	//flaga alarmów 
	//AL_OK - wszystko ok   AL_PRAD_SILNIKOW- za duzy prad na silnikach 
	int alarm;
	//prog alarmu pradu jak wynosi 0 to blokada jest wy³¹czona
	unsigned int prog_alarmu_pradu;
	//ile czasu ma czekaæ zanim wy³¹czy silniki jak wykryje alarm pradu 
	unsigned int time_prad;
	

}g_info;


#endif //__DEFINE_H


