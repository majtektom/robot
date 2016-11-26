#ifndef I2C_SLAVE_H
#define I2C_SLAVE_H

#include <avr/interrupt.h>
#include <stdint.h>


#define I2C_BUFSIZE      20		//31 max
#define I2C_ST_READY     1
#define I2C_ST_RECEIVING 2

char I2C_Buf[I2C_BUFSIZE];	//Bufor na odebran� ramk�
volatile struct I2C_Buf_status I2C_BUF_status;

struct I2C_Buf_status
{
	union
	{
		struct
		{
			uint8_t st_ready         : 1; //1 - dane gotowe do przetworzenia
			uint8_t st_receiving     : 1; //1 - trwa odbi�r danych
			uint8_t st_transmitting  : 1; //1 - trwa nadawanie danych
			uint8_t counter          : 5; //numer aktualnie nadawanego lub odieranego bajta (jest 5 bitowy wi� maxymalnie mo�emy zaadresowa� 31 bajt�w)
		};
		uint8_t byte;
	};
};

typedef union
{
	uint16_t word;
	uint8_t byte[2];
} WORD;

//czy�cimy bufor i zezwalamy na nast�pn� transmisj�
inline void I2C_BUFEmpty()
{
	I2C_BUF_status.byte=0;
	TWCR|=(1<<TWEA);
}
void I2C_Slave_init(uint8_t address);

ISR(TWI_vect);

#endif