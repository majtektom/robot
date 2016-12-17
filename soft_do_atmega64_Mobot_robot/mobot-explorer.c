/*******************************************************************************
tomtom
*******************************************************************************/
#include<avr/wdt.h>
#include "define.h"
#include "Main.h"
#include "Sharp.h"
#include "TWI_Slave.h"

// Sample TWI transmission commands
#define I2C_adress 0x10

// pr�dko�� transmisji w UART
#define UART_BAUD_RATE1      921600
#define UART_BAUD_RATE      9600//921600

/***********************************************************************************/
int main(void)
{
	DDRD|=1<<LED1;//wyjscie
	DDRD|=1<<LED2;//wyjscie
	DDRE|=1<<LED3_Z;
	DDRE|=1<<LED4_Z;
    g_info.prog_alarmu_pradu=110;
	g_info.time_prad=1200;
	uart1_init(UART_BAUD_SELECT(UART_BAUD_RATE1,F_CPU));
	uart_init(UART_BAUD_SELECT(UART_BAUD_RATE,F_CPU));
    TIMER_init();
    MOTOR_init();
    ADCInit();
	ADCStartConversion(M_M2_SENS);//prad 2 silnika
	ADCStartConversion(M_M1_SENS);//prad 1 silnika
	ADCStartConversion(V_BAT);//napiecie baterii
	ADCStartConversion(PRAD_SERW);//prad serw
	ADCSetIloscPomiarow(8,PRAD_SERW);
	//ADCStartConversion(PF6);//sonar analogowe wyjscie
    
   I2C_Slave_init(I2C_adress);

    sei();	//globalne wlaczenie przerwan
	
	PORTD|=1<<LED1;//on
	PORTD&=~(1<<LED2);//off
	wdt_enable(WDTO_120MS );
    unsigned int ii=0;

	for(;;) 
	{ 
		wdt_reset(); 
		g_info.prad_serw=ADCGetPomiar(PRAD_SERW);
		g_info.napiecie=ADCGetPomiar(V_BAT);
		g_info.prad_silnika1=ADCGetPomiar(M_M1_SENS);
		g_info.prad_silnika2=ADCGetPomiar(M_M2_SENS);
		if(I2C_BUF_status.st_ready){//mamy dane do odczytania
			//przetwarzamy
			int ile=I2C_BUF_status.counter;
			for(int i=0;i<ile;i++){
			  switch(I2C_Buf[i]){
				case 0x10://predkości silników	po nim są 2 bajty prędkoćci lewego i prawego silnika
					i++;
					unsigned int flagi=I2C_Buf[i];
					i++;
					if(g_info.alarm==AL_OK)	g_info.predkosc=I2C_Buf[i];//lewego
					i++;
					if(g_info.alarm==AL_OK) g_info.obroty=I2C_Buf[i];//prawego
					if(flagi & 0x01) g_info.predkosc=-g_info.predkosc;
					if(flagi & 0x02) g_info.obroty=-g_info.obroty;
					g_info.time_lost=g_TIMER_ms;
					//I2C_Buf[0]=45;I2C_Buf[1]=46;I2C_Buf[2]=43;I2C_Buf[3]=47;I2C_Buf[4]=42;
					break;
				case 0x11://Żadanie podania prądów silników
					//I2C_Buf[0] pomijamy bo biblioteka na rasberypi wysyła 1 bajt w czasie odczytu danych i nadpisuje nam pierwszy bajt
					//uint_global_prad_M4 = 0.6745*(pomiar >> 4);//wyliczenie sredniej, przesuniecie w prawo o 4 bity jest rownowazne dzieleniu przez 16
					I2C_Buf[1]=g_info.prad_silnika1;
					I2C_Buf[2]=g_info.prad_silnika1>>8;
					I2C_Buf[3]=g_info.prad_silnika2;
					I2C_Buf[4]=g_info.prad_silnika2>>8;
					break;
				case 0x12://Żadanie podania napięcia
					//I2C_Buf[0] pomijamy bo biblioteka na rasberypi wysyła 1 bajt w czasie odczytu danych i nadpisuje nam pierwszy bajt
					I2C_Buf[1]=g_info.napiecie;
					I2C_Buf[2]=g_info.napiecie>>8;
					break;
				case 0x13://Żadanie podania pradu serw
					//I2C_Buf[0] pomijamy bo biblioteka na rasberypi wysyła 1 bajt w czasie odczytu danych i nadpisuje nam pierwszy bajt
					I2C_Buf[1]=g_info.prad_serw;
					I2C_Buf[2]=g_info.prad_serw>>8;
					break;
				case 0x20://Żadanie ustawienia progu alarmu pradowego nastepna dana to prog
					i++;
					g_info.prog_alarmu_pradu=I2C_Buf[i];
					break;
				case 0x21://Żadanie ustawienia progu alarmu pradowego nastepna dana to prog. 2 bajty
					i++;
					g_info.time_prad=I2C_Buf[i] | I2C_Buf[i+1]<<8;
					i++;
					break;
				case 0x22://info o stanie systemu
					I2C_Buf[1]=g_info.alarm;
					break;
				default:
					break;
			  }
			}
			I2C_BUFEmpty();//resetujemy bufor i zezwalamy na następny odbiór/zapis danych
		}

		if((g_info.prad_silnika1>g_info.prog_alarmu_pradu || g_info.prad_silnika2>g_info.prog_alarmu_pradu)&&
			g_info.alarm==AL_OK && g_info.prog_alarmu_pradu!=0){
			   g_info.alarm=AL_PRAD_SILNIKOW;
			   g_info.g_time_tmp1=g_TIMER_ms+g_info.time_prad;
			   if(g_info.predkosc>0)g_info.predkosc=-128;
			   if(g_info.predkosc<0)g_info.predkosc=128;
			   g_info.obroty=0;//-g_info.obroty;
		   }

		if(g_info.alarm==AL_PRAD_SILNIKOW){
			if(g_TIMER_ms>g_info.g_time_tmp1){
				g_info.predkosc=0;
				g_info.obroty=0;
				g_info.alarm=AL_OK;
			}
		}
		//gdy przez 1 sekundę nie ma nowych danych o predkości wyłacz silniki
		if(g_TIMER_ms>(g_info.time_lost+1000)){
			g_info.predkosc=0;
			g_info.obroty=0;
		}
		 
		if( g_info.napiecie<430){//9.5V
			g_info.alarm=AL_NAPIECIE;
			g_info.predkosc=0;
			g_info.obroty=0;
		}else{
			if(g_info.alarm==AL_NAPIECIE) g_info.alarm=AL_OK;
		}
		MOTOR_drive(g_info.predkosc+g_info.obroty,g_info.predkosc-g_info.obroty);

		//ii++;
        //if((ii%40000)==0){
		//	 PORTD^=1<<LED1;
		//}
   }
    
return 0;
}

/*
unsigned char TWI_Act_On_Failure_In_Last_Transmission ( unsigned char TWIerrorMsg )
{
	// A failure has occurred, use TWIerrorMsg to determine the nature of the failure
	// and take appropriate actions.
	// Se header file for a list of possible failures messages.
	
	// This very simple example puts the error code on PORTB and restarts the transceiver with
	// all the same data in the transmission buffers.
	/////PORTB = TWIerrorMsg;
	TWI_Start_Transceiver();
	
	return TWIerrorMsg;
}*/