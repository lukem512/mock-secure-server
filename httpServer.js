"use strict";

// Mock Secure Server
// Luke Mitchell, 03/06/2016
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');

var socket = require('node-socket-ipc');
var q = require('./queue').q;

var SERVER_HTTP_PORT = process.env.SERVER_HTTP_PORT || 8080;
var SERVER_WS_PORT = process.env.SERVER_WS_PORT || 5678;

let LOG_PREFIX = process.env.LOG_PREFIX || '[SS]';

// Authorization keys to use as request responses
// These are hard-coded as the values are not currently
// used for testing
// Respond to new connections with login data in JSON
let loginData = fs.readFileSync(__dirname + '/json/login.json', 'utf8');
let loginObject = JSON.parse(loginData);

// Correct response for device update method
let updateResponseData = fs.readFileSync(__dirname + '/json/update_response.json', 'utf8');
let updateResponseObject = JSON.parse(updateResponseData);

function badRequest(res, message) {
  return res.status(400).json({
    err: 'Bad Request',
    message
  });
};

function notFound(res, message) {
  return res.status(404).json({
    err: 'Not Found',
    message
  });
}

// Instantiate the Express app
// and support HTTP request variables
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use('*', (req, res, next) => {
  console.log(LOG_PREFIX + '[HTTP] Request received', req.originalUrl);
  next();
});

// Default message on GET
app.get('/', (req, res) => {
  res.send('Mock Secure Server');
});

// Login endpoint
app.post('/user/login', (req, res) => {
  console.log(LOG_PREFIX + '[HTTP] Received login request');

  // Verify that username and password parameters are present
  let user = req.body.UserEMailID;
  if (!user || typeof user == 'undefined') { return res.status(400).send('Bad Request'); }

  let password = req.body.Password;
  if (!password || typeof password == 'undefined') { return res.status(400).send('Bad Request'); }

  // Publish login message
  socket.publish('login', {
    email: req.body.UserEMailID
  });

  // Send hard-coded auth. keys
  res.json(loginObject);
});

// Gateway list endpoint
app.get('/user/GatewayList', (req, res) => {
  console.log(LOG_PREFIX + '[HTTP] Received GatewayList request');

  // TODO - use fixtures/otherwise
  // I AM HERE
  res.json([{
    "GN": "TestGateway",
    "RID": 2,
    "GSN": "TestSite",
    "GMACID": 11223344556677
  }])
});


// Gateway data endpoint
app.get('/Gateway/GatewayData', (req, res) => {
  console.log(LOG_PREFIX + '[HTTP] Received GatewayData request');

  // Ensure query variables are present
  let query = url.parse(req.url,true).query;

  if (!query.gatewayMACID) {
    console.warn(LOG_PREFIX + '[HTTP] No GMACID specified. The URL should be in the form /Gateway/GatewayData?gatewayMACID=HEX_GMACID&lastupdatetime="ISO_DATETIME_STRING"');
    return badRequest(res, 'No gatewayMACID specified');
  }

  if (!query.lastupdatetime) {
    console.warn(LOG_PREFIX + '[HTTP] No last update time specified. The URL should be in the form /Gateway/GatewayData?gatewayMACID=HEX_GMACID&lastupdatetime="ISO_DATETIME_STRING"');
    return badRequest(res, 'No lastupdatetime specified');
  }

  // 80% chance that the gateway is online
  let random_num = Math.floor(Math.random() * 10);
  let gcs = (random_num < 8) ? "1" : "0";

  // Create date string
  let lut = new Date().toISOString();

  // TODO - use fixtures/otherwise
  res.json({
    "GDDO": {
      "ZNDS": null,
      "GMACID": 11223344556677,
      "GCS": gcs,
      "LUT": lut,
      "GN": "TestGateway"
    },
    "ALMS": []
  })
});

// Update endpoint
app.post('/Gateway/UpdateDeviceData', (req, res) => {
  console.log(LOG_PREFIX + '[HTTP] Received UpdateDeviceData request');

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
  if (!mac || typeof mac == 'undefined') { return badRequest(res, 'No GatewayMacId specified'); }

  let dd = req.body.DeviceData;
  if (!dd || typeof dd == 'undefined') { return badRequest(res, 'No DeviceData specified'); }
  if (!dd.DRefID || typeof dd.DRefID == 'undefined') { return badRequest(res, 'No DRefID specified'); }
  if (!dd.DPID || typeof dd.DPID == 'undefined') { return badRequest(res, 'No DPID specified'); }

  let dpdo = dd.DPDO;
  if (!dpdo || typeof dpdo == 'undefined') { return badRequest(res, 'No DPDO specified'); }

  let failed = false;
  dpdo.some(param => {
    if (!param.DPRefID || typeof param.DPRefID == 'undefined') { failed = true; }
    if (!param.CV || typeof param.CV == 'undefined') { failed = true; }
    if (!param.LTU || typeof param.LTU == 'undefined') { failed = true; }
    return !failed;
  });
  if (failed) {
    return badRequest(res, 'Bad DPDO specifation');
  }

  // Add the message to the queue
  q.push(req.body);

  // Send 'receive' message to listeners
  socket.publish('receive', req.body);

  // Respond with HTTP 200
  // TODO: respond with 404 if device does not exist.
  res.json(JSON.stringify(updateResponseObject));
});

// Fallback to 404
app.use('*',  (req, res) => {
  console.warn(LOG_PREFIX + '[HTTP] Received unhandled request', req)
  return notFound(res, 'The requested resource was not found');
});

// Listen at specified port
app.listen(SERVER_HTTP_PORT, function () {
  console.log(LOG_PREFIX + '[HTTP] Listening at port ' + SERVER_HTTP_PORT);
});

module.exports.httpServer = app;
