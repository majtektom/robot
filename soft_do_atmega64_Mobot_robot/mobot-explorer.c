/*******************************************************************************
tomtom
*******************************************************************************/
#include "define.h"
#include "Main.h"
#include "Sharp.h"
#include "TWI_Slave.h"

// Sample TWI transmission commands
#define I2C_adress 0x10

// prêdkoœæ transmisji w UART
#define UART_BAUD_RATE1      921600
#define UART_BAUD_RATE      9600//921600

/***********************************************************************************/
int main(void)
{
	DDRD|=1<<LED1;//wyjscie
	DDRD|=1<<LED2;//wyjscie
	DDRE|=1<<LED3_Z;
	DDRE|=1<<LED4_Z;
    
	uart1_init(UART_BAUD_SELECT(UART_BAUD_RATE1,F_CPU));
	uart_init(UART_BAUD_SELECT(UART_BAUD_RATE,F_CPU));
    TIMER_init();
    MOTOR_init();
    ADCInit();
	ADCStartConversion(M_M2_SENS);//prad 2 silnika
	ADCStartConversion(M_M1_SENS);//prad 1 silnika
	ADCStartConversion(V_BAT);//napiecie baterii
	//ADCStartConversion(PF6);//sonar analogowe wyjscie
    
   I2C_Slave_init(I2C_adress);
    

	
    //STEP_init();
    
    sei();	//globalne wlaczenie przerwan
	
//	UART0_print("UART0 test\r\n");
	//UART1_print("UART1 test\r\n");
	
	PORTD|=1<<LED1;//on
	PORTD&=~(1<<LED2);//off

    unsigned int ii=0;
	unsigned int pp1;
	unsigned int pp2;
	for(;;) 
	{ 
		if(I2C_BUF_status.st_ready){//mamy dane do odczytania
			//przetwarzamy
			int ile=I2C_BUF_status.counter;
			for(int i=0;i<ile;i++){
			  switch(I2C_Buf[i]){
				case 0x10://predkoœci silników	po nim s¹ 2 bajty prêdkoœci lewego i prawego silnika
					i++;
					unsigned int flagi=I2C_Buf[i];
					i++;
					int predkosc=I2C_Buf[i];//lewego
					i++;
					int obroty=I2C_Buf[i];//prawego
					if(flagi & 0x01) predkosc=-predkosc;
					if(flagi & 0x02) obroty=-obroty;
					MOTOR_drive(predkosc+obroty,predkosc-obroty);
					//I2C_Buf[0]=45;I2C_Buf[1]=46;I2C_Buf[2]=43;I2C_Buf[3]=47;I2C_Buf[4]=42;
					break;
				case 0x11://¿adanie podania pr¹dów silników
					//I2C_Buf[0] pomijamy bo biblioteka na rasberypi wysy³a 1 bajt w czasie odczytu danych i nadpisuje nam pierwszy bajt
					//uint_global_prad_M4 = 0.6745*(pomiar >> 4);//wyliczenie sredniej, przesuniecie w prawo o 4 bity jest rownowazne dzieleniu przez 16
					pp1=ADCGetPomiar(M_M1_SENS);
					pp2=ADCGetPomiar(M_M2_SENS);
					I2C_Buf[1]=pp1;
					I2C_Buf[2]=pp1>>8;
					I2C_Buf[3]=pp2;
					I2C_Buf[4]=pp2>>8;
					break;
				case 0x12://¿adanie podania napiêcia
					//I2C_Buf[0] pomijamy bo biblioteka na rasberypi wysy³a 1 bajt w czasie odczytu danych i nadpisuje nam pierwszy bajt
					pp1=ADCGetPomiar(V_BAT);
					I2C_Buf[1]=pp1;
					I2C_Buf[2]=pp1>>8;
					break;
				default:
					break;
			  }
			}
			I2C_BUFEmpty();//resetujemy bufor i zezwalamy na nastêpny odbiór/zapis danych
		}
		
		ii++;
        if((ii%80000)==0){
			 PORTD^=1<<LED1;//migaj dioda jak odbiera;
		}
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