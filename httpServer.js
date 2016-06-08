"use strict";

// Mock Secure Server
// Luke Mitchell, 03/06/2016
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');

var SERVER_HTTP_PORT = process.env.SERVER_HTTP_PORT || 8080;
var SERVER_WS_PORT = process.env.SERVER_WS_PORT || 5678;

// Authorization keys to use as request responses
// These are hard-coded as the values are not currently
// used for testing
// Respond to new connections with login data in JSON
let loginData = fs.readFileSync('json/login.json', 'utf8');
let loginObject = JSON.parse(loginData);

// Instantiate the Express app
// and support HTTP request variables
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Default message on GET
app.get('/', (req, res) => {
  res.send('Mock Secure Server');
});

// Login endpoint
app.post('/user/login', (req, res) => {
  // Verify that username and password parameters are present
  let user = req.body.UserEMailID;
  if (!user || typeof user == 'undefined') { res.status(400).send('Bad Request'); return; }

  let password = req.body.Password;
  if (!password || typeof password == 'undefined') { res.status(400).send('Bad Request'); return; }

  // Send hard-coded auth. keys
  res.json(loginObject);
});

// Update endpoint
app.post('/Gateway/UpdateDeviceData', (req, res) => {
  res.status(501).send('Not Implemented');
});

// Fallback to 404
app.use('*',  (req, res) => {
  res.status(404).send('Not Found');
});

// Listen at specified port
app.listen(SERVER_HTTP_PORT, function () {
  console.log('[HTTP] Listening at port ' + SERVER_HTTP_PORT);
});

module.exports.httpServer = app;
