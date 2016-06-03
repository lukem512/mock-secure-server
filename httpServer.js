"use strict";

// Mock Secure Server
// Luke Mitchell, 03/06/2016
var http = require('http');

var SERVER_HTTP_PORT = process.env.SERVER_HTTP_PORT || 8080;

var httpServer = http.createServer((req, res) => {
  console.log('[HTTP] Received request for ' + req.url);

  if (req.method == 'POST') {
    // TODO - handle auth, update messages
  }

  res.writeHead(200);
  res.end('OK');
});

httpServer.listen(SERVER_HTTP_PORT, function() {
  console.log('[HTTP] Listening at port ' + SERVER_HTTP_PORT);
});

module.exports.httpServer = httpServer;
