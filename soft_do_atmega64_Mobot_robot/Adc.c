
#include <inttypes.h>
#include <avr/io.h>
#include <avr/interrupt.h>
#include "adc.h"
//#include "define.h"

//ustawia nastepny wlaczony kanal jako aktywny
void adc_next_channel()
{
	unsigned int i;
	for(i=0;i<8;i++)// petla po kanalach jak zaden nie aktywny to sie nie zamieni kanal
	{
		adc_channel+=1;//kanal jeden wyrzej
		if(adc_channel>7)//poza dostepnymi kanalami
		adc_channel=POMIAR_0;//ustawiamy 1
		//sprawdzamy czy jest wlaczony
		if(bit_is_set(adc_kanal,adc_channel))//jest wiec koniec
		return;
	}
}

unsigned char adc_ile_pomiarow;

//  przerwanie kt�re moze byc przerwane
ISR(ADC_vect,ISR_NOBLOCK)//wywalic przerwania za bardzo spowalnia walnac w petle glowna
{
	static signed int pomiar=0;

	pomiar += ADC;//sumujemy wyniki
	if(--adc_ile_pomiarow == 0)//koniec pomiar�w
	{
		ADC_off(); //ma na celu upewnienie sie ze nastepny wynik konwersji nie bedzie dotyczyl poprzednigo kanalu ADC
		
		adc_pomiar[adc_channel] = (adc_pomiar[adc_channel]+(pomiar/adc_ilosc_pomiarow))/2.0f;//mozna potegi 2 i przesuwac bitowo

		//ustawia nastepny kanal aktywnym
		adc_next_channel();
		//ustawia aktywny kanal multiplexu
		//ADMUX = (1<<REFS0)| adc_channel;
		ADMUX = (1<<REFS0)|(1<<REFS1)| adc_channel;
		adc_ile_pomiarow = adc_ilosc_pomiarow;
		pomiar = 0;
		ADC_on();
		ADCSRA|=(1<<ADSC);//start konwersji
	}
	
}

void ADCInit()
{
	DDRF = 0x00; //caly port jako wejscie (konieczne gdy uzywamy ADC
	adc_kanal=0x00;//zaden kana� nie aktywny
	adc_ilosc_pomiarow=8;
	adc_ile_pomiarow=adc_ilosc_pomiarow;
	adc_channel=0x00;
	//ADMUX|=(1<<REFS0);    //napiecie ref AVCC
	ADMUX|=(1<<REFS0)|(1<<REFS1);    //napiecie ref 2.56
	//preskaler 128 - 125kHz@16MHz, wlaczone przerwania, konwersja ciagla
	ADCSRA|=(1<<ADIE)|(1<<ADPS2)|(1<<ADPS1)|(1<<ADPS0)|(1<<ADATE);//(1<<ADFR)|
	ADCSRB=0;//Free Running mode
}

//ilosc pomiar�w w czasie jednego pomiaru (potegi 2)(wylicza sredni� i zwraca wynik)
void ADCSetIloscPomiarow(unsigned char ile)
{
	adc_ilosc_pomiarow=ile;
}

//ilosc pomiar�w w czasie jednego pomiaru (potegi 2) (wylicza sredni� i zwraca wynik)
unsigned char ADCGetIloscPomiarow()
{
	return adc_ilosc_pomiarow;
}

//start konwersji z podanego pinu konwertera
void ADCStartConversion(unsigned char ktory)
{
	if(adc_kanal==0x00)//to jest pierwszy wiec wlaczmy przetwornik
	{
		ADC_on();	//w�aczamy przetwornik
		adc_channel=ktory;
		//ADMUX = (1<<REFS0)| ktory;// to tak zadzia�a? pierwszy wiec ustawiamy ktory kanal
		ADMUX = (1<<REFS0)| (1<<REFS1)| ktory;// to tak zadzia�a? pierwszy wiec ustawiamy ktory kanal
		ADCSRA|=(1<<ADSC);//wlaczamy pomiar
	}
	adc_kanal|=1<<ktory;
}

//stop konwersji z podanego pinu konwertera
void ADCStopConversion(unsigned char ktory)
{
	adc_kanal&=~(1<<ktory);
	if(adc_kanal==0x00)
	ADC_off();//wylaczmy przetwornik bo to by� ostatni ustawiony pomiar
}


//zwraca ostatni wynik pomiaru
//ADCWynik ddd();
unsigned int ADCGetPomiar(unsigned char ktory)
{
	if(ktory>7) return -1;

	return adc_pomiar[ktory];//*ADC_conv_mul;
}

//wy�aczenie przetwornika
void ADC_off()
{
	ADCSRA &= ~(1<<ADEN);
}

//	Funkcja wlacza przetwornik ADC, nie rozpoczynajac konwersji
void ADC_on()
{
	ADCSRA |= (1<<ADEN);
}