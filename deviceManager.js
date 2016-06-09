"use strict"

// Mock Secure Server
// Luke Mitchell, 09/06/2016

var randomID = function() {
  let MAX_ID = 99999;
  return Math.floor(Math.random() * MAX_ID);
};

var Gateway = class Gateway {
  constructor(name, mac, zones) {
    this.name = name;
    this.mac = mac;
    this.zones = zones || [];

    // Not used, for now
    this.gcs = 1;
  }

  addZone(zone) {
    this.zones.push(zone);
  }
};

var Zone = class Zone {
  constructor(devices) {
    this.id = randomID();
    this.devices = devices || [];
  }

  addDevice(device) {
    this.devices.push(device);
  }
};

var Device = class {
  constructor(parameters) {
    this.id = randomID();
    this.pid = 1;
    this.parameters = parameters || [];
  }

  addParamater(param){
    this.parameters.push(param);
  }
};

var DeviceParameter = class {
  constructor(refid, val) {
    if (!refid) return console.error('RefID was not specified for DeviceParameter');
    if (!val) return console.error('Val was not specified for DeviceParameter');

    this.refid = refid;
    this.value = val;
  }

  // Device parameter identifiers
  // These are used by RefID
  static RefID = {
    "BATTERY_LEVEL": 101,
    "SCHEDULE_ID_ACTIVE": 102,
    "SCHEDULE_OVERRIDES_SUPPORTED": 107,

    "CURRENTLY_IGNORED_FIELD": 111,
    "WAKE_UP_FREQUENCY": 112,
    "WAKE_UP_NODE": 113,
    "MOTION_DETECTED": 115,

    "TARGET_TEMPERATURE": 201,
    "MEASURED_TEMPERATURE": 202,
    "HOME_TEMPERATURE": 211,
    "AWAY_TEMPERATURE": 212,

    "MEASURED_TEMPERATURE_REPORT_DELTA": 214,
    "ASSOCIATED_SWITCH": 216,
    "CALL_FOR_HEAT": 217,

    "BINARY_SWITCH": 301,
    "ACCUMULATED_ENERGY": 304,
    "INSTANTANEOUS_POWER": 305,
    "ACCUMULATED_ENERGY_REPORTING_DELTA": 307,
    "INSTANTANEOUS_POWER_REPORTING_DELTA": 306,
    "INSTANTANEOUS_POWER_REPORTING_FREQUENCY": 308,
    "ACCUMULATED_ENERGY_REPORTING_FREQUENCY": 309
  }
};

// Export the classes
module.exports.Gateway = Gateway;
module.exports.Zone = Zone;
module.exports.Device = Device;
module.exports.DeviceParameter = DeviceParameter;

// TODO: move to app.js

var GATEWAY_MAC = process.env.GATEWAY_MAC || 11223344556677;
var GATEWAY_NAME = process.env.GATEWAY_NAME || "TestGateway";

// Create a test device with a single parameter
// then add this to a test zone and a gateway
let dp = new DeviceParameter(DeviceParameter.RefID.WAKE_UP_FREQUENCY, 600);
let dv = new Device([dp]);
let zn = new Zone([dv]);
let gw = new Gateway(, GATEWAY_MAC, [zn]);
