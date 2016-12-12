#ifndef _MOTOR_H_
#define _MOTOR_H_
// silniki steruj¹ce

#define PWM_MAX 			255
//deklaracje funkcji
void MOTOR_init(void);
void MOTOR_drive(signed int left_speed,signed int right_speed);
void MOTOR_break(void);
void MOTOR_sleep(void);


#endif
