
#include "Sharp.h"
#include <math.h>
#include "Adc.h"

#define SHARP_USE_TABLE

unsigned int sharp_scan(unsigned int adc_val)
{

    #ifdef SHARP_USE_TABLE
        
        unsigned char pomiar;
        unsigned int wynik;
        pomiar = (unsigned char)(adc_val>>2);
        wynik = pomiar;//*(sharp_dist_table + pomiar); 
        
    #else

        #define p1 -11.395*10.0
        #define p2 105.11*10.0
        #define p3 -385.15*10.0
        #define p4 710.25*10.0
        #define p5 -690.56*10.0
        #define p6 333.08*10.0
        
        float pomiar;
        float wynik;
        
        pomiar=adc_val*conv_mul;
        wynik==0;//(p1*pow(pomiar,5)+p2*pow(pomiar,4)+p3*pow(pomiar,3)+p4*pow(pomiar,2)+p5*pomiar+p6);  
    #endif

    global_sharp_dist = (unsigned int)(wynik);
    
    return (unsigned int)(wynik);
}
