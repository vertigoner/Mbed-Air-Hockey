Virtual web air hockey game using mbed controllers with speakers and IMU-based tilt controls. Controller Node.js servers run on the client computer(s) connected to the mbed controllers via serial. These servers communicate with the main game server using the [WebSocket Protocol](https://tools.ietf.org/html/rfc6455), which is far better for streaming data in real time than REST (HTTP).

**[Source code on GT Github](https://github.gatech.edu/nroberts32/mbed-air-hockey)**


## Installation and Setup

This project operates through a few different Node.js servers: the main game server, and controller servers running for the two connected controllers.

### Game Server Setup

1. Make sure node and npm are installed. If not, consult this [installation guide](https://nodejs.org/en/download/package-manager/)

```bash
node -v
npm -v
```
   
2. Clone the repository

```bash
git clone https://github.gatech.edu/nroberts32/mbed-air-hockey.git
```

3. Go to the game server directory and install dependencies

```bash
cd mbed-air-hocket/game_server
npm install
```

4. Spin up the server

```bash
npm start
```

### Controller Server Setup

1. Make sure node and npm are installed on the client device as well.

```bash
node -v
npm -v
```

2. Clone the repository

```bash
git clone https://github.gatech.edu/nroberts32/mbed-air-hockey.git
```

3. Go to the controller server directory and install dependencies

```bash
cd mbed-air-hocket/controller_server
npm install(
```

4. Use the following command to check available serial ports

```bash
node listPorts.js
```

5. Use the following command to check available serial ports

```bash
node server.js <serial port path>
```


## The Game Itself

An HTTP server running on the same IP as the game engine serves HTML, JavaScript and CSS to a client browser. The graphics are all vector-based, and were created in [Adobe Illustrator](https://www.adobe.com/products/illustrator.html). The [Snap.svg](http://snapsvg.io/) JavaScript library interfaces between DOM SVG elements and incoming positional data from the game server. 

![Game Gif](https://raw.githubusercontent.com/vertigoner/Mbed-Air-Hockey/master/2018-12-11%2015.52.19.gif)


## Servers and Networking Behind the Scenes

Websockets were used extensively for streaming data in real time between the game server, connected browser clients, and the two controller servers. The controller server talks to the mbed controllers via a seriall connection at a 9600 baud rate.

![Networking Block Diagram](https://raw.githubusercontent.com/vertigoner/Mbed-Air-Hockey/master/Untitled%20Diagram.png)

This modular approach offers significant scalability. The game server could be installed on a higher-power machine with a global IP. As long as a user has a controller and the controller client server installed, they could play from anywhere with an internet connection, and any browser could connect to the server to spectate the game. 


## The mbed Striker Controller

An ARM mbed LPC1768 was used as the striker controller. Hooked up to it were an LSM9DS1 inertial measurement unit to calculate striker position and velocity, and a speaker circuit to generate sound effect feedback from in-game actions.

![mbed layout](https://raw.githubusercontent.com/vertigoner/Mbed-Air-Hockey/master/mbed_setup.jpg)

mbed Hardware setup as above. A table of connections to and from the mbed is found below:

| mbed | LSMDS91 IMU | Speaker | 2N 3904 Transistor |
|:----:|:-----------:|:-------:|:------------------:|
|  p9  |     SDA     |    -    |          -         |
|  p10 |     SCL     |    -    |          -         |
|  p21 |      -      |    -    |  Base(with 1k res) |
| Vout |     VDD     |   Sp+   |          -         |
|  Gnd |     GND     |    -    |       Emitter      |
|   -  |      -      |   Sp-   |      Collector     |

### Hardware and Software Interfaces

The mbed uses two RTOS threads to calculate accelerometer readings and check for/play sounds in parallel. The accelerometer values are calculated every 10ms, and the sound effect check is every 100ms. More infomation on the RTOS can be found at the **[mbed RTOS handbook](https://os.mbed.com/handbook/RTOS)**.

![hw-sw-flow](https://raw.githubusercontent.com/vertigoner/Mbed-Air-Hockey/master/flow_diagram.png)

### Controller Data Stream

Streaming of data to and from the mbed is done using a Serial port at 9600 baud between the controller and client computer node server. 
Striker data sent to the client is formatted as a string:
```
"<xPosition>,<yPosition>,<xVelocity>,<yVelocity>\n"
```
Packet data read in from the client is a single character to determine if a puck has been hit, or if the player has scored:
```
recv_buf[0] = '1' // puck hit
recv_buf[0] = '2' // player scored
```
Minimal sends and receives ensure that striker can stream data at a very high rate (we tested at a maximum of 10ms/packet).


## Kinematics

### Position

The puck's position is updated using a numerical integration of the velocity which goes as follows:
      
      pNew = pOld + v*Δt
      
### Collisions

#### Puck collision with a Wall
If the puck's new position lies beyond a wall, the puck's position and velocity are reflected by said wall.

![Puck collision with Wall](https://github.com/vertigoner/Mbed-Air-Hockey/blob/master/collision%20with%20wall.png)

#### Puck collision with a Striker
If the puck's new position coincides with a striker's position, the puck's position and velocity are reflected by said striker at the collision angle and the striker's velocity is added to the puck's.

![Puck collision with Striker](https://github.com/vertigoner/Mbed-Air-Hockey/blob/master/collision%20with%20striker.png)

### Inertia and Elasicity

In order to simulate the friction of the puck with the table, the puck's velocity is scaled with an inertia factor after each iteration. This factor can be changed to make to puck decelerate, have constant velocity or even accelerate with time:

      vNew = inertia * vOld

In order to simulate varying collision elasticities between the puck and the strikers, the puck's velocity is scaled with an inertia factor after each collision. This factor can be changed to make the puck bouce from the strikers faster or slower:

      vNew = elasticity * (vReflected + vStriker)
