"use strict"

var WebSocketClient = require('websocket').client;

var SERVER_WS_PORT = process.env.SERVER_WS_PORT || 5678;

var client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');

    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });

    connection.on('close', function() {
        console.log('Connection Closed');
    });

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        }
    });
});

// Spawn the connection
// The values are not checked, they just need to be present
let AKID = 'everything';
let DATE = new Date();
let SIG = 'xxx';

client.connect('ws://localhost:' + SERVER_WS_PORT +
  '/WebSocket/ConnectWebSocket?accessKeyID=' + AKID + '&authorization=' + SIG + '&date=' + DATE, null);
