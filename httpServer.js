"use strict";

// Mock Secure Server
// Luke Mitchell, 03/06/2016
var express = require('express');
var bodyParser = require('body-parser');

var SERVER_HTTP_PORT = process.env.SERVER_HTTP_PORT || 8080;

var app = express();

// Support HTTP variables
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Default message on GET
app.get('/', (req, res) => {
  res.send('Mock Secure Server');
});

// Login endpoint
app.post('/user/login', (req, res) => {
  // Verify that USER and PASSWORD parameters are present
  let user = req.body.USER;
  if (!user || typeof user == 'undefined') { res.status(400).send('Bad Request'); }

  let password = req.body.PASSWORD;
  if (!password || typeof password == 'undefined') { res.status(400).send('Bad Request'); }

  // Send hard-coded auth. keys
  res.json({
    "SSD": {
      "AK": 42,
      "AKID": "everything"
    }});
});

// Update endpoint
app.post('/Gateway/UpdateDeviceData', (req, res) => {
  res.status(501).send('Not Implemented');
});

// Listen at specified port
app.listen(SERVER_HTTP_PORT, function () {
  console.log('[HTTP] Listening at port ' + SERVER_HTTP_PORT);
});

module.exports.httpServer = app;
