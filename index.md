## Installation and Setup

This project operates through a few different Node.js servers: the main game server, and controller servers running for the two connected controllers.

### Game Server Setup

1. Make sure node and npm are installed. If not, consult this [installation guide](https://nodejs.org/en/download/package-manager/)

      `node -v`

      `npm -v`
      
2. Clone the repository

      `git clone https://github.gatech.edu/nroberts32/mbed-air-hockey.git`
      
3. Go to the game server directory and install dependencies

      `cd mbed-air-hocket/game_server`
      
      `npm install`
      
4. Spin up the server

      `npm start`
      
### Controller Server Setup

1. Make sure node and npm are installed on the client device as well.

      `node -v`

      `npm -v`
      
2. Clone the repository

      `git clone https://github.gatech.edu/nroberts32/mbed-air-hockey.git`
      
3. Go to the controller server directory and install dependencies

      `cd mbed-air-hocket/controller_server`
      
      `npm install`
      
4. Use the following command to check available serial ports

      `node listPorts.js`
      
5. Use the following command to check available serial ports

      `node server.js <serial port path>`
      
## Servers and Networking Behind the Scenes

Websockets were used extensively for streaming data in real time between the game server, connected browser clients, and the two controller servers. The controller server talks to the mbed controllers via a seriall connection at a 9600 baud rate.

![Networking Block Diagram](https://raw.githubusercontent.com/vertigoner/Mbed-Air-Hockey/master/Untitled%20Diagram.png)
