"use strict";

// Mock Secure Server
// Luke Mitchell, 03/06/2016
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');

var q = require('./queue').q;

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

// Logging middleware
app.use('*', (req, res, next) => {
  console.log('[HTTP] Request received', req.originalUrl);
  next();
});

// Default message on GET
app.get('/', (req, res) => {
  res.send('Mock Secure Server');
});

// Login endpoint
app.post('/user/login', (req, res) => {
  console.log('[HTTP] Received login request');

  // Verify that username and password parameters are present
  let user = req.body.UserEMailID;
  if (!user || typeof user == 'undefined') { return res.status(400).send('Bad Request'); }

  let password = req.body.Password;
  if (!password || typeof password == 'undefined') { return res.status(400).send('Bad Request'); }

  // Send hard-coded auth. keys
  res.json(loginObject);
});

// Update endpoint
app.post('/Gateway/UpdateDeviceData', (req, res) => {
  console.log('[HTTP] Received UpdateDeviceData request');

  /*
    Expected format:

    {
      "GatewayMacId": 11223344556677,
      "DeviceData": {
        "DRefID": 1,
        "DPID": 1,
        "DPDO": [{
          "DPRefID": 112,
          "CV": "200",
          "LTU": "2016-04-20T08:22:08"
        }]
      }
    }
  */

  // Check format
  let mac = req.body.GatewayMacId;
  if (!mac || typeof mac == 'undefined') { return res.status(400).send('Bad Request'); }

  let dd = req.body.DeviceData;
  if (!dd || typeof dd == 'undefined') { return res.status(400).send('Bad Request'); }
  if (!dd.DRefID || typeof dd.DRefID == 'undefined') { return res.status(400).send('Bad Request'); }
  if (!dd.DPID || typeof dd.DPID == 'undefined') { return res.status(400).send('Bad Request'); }

  let dpdo = dd.DPDO;
  if (!dpdo || typeof dpdo == 'undefined') { return res.status(400).send('Bad Request'); }

  let failed = false;
  dpdo.some(param => {
    if (!param.DPRefID || typeof param.DPRefID == 'undefined') { failed = true; }
    if (!param.CV || typeof param.CV == 'undefined') { failed = true; }
    if (!param.LTU || typeof param.LTU == 'undefined') { failed = true; }
    return !failed;
  });
  if (failed) { return res.status(400).send('Bad Request'); }

  // Add the message to the queue
  q.push(req.body);

  // Respond with HTTP 200
  // TODO: respond with 404 if device does not exist.
  res.send();
});

// Fallback to 404
app.use('*',  (req, res) => {
  console.warn('[HTTP] Received unhandled request', req)
  res.status(404).send('Not Found');
});

// Listen at specified port
app.listen(SERVER_HTTP_PORT, function () {
  console.log('[HTTP] Listening at port ' + SERVER_HTTP_PORT);
});

module.exports.httpServer = app;
