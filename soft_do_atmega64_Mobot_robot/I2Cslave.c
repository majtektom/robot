/*
 * I2Cslave.c
 *
 * Created: 2014-08-19 14:33:11
 *  Author: tmf
 */ 


#include <avr\io.h>
#include <stdlib.h>
#include <util\twi.h>
#include <avr\interrupt.h>
#include "KS0108.h"
#include "graphics.h"
#include "LM35.h"

#define DEVADDR      190
#define BUFSIZE      20
#define ST_READY     1
#define ST_RECEIVING 2

char Buf[BUFSIZE];	//Bufor na odebran¹ ramkê
volatile struct Buf_status BUF_status;

struct Buf_status
{
	union
	{
		struct
		{
			uint8_t st_ready         : 1;
			uint8_t st_receiving     : 1;
			uint8_t st_transmitting  : 1;
			uint8_t counter          : 5;
		};
		uint8_t byte;
	};
};

typedef union
{
	uint16_t word;
	uint8_t byte[2];
} WORD;

void BUFEmpty()
{
	BUF_status.byte=0;
	TWCR|=_BV(TWEA);
}

ISR(TWI_vect)
{
	uint8_t status=TW_STATUS;
	switch(status)
	{
		//Obs³uga slave receive
		case TW_SR_SLA_ACK:	BUF_status.counter=0; BUF_status.st_receiving=1; break;	//Rozpoczêto transmisjê
		case TW_SR_STOP:		if(BUF_status.st_receiving)
		{
			BUF_status.st_ready=1;
			BUF_status.st_receiving=0;
			TWCR&=(~_BV(TWEA)); //Nie generuj ACK
		} else
		{
			TWCR|=_BV(TWEA);
			BUF_status.counter=0; BUF_status.st_receiving=1;
		}
		break;	//Zakoñczono odbiór ramki
		case TW_SR_GCALL_DATA_ACK:
		case TW_SR_GCALL_ACK: break;
		case TW_SR_DATA_ACK:  Buf[BUF_status.counter++]=TWDR;	break; //Odebrano bajt danych
		case TW_SR_DATA_NACK: Buf[BUF_status.counter++]=TWDR;
		BUF_status.st_ready=1;
		BUF_status.st_receiving=0;
		TWCR&=(~_BV(TWEA)); //Nie generuj ACKbreak
		break;
		//Obs³uga slave transmit
		case TW_ST_SLA_ACK:   BUF_status.counter=0; BUF_status.st_transmitting=1;
		case TW_ST_DATA_ACK:	TWDR=((WORD)GetTemperature()).byte[BUF_status.counter++]; break;
		case TW_ST_DATA_NACK: BUF_status.st_transmitting=0; break;
		case TW_ST_LAST_DATA: break;
		default:              TWCR=_BV(TWEN) | _BV(TWEA) | _BV(TWIE) | _BV(TWINT);
		BUF_status.byte=0;
	}
	if(BUF_status.counter>=BUFSIZE) BUF_status.counter=0;	//Zapobiega przepe³nieniu bufora
	TWCR|=_BV(TWINT);	//Zwolnij liniê SCL
}

void I2C_Slave_Init()
{
	TWAR=DEVADDR;
	TWAMR=0;
	TWCR=_BV(TWEN) | _BV(TWEA) | _BV(TWIE) | _BV(TWINT);	//Odblokuj TWI, przerwanie TWI i automatyczne generowanie ACK
}

int main()
{
	ADC_init();
	GLCD_init();
	GLCD_cls();
	I2C_Slave_Init();
	sei();
	while(1)
	{
		if(BUF_status.st_ready)
		{
			switch(Buf[0])
			{
				case 'c':	GLCD_cls(); break;
				case 'l':	GLCD_Line(Buf[1], Buf[2], Buf[3], Buf[4]); break;
				case 'g':	GLCD_goto(Buf[1], Buf[2]);
				case 't':	GLCD_puttext(&Buf[1]);
			}
			BUFEmpty();
		}
	}
}
