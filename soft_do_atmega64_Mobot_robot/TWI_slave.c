#include <util/twi.h>
#include <avr/interrupt.h>

#include "TWI_slave.h"



void I2C_Slave_init(uint8_t address)
{
	cli();
	// load address into TWI address register
	TWAR = address << 1;
	// set the TWCR to enable address matching and enable TWI, clear TWINT, enable TWI interrupt
	TWCR = (1<<TWIE) | (1<<TWEA) | (1<<TWINT) | (1<<TWEN);
	sei();
}

ISR(TWI_vect)
{
	switch(TW_STATUS)
	{
	//Obs³uga slave receive
	case TW_SR_SLA_ACK://Rozpoczêto transmisjê- odbieramy dane
		I2C_BUF_status.counter=0; 
		I2C_BUF_status.st_receiving=1; 
		break;	
	case TW_SR_STOP:
		if(I2C_BUF_status.st_receiving)//gdy odbieramy dane
		{
			I2C_BUF_status.st_ready=1;//to koniec transmisji dane gotowe
			I2C_BUF_status.st_receiving=0;
			TWCR&=(~(1<<TWEA)); //Nie generuj ACK
		} else	{
			TWCR|=(1<<TWEA);
			I2C_BUF_status.counter=0;
			I2C_BUF_status.st_receiving=1;//to nastêpna porcja danych (repeated START)
		}
		break;	//Zakoñczono odbiór ramki
	case TW_SR_GCALL_DATA_ACK://nieobs³ugujê tych ramek (adresy rozg³oszeniowe)
	case TW_SR_GCALL_ACK: 
		break;
	case TW_SR_DATA_ACK://Odebrano bajt danych  
		I2C_Buf[I2C_BUF_status.counter++]=TWDR;	
		break; 
	case TW_SR_DATA_NACK: 
		I2C_Buf[I2C_BUF_status.counter++]=TWDR;
		I2C_BUF_status.st_ready=1;//odebrano ostatni¹ paczkê danych- dane gotowe
		I2C_BUF_status.st_receiving=0;
		TWCR&=(~(1<<TWEA)); //Nie generuj ACKbreak
	break;
	//Obs³uga slave transmit
	case TW_ST_SLA_ACK:  
		I2C_BUF_status.counter=0;
		I2C_BUF_status.st_transmitting=1;
	case TW_ST_DATA_ACK:	
		TWDR=I2C_Buf[I2C_BUF_status.counter++];
		break;
	case TW_ST_DATA_NACK:
		I2C_BUF_status.st_transmitting=0;
		break;
	case TW_ST_LAST_DATA:
		break;
	default:
		TWCR=(1<<TWEN) | (1<<TWEA) | (1<<TWIE) | (1<<TWINT);
		I2C_BUF_status.byte=0;
	}
	if(I2C_BUF_status.counter>=I2C_BUFSIZE) I2C_BUF_status.counter=0;	//Zapobiega przepe³nieniu bufora
	TWCR|=(1<<TWINT);	//Zwolnij liniê SCL
}