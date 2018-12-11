#include "mbed.h"
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

// puck/physics variables
// pos/vel vectors - 0=x, 1=y
float pPuck[2] = {64,64};
float pPuckNew[2] = {0,0};
float pCollision[2] = {0,0};
float vPuck[2] = {0,0};

// striker variables
float pStriker[2] = {64,110};
float pStrikerNew[2] = {0,0};
float vStriker[2] = {0,0};
volatile int posx, posy;
volatile float xacc, yacc;

// other variables
float vPuckTh, vPuckNewTh, vPuckMag;
float pPuckMag, pCollisionTh;

// norm function overloads
float norm(float * pos1, float* pos2)
{
    float x = pow(pos1[0] - pos2[0],2);
    float y = pow(pos1[1] - pos2[1],2);
    return sqrt(x+y);
}
float norm(float * pos)
{
    return sqrt(pow(pos[0],2)+pow(pos[1],2));
}

void calc_kinematics()
{
    lcd.filled_circle(pPuck[0], pPuck[1], puckR, BLACK);
    lcd.filled_circle(pStriker[0], pStriker[1], strikerR, BLACK);
    
    while(!IMU.accelAvailable());
    for (int i = 0; i < 10; i++){
        IMU.readAccel();
        xacc = IMU.calcAccel(IMU.ay);
        yacc = IMU.calcAccel(IMU.ax);
    }
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
    if (posx < 6) posx = 6;
    if (posx > 122) posx = 122;
    if (posy < 6) posy = 6;
    if (posy > 122) posy = 122;
        
    pStriker[0] = posx;
    pStriker[1] = posy;
    vStriker[0] = 40*xacc;
    vStriker[1] = -40*yacc;
        
    // other implementation of striker velocity
    /*pStrikerNew[0] = posx;
    pStrikerNew[1] = posy;
    tNew = gametime.read();
        
    vStriker[0] = (pStrikerNew[0]-pStriker[0])/((tNew-t)*100);
    vStriker[1] = (pStrikerNew[1]-pStriker[1])/((tNew-t)*100);
        
    pStriker[0] = pStrikerNew[0];
    pStriker[1] = pStrikerNew[1];
    */
          
    pPuckNew[0] = pPuck[0] + t*vPuck[0];
    pPuckNew[1] = pPuck[1] + t*vPuck[1];
        
    col = 0;
        
    // calculate new puck x position
    if (pPuckNew[0] >= xSize){
        col = 1;
        pPuck[0] = xSize - (pPuckNew[0] - xSize);
        vPuck[0] = -vPuck[0];
    } 
    else if (pPuckNew[0] <= 1){
        col = 1;
        pPuck[0] = -pPuckNew[0];
        vPuck[0] = -vPuck[0];
    }
            
    // calculate new puck y position    
    if (pPuckNew[1] >= ySize){
        col = 1;
        pPuck[1] = ySize - (pPuckNew[1] - ySize);
        vPuck[1] = -vPuck[1];
    } 
    else if (pPuckNew[1] <= 1){
        col = 1;
        pPuck[1] = - pPuckNew[1];
        vPuck[1] = -vPuck[1];
    }            
        
    if ((norm(pPuckNew, pStriker) <= (puckR + strikerR)) && col == 0){
        col = 1;
        pCollision[0] = (puckR*pPuck[0] + strikerR*pStriker[0])/(puckR + strikerR);
        pCollision[1] = (puckR*pPuck[1] + strikerR*pStriker[1])/(puckR + strikerR);
        vPuckTh = atan2(-vPuck[1], -vPuck[0]);
        pCollisionTh = atan2(pCollision[1]-pStriker[1], pCollision[0]-pStriker[0]);
        vPuckNewTh = pCollisionTh + (pCollisionTh - vPuckTh);
        vPuckMag = norm(vPuck);
        vPuck[0] = elasticity*(vPuckMag*cos(vPuckNewTh) + vStriker[0]);
        vPuck[1] = elasticity*(vPuckMag*sin(vPuckNewTh) + vStriker[1]);
        pPuckMag = norm(pPuckNew, pCollision);
        pPuck[0] = pCollision[0] + pPuckMag*cos(vPuckNewTh);
        pPuck[1] = pCollision[1] + pPuckMag*sin(vPuckNewTh);
        
        // doesn't seem to be necessary - breaks the game
        /*while (norm(pPuckNew, pStriker) <= (puckR + strikerR))
        {
            pPuck[0] = pPuck[0] + strikerR*cos(vPuckNewTh);
            pPuck[1] = pPuck[1] + strikerR*sin(vPuckNewTh);
        }*/
    }
        
    if (col == 0){
        pPuck[0] = pPuckNew[0];
        pPuck[1] = pPuckNew[1];
    }
        
    vPuck[0] = inertia*vPuck[0];
    vPuck[1] = inertia*vPuck[1]; 
}
