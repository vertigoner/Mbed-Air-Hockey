// window properties
const scale = 1
const W = 500 * scale
const H = 900 * scale
var orientation = 1
const host = 'ws://143.215.116.90:1337'
var waitFrames = 0

window.onload = () => {
  let svg = Snap('svg')
  svg.attr({
    'width': W,
    'height': H
  })

  document.getElementById('flip')
    .addEventListener('click', () => {
      orientation *= -1
      svg.attr({
        width: 510,
        height: 910,
        transform: `matrix(${orientation} 0 0 ${orientation} 0 0)`
      })
    })

  let striker1 = svg.select('#Striker1')
  let striker2 = svg.select('#Striker2')
  let puck = svg.select('#Puck')

  // if user is running mozilla then use it's built-in WebSocket
  window.WebSocket = window.WebSocket || window.MozWebSocket
  if (!window.WebSocket) {
    console.error('Browser does not support WebSocket!')
  }

  let conn = new WebSocket(host)

  conn.onopen = () => {
    console.log('Opened connection')
  }

  conn.error = () => {
    console.error('Error connecting to WebSocket')
  }

  conn.onmessage = (msg) => {
    try {
      var json = JSON.parse(msg.data)
      if (json.type === 'gameUpdate') {
        let pX = (json.data.puck.x - W / 2) * scale
        let pY = (json.data.puck.y - H / 2) * scale
        puck.attr({ transform: `translate(${pX},${pY})` })
        striker1.attr({ transform: `translate(${(json.data.striker1.x - W / 2) * scale},${(json.data.striker1.y - H / 2) * scale})` })
        striker2.attr({ transform: `translate(${(json.data.striker2.x - W / 2) * scale},${(json.data.striker2.y - H / 2) * scale})` })

        if (waitFrames > 0) {
          waitFrames--
        } else {
          document.getElementById('winner').innerText = ''
        }
        document.getElementById('player1Score').innerText = json.data.scoreP1
        document.getElementById('player2Score').innerText = json.data.scoreP2
      }

      if (json.type === 'gameWonUpdate') {
        document.getElementById('winner').innerText = `Player ${json.data.winner} wins!!!!`
        waitFrames = 60
      }
    } catch (err) {
      console.log('Invalid JSON: ', msg.data)
    }
  }
}
