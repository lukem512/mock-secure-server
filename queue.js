"use strict"

// Mock Secure Server
// Luke Mitchell, 09/06/2016

// Very simple queue class
// Does not ensure message safety or implement timeouts
var q = class q {
  constructor() {
    this.messages = [];
  }

  push(msg) {
    this.messages.push(msg);
  }

  pop() {
    return this.messages.pop();
  }

  isEmpty() {
    return (this.messages.length == 0);
  }
}

// Return an instance of the class
module.exports.q = new q();
