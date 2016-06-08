"use strict";

// Mock Secure Server
// Luke Mitchell, 03/06/2016
var http = require('http');
var ws = require('websocket');
var fs = require('fs');

// Configuration variables
var SERVER_WS_PORT = process.env.SERVER_WS_PORT || 5678;
var SERVER_MODE = process.env.mode || 'development';

var ORIGIN_WHITELIST = ['localhost'];

var PUSH_NOTIFICATION_INTERVAL = 4000;

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

// Track connections
var connections = [];

// Helper functions
function isOriginAllowed(origin) {
  return (ORIGIN_WHITELIST.filter(function(allowed) {
    return allowed == origin;
  }).length >  1);
};

function sendPushNotification() {
  let pushData = fs.readFileSync('json/push.json', 'utf8');
  let pushObject = JSON.parse(pushData);
  let pushMessage = JSON.stringify(pushObject);

  connections.forEach(function(destination) {
    destination.send(pushMessage);
  });

  setTimeout(sendPushNotification, PUSH_NOTIFICATION_INTERVAL);
};

// Ensure the AKID and signature are present
// No validity checking is performed
function isRequestWellFormatted(resourceURL) {
  if (resourceURL.pathname == '/websocket/connectwebsocket') {
    if (!resourceURL.query.accessKeyID) {
      console.warn('[WS] parameter \'accessKeyID\' was not present in request');
      return false;
    }

    if (!resourceURL.query.authorization) {
      console.warn('[WS] parameter \'authorization\' was not present in request');
      return false;
    }

    if (!resourceURL.query.date) {
      console.warn('[WS] parameter \'date\' was not present in request');
      return false;
    }

    return true;
  }

  console.warn('[WS] request url was incorrect');
  return false;
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

  // Check path and query variables
  if (!isRequestWellFormatted(req.resourceURL)) {
    console.log('[WS] Connection from  ' + req.origin + ' is not well-formatted and was rejected');
    req.reject();
    return;
  }

  // Accept the request!
  var connection = req.accept(null, req.origin);
  console.log('[WS] Connection from ' + connection.remoteAddress + ' accepted');

  // Add to list
  connections.push(connection);

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

    // Remove from list
    var index = connections.indexOf(connection);
    if (index !== -1) {
      connections.splice(index, 1);
    }
  })
});

// Periodically send push updates
setTimeout(sendPushNotification, PUSH_NOTIFICATION_INTERVAL);

module.exports.wsServer = wsServer;
