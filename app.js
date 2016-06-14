"use strict";

// Mock Secure Server
// Luke Mitchell, 03/06/2016
console.log('Mock Secure Server is starting...');

var httpServer = require('./httpServer');
var wsServer = require('./wsServer');

module.exports.connections = wsServer.connections;
