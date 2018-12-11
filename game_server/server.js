'use strict'

process.title = 'mbed-air-hockey'
const port = 1337

const WebSocketServer = require('websocket').server
const http = require('http')
const gameloop = require('node-gameloop')
const math = require('mathjs')

// Initialize variables
const FPS = 60

var xSize = 50
var ySize = 90
var puckRadius = 2
var puckDir = (Math.random() >= 0.5) ? 1 : 2
var strikerRadius = 3.5
var inertia = 0.999
var elasticity = 0.95
var vPuck = new Vector(20, 0)
if (puckDir === 1) {
  vPuck.y = -20
} else if (puckDir === 2) {
  vPuck.y = 20
}
var pPuck = new Vector(xSize / 2, ySize / 2)
var vStriker1 = new Vector(0, 0)
var pStriker1 = new Vector(xSize / 2, ySize * 3 / 4)
var vStriker2 = new Vector(0, 0)
var pStriker2 = new Vector(xSize / 2, ySize / 4)
var pCollision = new Vector(0, 0)
var scoreP1 = 0
var scoreP2 = 0
var goal1 = false
var goal2 = false
var collision1 = false
var collision2 = false

// list of currently connected clients (users)
var clients = [ ]
var player1, player2

var server = http.createServer(function (req, res) {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.write('WebSocket open on this port', 'utf8')
    res.end()
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('File not found', 'utf8')
  }
}).listen(1337, function () {
  console.log((new Date()) + ' Server is listening on port ' + port)
})

// create the server
var wsServer = new WebSocketServer({
  httpServer: server
})

// WebSocket server
wsServer.on('request', function (req) {
  console.log((new Date()) + ' Connection from origin ' + req.origin + '.')
  var connection = req.accept(null, req.origin)

  var index = clients.push(connection) - 1
  var userName = false

  console.log((new Date()) + ' Connection accepted.')

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function (msg) {
    try {
      var json = JSON.parse(msg.utf8Data)
      if (json.type === 'strikerReading') {
        let pStriker = new Vector(0, 0)
        let vStriker = new Vector(0, 0)
        vStriker.x = json.data.vel.x * 3
        vStriker.y = json.data.vel.y * 3
        let pX = json.data.pos.x / 10
        let pY = json.data.pos.y / 10
        pStriker.x = pX
        pStriker.y = pY
        if (pX <= strikerRadius) pStriker.x = strikerRadius
        else if (pX >= ySize - strikerRadius) pStriker.x = xSize - strikerRadius
        if (pY <= strikerRadius) pStriker.y = strikerRadius
        else if (pY >= ySize - strikerRadius) pStriker.y = ySize - strikerRadius

        if (json.data.player === 1) {
          pStriker1 = pStriker
          vStriker1 = vStriker
        } else if (json.data.player === 2) {
          pStriker2 = pStriker
          vStriker2 = vStriker
        }
      }

      if (json.type === 'playerAssignment') {
        let player = 0
        if (!player1) {
          player = 1
          player1 = clients[index]
        } else if (!player2) {
          player = 2
          player2 = clients[index]
        }

        var res = JSON.stringify({
          type: 'playerAssignmentResponse',
          data: {
            'player': player
          }
        })
        clients[index].sendUTF(res)
      }
    } catch (err) {
      console.log('Invalid JSON: ', msg.data)
    }
  })

  connection.on('close', function (conn) {
    if (userName !== false) {
      console.log((new Date()) + ' Peer ' + conn.remoteAddress + ' disconnected.')
      clients.splice(index, 1)
    }
  })
})

// GAME LOOP

