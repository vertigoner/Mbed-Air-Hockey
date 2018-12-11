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
      npm install
      ```
      
4. Use the following command to check available serial ports

      ```bash
      node listPorts.js
      ```
      
5. Use the following command to check available serial ports

      ```bash
      node server.js <serial port path>
      ```
      
## Networking Behind the Scenes

Websockets were used extensively for streaming data in real time between the game server, connected browser clients, and the two controller servers. The controller server talks to the mbed controllers via a seriall connection at a 9600 baud rate.

![Networking Block Diagram](https://raw.githubusercontent.com/vertigoner/Mbed-Air-Hockey/master/Untitled%20Diagram.png)

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

In order to simulate collision inelasticity between the puck and the strikers, the puck's velocity is scaled with an inertia factor after each collision. This factor can be changed to make to puck bouce from the strikers faster or slower:

      vNew = elasticity * (vReflected + vStriker)
