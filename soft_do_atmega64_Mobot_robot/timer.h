/*******************************************************************************
							Obsluga timera 0
	Plik zawiera deklaracje funkcji do obslugi timera0
*******************************************************************************/
#ifndef __TIMER_H
#define __TIMER_H
volatile unsigned int g_TIMER_ms;
void TIMER_init(void);
unsigned int TIMER_GetTime();


#endif //__TIMER_H
