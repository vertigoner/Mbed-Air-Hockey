#include "mbed.h"
#include "rtos.h"
#include "uLCD_4DGL.h"
#include "LSM9DS1.h"

#define puckR 2
#define strikerR 5
// adjust inertia and elasticity for rebound speed
#define inertia 0.98
#define elasticity 0.9

#define xSize 127
#define ySize 127

Serial pc(USBTX, USBRX);
uLCD_4DGL lcd(p28, p27, p30); //tx, rx, rst
LSM9DS1 IMU(p9, p10, 0xD6, 0x3C);
AnalogIn rnd(p16);
Timer gametime;

// game variables
bool col, p1score, p2score;
int dir = 0;
int p1, p2;
float t, tNew;

void setup_vars(int r)
{
    pPuck[0] = 64;
    pPuck[1] = 64;
    pStriker[0] = 64;
    pStriker[1] = 110;
    
    col = 0;
    p1score = 0;
    p2score = 0;
    
    vPuck[0] = 0;
    if (r == 1)
        vPuck[1] = -1;
    else if (r == 2)
        vPuck[1] = 1;
    else{
        float random = rand();
        if (random >= 0.5) vPuck[1] = -1;
        else vPuck[1] = 1;
    }
}

inline void score_test()
{  
    dir = 0;
    if (pPuck[1] <= 5 && pPuck[0] >= 54 && pPuck[0] <= 74){
        p1score = 1; dir = 1; p1++;
    }
    if (pPuck[1] >= 123 && pPuck[0] >= 54 && pPuck[0] <= 74){
        p2score = 1; dir = 2; p2++;
    }
}
    
void draw()
{
    lcd.rectangle(2,2,126,126,GREEN);
    lcd.filled_rectangle(54,123,74,126,BLUE);
    lcd.filled_rectangle(54,2,74,5,BLUE);
    lcd.filled_circle(pPuck[0], pPuck[1], puckR, RED);
    lcd.filled_circle(pStriker[0], pStriker[1], strikerR, BLUE);
    lcd.locate(1,14);
    lcd.printf("%d",p1);
    lcd.locate(16,1);
    lcd.printf("%d",p2);
}


int main()
{
    
    srand(rnd.read());
    setup_vars(dir);
    IMU.begin();
    if (!IMU.begin()) {
        pc.printf("Failed to communicate with LSM9DS1.\n\r");
    }
    IMU.calibrate(1);
      
    //draw(lcd);
    lcd.baudrate(3000000);
    gametime.start();
    
    while(p1 < 5 && p2 < 5){      
        t = gametime.read();      
        calc_kinematics();
        draw();
        score_test();
        if (p1score == 1 || p2score == 1)
        {
            lcd.locate(3,4);
            lcd.printf("Player %d scores!", dir);
            wait(1.0);
            gametime.reset();
            lcd.cls();
            setup_vars(dir);
            draw();
        }
    }
    lcd.cls();
    lcd.text_width(2);
    lcd.text_height(2);
    lcd.locate(1,2);
    if (p1 == 5) lcd.printf("Player 1\n Wins!");
    else if (p2 == 5) lcd.printf("Player 2\n Wins!");
    wait(1.0);
    lcd.cls();
    lcd.locate(1,2);
    lcd.text_width(2);
    lcd.text_height(2);
    lcd.printf(" Game\n Over");
}    
