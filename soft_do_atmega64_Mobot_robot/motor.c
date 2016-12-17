#include<avr/io.h>
#include "motor.h"
#include "define.h"
/*******************************************************************************
Funkcja:
	void MOTOR_init(void)
Opis:
	Inicjalizacja timera 3 do generowania sygnalu PWM (Pulse Width Modulation)
*******************************************************************************/
void MOTOR_init(void)
{
	//inicjacja portow
	DDR(M_M1_IN1_IO) |= (1<<M_M1_IN1)|(1<<M_M1_IN2)|(1<<M_M2_IN1)|(1<<M_M2_IN2); //jako wyjscia
	DDR(M_M1_PWM_IO) |= (1<<M_M1_PWM)|(1<<M_M2_PWM); //piny od PWMa jako wyjscia

	DDR(M_SLEEP_IO)  |= (1<<M_SLEEP); //jako wyjscie
	PORT(M_SLEEP_IO) &= ~(1<<M_SLEEP); //uspienie silnikow	
	DDR(M_FS_IO)     &= ~(1<<M_FS);  //pin od FS jako wejscie	

	//inicjacja timera
  	TCCR3A |= (1<<COM3A1)|(1<<COM3B1)|(1<<COM3A0)|(1<<COM3B0)|(1<<WGM30);   
    TCCR3B |= (1<<CS31); //8bit Phase Correct PWM inverting mode dla silników kó³
						//preskaler przez 8 co da czêstotliwoœæ ok 4kHz

  	PORT(M_SLEEP_IO) &= ~(1<<M_SLEEP); //uspienie silnikow	

}

/*******************************************************************************
Funkcja:
	void MOTOR_drive(signed int left_speed,signed int right_speed)
Argumenty: 
	- signed int left_speed - wspolczynnik wypelnienia dla silnika od lewego 
		kola, mozna zadawac watosci z pzedzialu -255 - 255, kierunek obrotu 
		zalezy od znaku 
	- signed int right_speed - wspolczynnik wypelnienia dla silnika od prawego 
		kola, mozna zadawac watosci z pzedzialu -255 - 255, kierunek obrotu 
		zalezy od znaku 
Opis:
	Funkcja wyprowadza drivery ze stanu uspienia jezeli przynajniej jedna 
predkosc zadana jest rozna od zera (nalezy pamietac, ze sygnal PG3_SLEEP jest 
wspolny z driverem silnika krokowego na plytce MOBOT-EXP MCB). Funkcja zmienia 
kierunek obrotu silnika (kierunki lewo i prawo sa umowne) w zaleznosci od znaku
wartosci zadanej oraz ogranicza wartosc zadana tak aby nie nastepowalo 
przepelnienie.
*******************************************************************************/
void MOTOR_drive(signed int left_speed,signed int right_speed)
{
	if((left_speed != 0) || (right_speed != 0))
		PORT(M_SLEEP_IO) |= (1<<M_SLEEP); //wybudzenie driverow DC ze stanu uspienia
	else{
	//if((left_speed == 0) && (right_speed == 0))
		PORT(M_SLEEP_IO) &= ~(1<<M_SLEEP); //usypianie driverow DC 
	}

	if(left_speed > 0) //obot w prawo
	{
		PORT(M_M1_IN1_IO) |=  (1<<M_M1_IN1);
		PORT(M_M1_IN2_IO) &= ~(1<<M_M1_IN2);
	}
	else if(left_speed < 0) //obrot w lewo
	{
		PORT(M_M1_IN1_IO) &= ~(1<<M_M1_IN1);
		PORT(M_M1_IN2_IO) |= (1<<M_M1_IN2);
	}
	
	if(right_speed > 0) //obrot w prawo
	{
		PORT(M_M2_IN1_IO) |= (1<<M_M2_IN1);
		PORT(M_M2_IN2_IO) &= ~(1<<M_M2_IN2);
	}
	else if(right_speed<0) //obrot w lewo
	{
		PORT(M_M2_IN1_IO) &= ~(1<<M_M2_IN1);
		PORT(M_M2_IN2_IO) |= (1<<M_M2_IN2);
	}

    if(abs(right_speed) >= PWM_MAX) //ograniczenie wartosci maksymalnej
		OCR3A = PWM_MAX;
	else
		OCR3A = (unsigned char)(abs(right_speed));
	             
	  
    if(abs(left_speed) >= PWM_MAX) //ograniczenie wartosci maksymalnej
		OCR3B = PWM_MAX;
	else
		OCR3B = (unsigned char)(abs(left_speed));  
	
}
/*******************************************************************************
Funkcja:
	void MOTOR_break(void)
Opis:
	Realizuje hamowanie przez zwarcie obu wyprowadzen silnikow do masy. Przydatna
da awaryjnego zatrzymania robota.
*******************************************************************************/
void MOTOR_break(void)
{
     MOTOR_drive(255,255);
     PORT(M_M1_IN1_IO) |=  (1<<M_M1_IN1);                     
     PORT(M_M1_IN2_IO) |=  (1<<M_M1_IN2);                     
     PORT(M_M2_IN1_IO) |=  (1<<M_M2_IN1);                     
     PORT(M_M2_IN2_IO) |=  (1<<M_M2_IN2);   
}
/*******************************************************************************
Funkcja:
	void MOTOR_sleep(void)
Opis:
	Funkcja wprowadza drivery silnikow od kol napedowych oraz driver silnika 
krokowego w stan uspienia (wspolne wyprowadzenie PG3_SLEEP), obnizajac pobor 
pradu
*******************************************************************************/
void MOTOR_sleep(void)
{
	PORT(M_SLEEP_IO) &= ~(1<<M_SLEEP); //przejscie driverow DC w stan uspienia	
}

