const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
var WebSocketClient = require('websocket').client;

var host = 'ws://143.215.116.90:1337'
var portName = process.argv[2];
var player = 0;
 
var myPort = new SerialPort(portName, 9600);
var parser = myPort.pipe(new Readline({ delimiter: '\n' }))

var client = new WebSocketClient();

myPort.on('open', function() {
    console.log('Port open. Data rate: ' + myPort.baudRate);
});

myPort.on('close', function() {
    console.log('Port closed.');
});

myPort.on('error', function(error) {
    console.log('Serial port error: ' + error);
});

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});



client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');

    var json = JSON.stringify({ type: 'playerAssignment' })
        connection.sendUTF(json);

    connection.on('error', function(error) {
        console.log('Connection Error: ' + error.toString());
    });

    connection.on('close', function() {
        console.log('Connection Closed');
    });

    connection.on('message', function(msg) {
        try {
            var json = JSON.parse(msg.utf8Data)
        
        if (json.type === 'playerAssignmentResponse') {
            player = json.data.player
            console.log('This controller assigned to Player ' + player)
        }

        if(json.type === 'controllerUpdate') {
            let code = 0
            if (json.data.goal) {
                code = 2
            } else if (json.data.coll) {
                code = 1
            }
            myPort.write(code + '', function(err) {
                if (err) {
                    return console.log('Error on write: ', err.message)
                }
            })
        }

        } catch (err) {
        console.log('Invalid JSON: ', msg.data)
        }
    })

    parser.on('data', function(data) {
        if (connection.connected) {
            data = data.split(',');
            var json = JSON.stringify({
                type: 'strikerReading',
                data: {
                  player: player,
                  pos: {
                      x: data[0],
                      y: data[1]
                  },
                  vel: {
                      x: data[2],
                      y: data[3]
                  }
                }
            })
            connection.sendUTF(json);
        } else {
            connection.close()
        }
    })
})

client.connect(host);
