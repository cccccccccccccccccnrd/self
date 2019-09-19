const express = require('express')
const WebSocket = require('ws')

/* websocket server setup */
const webSocketServer = new WebSocket.Server({ port: 1717 })

webSocketServer.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    webSocketServer.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  })
})

/* stream server setup */
const streamServerSettings = {
  port: 3000,
  staticPath: 'stream'
}
const streamServer = express()

streamServer.use(express.static(streamServerSettings.staticPath))
streamServer.listen(streamServerSettings.port)
console.log('streaming server is running on http://localhost:' + streamServerSettings.port)

/* visualization server setup */
const visualizationServerSettings = {
  port: 3001,
  staticPath: 'visualization'
}
const visualizationServer = express()

visualizationServer.use(express.static(visualizationServerSettings.staticPath))
visualizationServer.listen(visualizationServerSettings.port)
console.log('visualization server is running on http://localhost:' + visualizationServerSettings.port)