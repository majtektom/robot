#ifndef _ADC_H_
#define _ADC_H_
#include<stdint.h>


//definicje dla pomiaru
#define POMIAR_0    0	//jest zwarte do masy w robocie(do pomiaru r�nicowego)
#define POMIAR_1    1	//do pomiaru r�nicowego
#define POMIAR_2	2	//jest zwarte do masy w robocie(do pomiaru r�nicowego)
#define POMIAR_3	3	//do pomiaru r�nicowego
#define POMIAR_4	4
#define POMIAR_5	5
#define POMIAR_6	6
#define POMIAR_7	7

//lista aktywnych kana��w, bitowo 0 nieaktywny , 1 aktywny
volatile unsigned char adc_kanal;

//aktualnie mnierzony kanal
volatile unsigned char adc_channel;

//przechowuje wyniki pomiaru z kolejnych pin�w
volatile uint32_t adc_pomiar[8];

//przechowuje z ilu probek usredniac dany pomiar
volatile unsigned char adc_dt[8];

//inicjacja modu�u adc
void ADCInit();

//ilosc pomiar�w w czasie jednego pomiaru (wylicza sredni� i zwraca wynik)
void ADCSetIloscPomiarow(unsigned char ile,unsigned char ktory);

//ilosc pomiar�w w czasie jednego pomiaru (wylicza sredni� i zwraca wynik)
unsigned char ADCGetIloscPomiarow(unsigned char ktory);

//start konwersji z podanego pinu konwertera
void ADCStartConversion(unsigned char ktory);
//stop konwersji z podanego pinu
void ADCStopConversion(unsigned char ktory);

//czy koniec konwersji 1 jeszcze trwa, 0 koniec konwersji
//jest ustawiona ciagla wiec to jest bez sensu
//unsigned char ADCGetStatusConversion();

//zwraca ostatni wynik pomiaru z podanego pinu
//-1 to blad nie znany ktory
unsigned int ADCGetPomiar(unsigned char ktory);



#endif
