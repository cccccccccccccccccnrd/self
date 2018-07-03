const express = require('express')

/* http-server setup */
const httpServerSettings = {
  port: 3000,
  staticPath: 'public'
}
const httpServer = express()

httpServer.use(express.static(httpServerSettings.staticPath))
httpServer.listen(httpServerSettings.port)
console.log('streaming server is running on http://localhost:' + httpServerSettings.port)