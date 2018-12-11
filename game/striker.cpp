#include "mbed.h"
#include "rtos.h"
#include "LSM9DS1.h"
#include "Speaker.h"

// Choose player
//#define player1
#define player2

Serial pc(USBTX, USBRX);
LSM9DS1 IMU(p9, p10, 0xD6, 0x3C);
Speaker sfx(p21);

// striker variables
#ifdef player1 
    float pStriker[2] = {250,860}; // player 1
#endif
#ifdef player2
    float pStriker[2] = {250,40}; // player 2
#endif
float vStriker[2] = {0,0};
volatile int posx, posy;
volatile float xacc, yacc;
volatile bool puckHit, score;

// rtos variables
Thread striker_thread;
Thread buzzer_thread;
Mutex stream;
char send_buf[20];
char recv_buf[2];


void serial_send(){
    sprintf(send_buf,"%d,%d,%d,%d\n",(int)pStriker[0],(int)pStriker[1],
                                    (int)vStriker[0],(int)vStriker[1]);
    stream.lock();
    pc.printf("%s",send_buf);
    stream.unlock();
}
        
void serial_recv(){   
    int idx = 0;
    stream.lock();
    while(pc.readable()) {
        recv_buf[idx] = pc.getc();
        wait(0.05);
    }
    stream.unlock();
    idx++;
    if (idx > 2) idx = 0;      
    
    if (recv_buf[0] == '1'){ 
        puckHit = 1;
        recv_buf[0] = 0;
    }
    else puckHit = 0;
    if (recv_buf[0] == '2'){ 
        score = 1;
        recv_buf[0] = 0;
    }
    else score = 0;
}


void striker()
{
    while(1){
        stream.lock();
        while(!IMU.accelAvailable());
        for (int i = 0; i < 10; i++){
            IMU.readAccel();
            xacc = IMU.calcAccel(IMU.ay);
            yacc = IMU.calcAccel(IMU.ax);
        }
        stream.unlock();
        xacc /= 10;
        yacc /= 10;
        
        // set limits for accel
        if (abs(xacc) < 0.01) xacc = 0.0;
        if (xacc > 0.1) xacc = 0.1;
        if (xacc < -0.1) xacc = -0.1;
        if (abs(yacc) < 0.01) yacc = 0.0;
        if (yacc > 0.1) yacc = 0.1;
        if (yacc < -0.1) yacc = -0.1;
        
        // calculate distance based on scale factor
        posx = posx + 150*(xacc);
        posy = posy - 150*(yacc);
        
        //set limits for position
        //player 1
        #ifdef player1
            if (posx < 40) posx = 40;
            if (posx > 460) posx = 460;
            if (posy < 490) posy = 490;
            if (posy > 860) posy = 860;
        #endif
    
        //player 2
        #ifdef player2
            if (posx < 40) posx = 40;
            if (posx > 460) posx = 460;
            if (posy < 40) posy = 40;
            if (posy > 410) posy = 410;
        #endif
        
        pStriker[0] = posx;
        pStriker[1] = posy;
        vStriker[0] = 150*xacc;
        vStriker[1] = -150*yacc;
        
        serial_send();
        Thread::wait(10);
    }
}


void buzzer()
{
    while(1)
    {
        serial_recv();
        if (puckHit == 1){ 
            sfx.PlayNote(200.0, 0.1, 1.0);
            puckHit = 0;
        }
        if (score == 1){
            sfx.PlayNote(440.0, 0.25, 1.0);
            sfx.PlayNote(523.25, 0.25, 1.0);
            sfx.PlayNote(659.26, 0.25, 1.0);
            sfx.PlayNote(783.99, 0.25, 1.0);
            score = 0;
        }
        Thread::wait(100);
    }
}

    
int main()
{
    pc.baud(9600);
    
    // calibrate IMU
    stream.lock();
    IMU.begin();
    if (!IMU.begin()) {
        pc.printf("Failed to communicate with LSM9DS1.\n\r");
    }
    IMU.calibrate(1);
    stream.unlock();
    
    striker_thread.start(striker);
    buzzer_thread.start(buzzer);
    
    while(1) {}
}
