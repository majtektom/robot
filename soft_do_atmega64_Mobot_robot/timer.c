/*******************************************************************************
							Obsluga timera 0
	Plik zawiera funkcje do obslugi timera0 oraz funkcje obslugi przerwania 
(wywolywana co 1 ms) zmieniajaca stan diody LED1 co 500ms.
*******************************************************************************/
#include "Main.h"

volatile unsigned int g_TIMER_ms = 0;

ISR(TIMER0_COMP_vect)
{
	g_TIMER_ms++;
}
	
/*******************************************************************************
	Inicjalizacja timera 0 do generowania przerwania co 1ms
*******************************************************************************/
void TIMER_init(void)
{
	OCR0 = 249;
	TIMSK |= (1<<OCIE0); //wlaczenie przerwania
	TCCR0 = ((1<<WGM01)|(1<<CS02));//tryb pracy  CTC, preskaler 64, co daje przy OCR0=249 1kHz@16Mhz, czyli co 1ms	
}

unsigned int TIMER_GetTime(){ return g_TIMER_ms;}