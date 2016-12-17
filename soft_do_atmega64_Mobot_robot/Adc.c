
#include <inttypes.h>
#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>
#include "adc.h"
//#include "define.h"
#define ADC_REF_2_56 ((1<<REFS0)| (1<<REFS1))  //napiecie ref 2.56
#define ADC_REF_5_0  (1<<REFS0)					//napiecie ref 5.0
//ustawia nastepny wlaczony kanal jako aktywny
void adc_next_channel()
{
	unsigned int i;
	for(i=0;i<8;i++)// petla po kanalach jak zaden nie aktywny to sie nie zamieni kanal
	{
		adc_channel+=1;//kanal jeden wyzej
		if(adc_channel>7)//poza dostepnymi kanalami
			adc_channel=POMIAR_0;//ustawiamy 1
		
		//sprawdzamy czy jest wlaczony
		if(bit_is_set(adc_kanal,adc_channel))//jest wiec koniec
			return;
	}
}

//  przerwanie które moze byc przerwane
ISR(ADC_vect,ISR_NOBLOCK)//wywalic przerwania za bardzo spowalnia walnac w petle glowna
{
	uint16_t pomiar=ADC;
	//ADCSRA &= ~(1<<ADEN); //ma na celu upewnienie sie ze nastepny wynik konwersji nie bedzie dotyczyl poprzednigo kanalu ADC
	adc_pomiar[adc_channel]=(adc_pomiar[adc_channel]*adc_dt[adc_channel]+pomiar)/(adc_dt[adc_channel]+1);

	//ustawia nastepny kanal aktywnym
	adc_next_channel();
	switch(adc_channel){
		case POMIAR_0: 		ADMUX = (ADC_REF_2_56& 0xF8)| 0b00000;			break;//masa
		case POMIAR_1:		ADMUX = (ADC_REF_2_56& 0xF8)| 0b00001;			break;//prad silnika// ; 0b01001  adc1"+" adc0"-" x10
		case POMIAR_2:		ADMUX = (ADC_REF_2_56& 0xF8)| 0b00010;			break;//masa
		case POMIAR_3:		ADMUX = (ADC_REF_2_56& 0xF8)| 0b00011;			break;//prad silnika//;  0b01101  adc3"+" adc2"-" x10
		case POMIAR_4: 		ADMUX = (ADC_REF_2_56& 0xF8)| 0b00100;			break;
		case POMIAR_5: 		ADMUX = (ADC_REF_2_56& 0xF8)| 0b00101;			break;
		case POMIAR_6: 		ADMUX = (ADC_REF_2_56& 0xF8)| 0b00110;			break;//prad serw   czujnik ACS712T 30a  
		case POMIAR_7: 		ADMUX = (ADC_REF_2_56& 0xF8)| 0b00111;			break;//napiêcie zasilania
		}
		//ADCSRA |= (1<<ADEN);//w³aczamy przetwornik
		ADCSRA|=(1<<ADSC);//start konwersji
}

void ADCInit()
{
	DDRF = 0x00; //caly port jako wejscie (konieczne gdy uzywamy ADC
	PORTF =0x00;
	adc_kanal=0x00;//zaden kana³ nie aktywny
	adc_channel=0x00;
	adc_dt[0]=adc_dt[1]=adc_dt[2]=adc_dt[3]=adc_dt[4]=adc_dt[5]=adc_dt[6]=adc_dt[7]=4;
	ADMUX=ADC_REF_2_56;    
	//preskaler 128 - 125kHz@16MHz, wlaczone przerwania
	ADCSRA|=(1<<ADIE)|(1<<ADPS2)|(1<<ADPS1)|(1<<ADPS0)|(1<<ADATE);//(1<<ADFR)|

	ADCSRB=0x02;
	//ADCSRB=0;//Free Running mode
}

//ilosc pomiarów w czasie jednego pomiaru (potegi 2)(wylicza sredni¹ i zwraca wynik)
void ADCSetIloscPomiarow(unsigned char ile,unsigned char ktory)
{
	adc_dt[ktory]=ile;
}

//ilosc pomiarów w czasie jednego pomiaru (potegi 2) (wylicza sredni¹ i zwraca wynik)
unsigned char ADCGetIloscPomiarow(unsigned char ktory)
{
	return adc_dt[ktory];
}

//start konwersji z podanego pinu konwertera
void ADCStartConversion(unsigned char ktory)
{
	if(adc_kanal==0x00)//to jest pierwszy wiec wlaczmy przetwornik
	{
		ADCSRA |= (1<<ADEN);	//w³aczamy przetwornik
		adc_channel=ktory;

		ADMUX = ADC_REF_2_56 | ktory;
		ADCSRA|=(1<<ADSC);//wlaczamy pomiar
	}
	adc_kanal|=1<<ktory;
}

//stop konwersji z podanego pinu konwertera
void ADCStopConversion(unsigned char ktory)
{
	adc_kanal&=~(1<<ktory);
	if(adc_kanal==0x00)
	ADCSRA &= ~(1<<ADEN);//wylaczmy przetwornik bo to by³ ostatni ustawiony pomiar
}


//zwraca ostatni wynik pomiaru
//ADCWynik ddd();
unsigned int ADCGetPomiar(unsigned char ktory)
{
	if(ktory>7) return -1;

	return adc_pomiar[ktory];//*ADC_conv_mul;
}