var waitFrames = 0
var pPuckNew = pPuck
// start the loop at 30 fps (1000/30ms per frame) and grab its id
gameloop.setGameLoop(function (dt) {
  if (goal1 || collision1) {
    var jsonP1 = JSON.stringify({
      type: 'controllerUpdate',
      data: {
        goal: goal1,
        coll: collision1
      }
    })
    if (player1) {
      player1.sendUTF(jsonP1)
    }
  }

  if (goal2 || collision2) {
    var jsonP2 = JSON.stringify({
      type: 'controllerUpdate',
      data: {
        goal: goal2,
        coll: collision2
      }
    })
    if (player2) {
      player2.sendUTF(jsonP2)
    }
  }

  if (goal1 || goal2) {
    if (scoreP1 >= 7 || scoreP2 >= 7) {
      let json = JSON.stringify({
        type: 'gameWonUpdate',
        data: {
          'winner': (scoreP1 >= 7) ? 1 : 2
        }
      })
      for (let client of clients) {
        client.sendUTF(json)
      }

      scoreP1 = 0
      scoreP2 = 0
      waitFrames = 60
    }
    // pStriker1.x = xSize / 2
    // pStriker1.y = ySize * 3 / 4
    // pStriker2.x = xSize / 2
    // pStriker2.y = ySize / 4
    pPuck.x = xSize / 2
    pPuck.y = ySize / 2
    vPuck.x = 0
    if (puckDir === 1) {
      vPuck.y = 20
    } else if (puckDir === 2) {
      vPuck.y = -20
    }
    goal1 = false
    goal2 = false
  }

  goal1 = false
  goal2 = false
  collision1 = false
  collision2 = false

  if (waitFrames > 0) {
    waitFrames--
  } else {
    pPuckNew = pPuck.add(vPuck.multiply(dt))
    let col = 0

    if (pPuckNew.x >= xSize - puckRadius) {
      col = 1
      pPuck.x = (xSize - puckRadius) - (pPuckNew.x - (xSize - puckRadius))
      vPuck.x = -vPuck.x
    } else if (pPuckNew.x <= puckRadius) {
      col = 1
      pPuck.x = puckRadius - (pPuckNew.x - puckRadius)
      vPuck.x = -vPuck.x
    }

    if (pPuckNew.y >= ySize - puckRadius) {
      goal2 = true
      col = 1
      pPuck.y = ySize - puckRadius - (pPuckNew.y - (ySize - puckRadius))
      vPuck.y = -vPuck.y
    } else if (pPuckNew.y <= puckRadius) {
      goal1 = true
      col = 1
      pPuck.y = puckRadius - (pPuckNew.y - puckRadius)
      vPuck.y = -vPuck.y
    }

    if (norm(pPuckNew.subtract(pStriker1)) <= (puckRadius + strikerRadius) && col === 0) {
      collision1 = true
      col = 1
      pCollision.x = (puckRadius * pPuck.x + strikerRadius * pStriker1.x) / (puckRadius + strikerRadius)
      pCollision.y = (puckRadius * pPuck.y + strikerRadius * pStriker1.y) / (puckRadius + strikerRadius)
      let vPuckTh = math.atan2(-vPuck.y, -vPuck.x)
      let pCollisionTh = math.atan2(pCollision.y - pStriker1.y, pCollision.x - pStriker1.x)
      let vPuckNewTh = pCollisionTh + (pCollisionTh - vPuckTh)
      let vPuckMag = norm(vPuck)
      vPuck.x = elasticity * (vPuckMag * math.cos(vPuckNewTh) + vStriker1.x)
      vPuck.y = elasticity * (vPuckMag * math.sin(vPuckNewTh) + vStriker1.y)
      let pPuckMag = norm(pPuckNew.subtract(pCollision))
      pPuck.x = pCollision.x + pPuckMag * math.cos(vPuckNewTh)
      pPuck.y = pCollision.y + pPuckMag * math.sin(vPuckNewTh)
      while (norm(pPuck.subtract(pStriker1)) <= (puckRadius + strikerRadius)) {
        pPuck.x = pPuck.x + strikerRadius * math.cos(vPuckNewTh) / 10
        pPuck.y = pPuck.y + strikerRadius * math.sin(vPuckNewTh) / 10
      }
    }

    if (norm(pPuckNew.subtract(pStriker2)) <= (puckRadius + strikerRadius) && col === 0) {
      collision2 = true
      col = 1
      pCollision.x = (puckRadius * pPuck.x + strikerRadius * pStriker2.x) / (puckRadius + strikerRadius)
      pCollision.y = (puckRadius * pPuck.y + strikerRadius * pStriker2.y) / (puckRadius + strikerRadius)
      let vPuckTh = math.atan2(-vPuck.y, -vPuck.x)
      let pCollisionTh = math.atan2(pCollision.y - pStriker2.y, pCollision.x - pStriker2.x)
      let vPuckNewTh = pCollisionTh + (pCollisionTh - vPuckTh)
      let vPuckMag = norm(vPuck)
      vPuck.x = elasticity * (vPuckMag * math.cos(vPuckNewTh) + vStriker2.x)
      vPuck.y = elasticity * (vPuckMag * math.sin(vPuckNewTh) + vStriker2.y)
      let pPuckMag = norm(pPuckNew.subtract(pCollision))
      pPuck.x = pCollision.x + pPuckMag * math.cos(vPuckNewTh)
      pPuck.y = pCollision.y + pPuckMag * math.sin(vPuckNewTh)
      while (norm(pPuck.subtract(pStriker2)) <= (puckRadius + strikerRadius)) {
        pPuck.x = pPuck.x + strikerRadius * math.cos(vPuckNewTh) / 10
        pPuck.y = pPuck.y + strikerRadius * math.sin(vPuckNewTh) / 10
      }
    }

    if (goal1 && pPuck.x >= 15 && pPuck.x <= 35) {
      scoreP1++
      puckDir = 2
      waitFrames = 30
    } else if (goal2 && pPuck.x >= 15 && pPuck.x <= 35) {
      scoreP2++
      puckDir = 1
      waitFrames = 30
    } else {
      goal1 = false
      goal2 = false
    }

    if (col === 0) {
      pPuck = pPuckNew
    }

    vPuck = vPuck.multiply(inertia)
  }

  // broadcast message to all connected clients
  let json = JSON.stringify({
    type: 'gameUpdate',
    data: {
      'puck': pPuck.multiply(10),
      'striker1': pStriker1.multiply(10),
      'striker2': pStriker2.multiply(10),
      'scoreP1': scoreP1,
      'scoreP2': scoreP2
    }
  })
  for (let client of clients) {
    client.sendUTF(json)
  }
}, 1000 / FPS)

function Vector (x, y) {
  this.x = x || 0
  this.y = y || 0
  this.add = function (vec) {
    return new Vector(this.x + vec.x, this.y + vec.y)
  }
  this.subtract = function (vec) {
    return new Vector(this.x - vec.x, this.y - vec.y)
  }
  this.multiply = function (c) {
    return new Vector(c * this.x, c * this.y)
  }
}

function norm (vec) {
  return Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2))
}
