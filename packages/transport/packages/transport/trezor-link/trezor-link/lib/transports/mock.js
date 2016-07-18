

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
class MockTransport {

  enumerate() {
    return Promise.resolve([]);
  }

  send(device, session, data) {
    return Promise.resolve();
  }

  receive(device, session) {
    return Promise.resolve(new ArrayBuffer(0));
  }

  connect(device) {
    return Promise.resolve(`mock`);
  }

  disconnect(path, session) {
    return Promise.resolve();
  }
}

exports.MockTransport = MockTransport;
const mockTransport = exports.mockTransport = new MockTransport();