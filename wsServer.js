"use strict";

// Mock Secure Server
// Luke Mitchell, 03/06/2016
var http = require('http');
var ws = require('websocket');
var fs = require('fs');

var SERVER_WS_PORT = process.env.SERVER_WS_PORT || 5678;
var SERVER_MODE = process.env.mode || 'development';
var ORIGIN_WHITELIST = ['localhost'];

// HTTP server for WebSockets
var httpServer = http.createServer((req, res) => {
  console.log('[WS] Received request for ' + req.url);
  res.writeHead(404);
  res.end('This connection is for WebSockets only');
});

httpServer.listen(SERVER_WS_PORT, function() {
  console.log('[WS] Listening at port ' + SERVER_WS_PORT);
});

// WebSocket server
var wsServer = new ws.server({
  httpServer,
  autoAcceptConnections: false
});

function isOriginAllowed(origin) {
  return (ORIGIN_WHITELIST.filter(function(allowed) {
    return allowed == origin;
  }).length >  1);
};

wsServer.on('request', function(req) {

  // Don't run origin tests in development
  if (SERVER_MODE === 'production') {
    if (!isOriginAllowed(req.origin)) {
      console.log('[WS] Connection from ' + req.origin + ' rejected');
      req.reject();
      return;
    }
  }

  var connection = req.accept(null, req.origin);
  console.log('[WS] Connection from ' + connection.remoteAddress + ' accepted');

  // Respond to new connections with login data in JSON
  let loginData = fs.readFileSync('json/login.json', 'utf8');
  connection.send(JSON.stringify(loginData));

  // Periodically send push updates
  // TODO

  // Connection events
  connection.on('message', function(msg) {
    let payload = 'Unknown message type';
    switch(msg.type) {
      case 'utf8':
      payload = '\'' + msg.utf8Data + '\'';
      break;

      case 'binary':
      payload = msg.binaryData.length + ' bytes';
      break;
    }
    console.log('[WS] Message received from ' + connection.remoteAddress + ': ' + payload);
  });

  connection.on('close', function(reason, description) {
    console.log('[WS] Connection from ' + connection.remoteAddress + ' closed');
  })
});

module.exports.wsServer = wsServer;
