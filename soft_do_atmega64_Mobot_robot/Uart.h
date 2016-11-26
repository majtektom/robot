#ifndef UART_H
#define UART_H
/** 
 *  @defgroup pfleury_uart UART Library
 *  @code #include <uart.h> @endcode
 * 
 *  @brief Interrupt UART library using the built-in UART with transmit and receive circular buffers. 
 *
 *  This library can be used to transmit and receive data through the built in UART. 
 *
 *  An interrupt is generated when the UART has finished transmitting or
 *  receiving a byte. The interrupt handling routines use circular buffers
 *  for buffering received and transmitted data.
 *
 *  The UART_RX_BUFFER_SIZE and UART_TX_BUFFER_SIZE constants define
 *  the size of the circular buffers in bytes. Note that these constants must be a power of 2.
 *  You may need to adapt this constants to your target and your application by adding 
 *  CDEFS += -DUART_RX_BUFFER_SIZE=nn -DUART_RX_BUFFER_SIZE=nn to your Makefile.
 *
 *  @note Based on Atmel Application Note AVR306
 *  @author Peter Fleury pfleury@gmx.ch  http://jump.to/fleury
 */
 
/**@{*/


#if (__GNUC__ * 100 + __GNUC_MINOR__) < 304
#error "This library requires AVR-GCC 3.4 or later, update to newer AVR-GCC compiler !"
#endif


/** @brief  UART Baudrate Expression
 *  @param  xtalcpu  system clock in Mhz, e.g. 4000000L for 4Mhz          
 *  @param  baudrate baudrate in bps, e.g. 1200, 2400, 9600     
 */
#define UART_BAUD_SELECT(baudRate,xtalCpu) ((xtalCpu)/((baudRate)*16l)-1)

/** @brief  UART Baudrate Expression for ATmega double speed mode
 *  @param  xtalcpu  system clock in Mhz, e.g. 4000000L for 4Mhz           
 *  @param  baudrate baudrate in bps, e.g. 1200, 2400, 9600     
 */
#define UART_BAUD_SELECT_DOUBLE_SPEED(baudRate,xtalCpu) (((xtalCpu)/((baudRate)*8l)-1)|0x8000)


/** Size of the circular receive buffer, must be power of 2 */
#ifndef UART_RX_BUFFER_SIZE
#define UART_RX_BUFFER_SIZE 32
#endif
/** Size of the circular transmit buffer, must be power of 2 */
#ifndef UART_TX_BUFFER_SIZE
#define UART_TX_BUFFER_SIZE 32
#endif

/* test if the size of the circular buffers fits into SRAM */
//#if ( (UART_RX_BUFFER_SIZE+UART_TX_BUFFER_SIZE) >= (RAMEND-0x60 ) )
//#error "size of UART_RX_BUFFER_SIZE + UART_TX_BUFFER_SIZE larger than size of SRAM"
//#endif

/* 
** high byte error return code of uart_getc()
*/
#define UART_FRAME_ERROR      0x0800              /* Framing Error by UART       */
#define UART_OVERRUN_ERROR    0x0400              /* Overrun condition by UART   */
#define UART_BUFFER_OVERFLOW  0x0200              /* receive ringbuffer overflow */
#define UART_NO_DATA          0x0100              /* no receive data available   */


/*
** function prototypes
*/

/**
   @brief   Initialize UART and set baudrate 
   @param   baudrate Specify baudrate using macro UART_BAUD_SELECT()
   @return  none
w��cza modu� UART i ustawia pr�dko�� transmisji,
*/
extern void uart_init(unsigned int baudrate);


