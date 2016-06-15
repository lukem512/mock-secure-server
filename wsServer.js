"use strict";

// Mock Secure Server
// Luke Mitchell, 03/06/2016
var http = require('http');
var ws = require('websocket');
var fs = require('fs');

var socket = require('node-socket-ipc');
var q = require('./queue').q;

// Configuration variables
var SERVER_WS_PORT = process.env.SERVER_WS_PORT || 5678;
var SERVER_MODE = process.env.mode || 'development';

var SERVER_PERIODIC_PUSH_NOTIFICATIONS = process.env.SERVER_PERIODIC_PUSH_NOTIFICATIONS || false;

var ORIGIN_WHITELIST = ['localhost'];

var PUSH_NOTIFICATION_INTERVAL = 30000;
var CHECK_UPDATE_INTERVAL = 1000;

// Push data
let pushData = fs.readFileSync(__dirname + '/json/push.json', 'utf8');
let pushObject = JSON.parse(pushData);

// HTTP server for WebSockets
var httpServer = http.createServer((req, res) => {
  console.log('[SS][WS] Received request for ' + req.url);
  res.writeHead(404);
  res.end('This connection is for WebSockets only');
});

httpServer.listen(SERVER_WS_PORT, function() {
  console.log('[SS][WS] Listening at port ' + SERVER_WS_PORT);
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

function broadcastPushNotification() {
  // Set LUT
  // The format is "2016-04-20T08:22:08"
  pushObject.Data.GDDO.LUT = new Date().toISOString();

  // Convert to JSON and broadcast
  let pushMessage = JSON.stringify(pushObject);
  connections.forEach(function(destination) {
    destination.send(pushMessage);
  });
}

function sendPushNotification() {
  broadcastPushNotification();
  setTimeout(sendPushNotification, PUSH_NOTIFICATION_INTERVAL);
};

function checkForDeviceUdates() {
  if (!q.isEmpty()) {
    let msg = q.pop();
    console.log('[SS][WS] Retrieved update message');

    // Check for the correct gateway
    let gddo = pushObject.Data.GDDO;
    if (gddo.GMACID.toString() !== msg.GatewayMacId) { return console.warn('[SS][WS] Unknown Gateway'); }

    // This dense block of code iterates through the
    // various arrays to find corresponding devices and parameters
    // before updating them
    let now = new Date().toISOString();
    gddo.ZNDS.forEach(zone => {
      zone.DDDO.some(device => {
        if (device.DRefID == msg.DeviceData.DRefID) {
          device.DPDO.forEach(parameter => {
            msg.DeviceData.DPDO.some(newParameter => {
              if (parameter.DPRefID == newParameter.DPRefID) {
                parameter.CV = newParameter.CV;
                parameter.LUT = now;
                return true;
              }
              return false;
            })
          })
          return true;
        }
        return false;
      })
    });

    // Broadcast the change
    broadcastPushNotification();

    // Publish the change
    socket.publish('send', pushObject);
  }
  setTimeout(checkForDeviceUdates, CHECK_UPDATE_INTERVAL);
};

// Ensure the AKID and signature are present
// No validity checking is performed
function isRequestWellFormatted(resourceURL) {
  if (resourceURL.pathname == '/websocket/connectwebsocket') {
    if (!resourceURL.query.accessKeyID) {
      console.warn('[SS][WS] parameter \'accessKeyID\' was not present in request');
      return false;
    }

    if (!resourceURL.query.authorization) {
      console.warn('[SS][WS] parameter \'authorization\' was not present in request');
      return false;
    }

    if (!resourceURL.query.date) {
      console.warn('[SS][WS] parameter \'date\' was not present in request');
      return false;
    }

    return true;
  }

  console.warn('[SS][WS] request url was incorrect');
  return false;
};

wsServer.on('request', function(req) {
  // Don't run origin tests in development
  if (SERVER_MODE === 'production') {
    if (!isOriginAllowed(req.origin)) {
      console.log('[SS][WS] Connection from ' + req.origin + ' rejected');
      req.reject();
      return;
    }
  }

  // Check path and query variables
  if (!isRequestWellFormatted(req.resourceURL)) {
    console.log('[SS][WS] Connection from  ' + req.origin + ' is not well-formatted and was rejected');
    req.reject();
    return;
  }

  // Accept the request!
  var connection = req.accept(null, req.origin);
  console.log('[SS][WS] Connection from ' + connection.remoteAddress + ' accepted');

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
    console.log('[SS][WS] Message received from ' + connection.remoteAddress + ': ' + payload);
  });

  connection.on('close', function(reason, description) {
    console.log('[SS][WS] Connection from ' + connection.remoteAddress + ' closed');

    // Remove from list
    var index = connections.indexOf(connection);
    if (index !== -1) {
      connections.splice(index, 1);
    }
  })
});

// Count the number of active connections
function connectionCount() {
  return connections.length;
}

// Periodically send push updates
if (SERVER_PERIODIC_PUSH_NOTIFICATIONS) {
  setTimeout(sendPushNotification, PUSH_NOTIFICATION_INTERVAL);
}

// Periodically check for update requests
setTimeout(checkForDeviceUdates, CHECK_UPDATE_INTERVAL);

module.exports.wsServer = wsServer;
module.exports.connections = connectionCount;