/**
 *  @brief   Get received byte from ringbuffer
 *
 * Returns in the lower byte the received character and in the 
 * higher byte the last receive error.
 * UART_NO_DATA is returned when no data is available.
 *
 *  @param   void
 *  @return  lower byte:  received byte from ringbuffer
 *  @return  higher byte: last receive status
 *           - \b 0 successfully received data from UART
 *           - \b UART_NO_DATA           
 *             <br>no receive data available
 *           - \b UART_BUFFER_OVERFLOW   
 *             <br>Receive ringbuffer overflow.
 *             We are not reading the receive buffer fast enough, 
 *             one or more received character have been dropped 
 *           - \b UART_OVERRUN_ERROR     
 *             <br>Overrun condition by UART.
 *             A character already present in the UART UDR register was 
 *             not read by the interrupt handler before the next character arrived,
 *             one or more received characters have been dropped.
 *           - \b UART_FRAME_ERROR       
 *             <br>Framing Error by UART
 odczytuje odebrany bajt z bufora cyklicznego,
 */
extern unsigned int uart_getc(void);


/**
 *  @brief   Put byte to ringbuffer for transmitting via UART
 *  @param   data byte to be transmitted
 *  @return  none
 umieszca bajt do wys�ania w buforze cyklicznym,
 */
extern void uart_putc(unsigned char data);


/**
 *  @brief   Put string to ringbuffer for transmitting via UART
 *
 *  The string is buffered by the uart library in a circular buffer
 *  and one character at a time is transmitted to the UART using interrupts.
 *  Blocks if it can not write the whole string into the circular buffer.
 * 
 *  @param   s string to be transmitted
 *  @return  none
 umieszcza ci�g znak�w do wys�ania w buforze cyklicznym,
 */
extern void uart_puts(const char *s,unsigned int ile  );


/**
 * @brief    Put string from program memory to ringbuffer for transmitting via UART.
 *
 * The string is buffered by the uart library in a circular buffer
 * and one character at a time is transmitted to the UART using interrupts.
 * Blocks if it can not write the whole string into the circular buffer.
 *
 * @param    s program memory string to be transmitted
 * @return   none
 * @see      uart_puts_P
 umieszcza ci�g znak�w (z pami�ci programu) do wys�ania w buforze cyklicznym,
 */
extern void uart_puts_p(const char *s,unsigned int ile );

/**
 * @brief    Macro to automatically put a string constant into program memory
 */
#define uart_puts_P(__s,__d)       uart_puts_p(PSTR(__s),__d)

/** @brief   zwraca ilo�� bajt�w w otrzymanym buforze */
extern int uart_available(void);

/** @brief  Sp�ukaj bajty czekaj�ce w otrzymanym buforze */
extern void uart_flush(void);

/** w��cza drugi modu� UART i ustawia pr�dko�� transmisji (tylko wybrane uk�ady ATMega), */
extern void uart1_init(unsigned int baudrate);
/** odczytuje odebrany bajt z bufora cyklicznego (drugi modu� - tylko wybrane uk�ady ATMega) */
extern unsigned int uart1_getc(void);
/** - umieszca bajt do wys�ania w buforze cyklicznym (drugi modu� - tylko wybrane uk�ady ATMega), */
extern void uart1_putc(unsigned char data);
/** umieszcza ci�g znak�w do wys�ania w buforze cyklicznym (drugi modu� - tylko wybrane uk�ady ATMega), */
extern void uart1_puts(const char *s,unsigned int ile  );
/* umieszcza ci�g znak�w (z pami�ci programu) do wys�ania w buforze cyklicznym  (drugi modu� - tylko wybrane uk�ady ATMega). */
extern void uart1_puts_p(const char *s,unsigned int ile );
/** @brief  Macro to automatically put a string constant into program memory */
#define uart1_puts_P(__s,__d)       uart1_puts_p(PSTR(__s),__d)
/** @brief   zwraca ilo�� bajt�w w otrzymanym buforze */
extern int uart1_available(void);
/** @brief  Sp�ukaj bajty czekaj�ce w otrzymanym buforze */
extern void uart1_flush(void);
/**@}*/


#endif // UART_H 

