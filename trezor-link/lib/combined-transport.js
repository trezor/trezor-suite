"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

class CombinedTransport {

  constructor(transports) {
    this.transports = transports;
    this._shorts().forEach(short => {
      // sanity check
      if (typeof short !== `string`) {
        throw new Error(`Short name is not a string`);
      }
      if (short.includes(`-`)) {
        throw new Error(`Transport name shouldn't  include '-'.`);
      }
    });
  }

  _shorts() {
    return Object.keys(this.transports);
  }

  enumerate() {
    const enumerations = this._shorts().map(short => {
      const transport = this.transports[short];
      return transport.enumerate().then(devices => {
        return devices.map(device => {
          return { path: `${ short }-${ device.path }` };
        });
      });
    });
    return Promise.all(enumerations).then(enumerationResults => {
      return enumerationResults.reduce((a, b) => a.concat(b), []);
    });
  }

  _parse(path) {
    if (!path.includes(`-`)) {
      throw new Error(`Input doesn't include '-'.`);
    }

    var _path$split = path.split(`-`);

    var _path$split2 = _toArray(_path$split);

    const short = _path$split2[0];

    const actualSplit = _path$split2.slice(1);

    const actual = actualSplit.join(`-`);
    const transport = this.transports[short];
    if (transport == null) {
      throw new Error(`Transport ${ short } is not defined.`);
    }
    return { actual: actual, short: short, transport: transport };
  }

  _parseBoth(path, session) {
    var _parse = this._parse(path);

    const actualPath = _parse.actual;
    const transportPath = _parse.transport;

    var _parse2 = this._parse(session);

    const actualSession = _parse2.actual;
    const transportSession = _parse2.transport;

    if (transportPath !== transportSession) {
      throw new Error(`Session transport doesn't equal path transport.`);
    }

    return {
      transport: transportPath,
      actualPath: actualPath,
      actualSession: actualSession
    };
  }

  send(path, session, data) {
    var _parseBoth = this._parseBoth(path, session);

    const transport = _parseBoth.transport;
    const actualPath = _parseBoth.actualPath;
    const actualSession = _parseBoth.actualSession;

    return transport.send(actualPath, actualSession, data);
  }

  receive(path, session) {
    var _parseBoth2 = this._parseBoth(path, session);

    const transport = _parseBoth2.transport;
    const actualPath = _parseBoth2.actualPath;
    const actualSession = _parseBoth2.actualSession;

    return transport.receive(actualPath, actualSession);
  }

  connect(path) {
    var _parse3 = this._parse(path);

    const transport = _parse3.transport;
    const short = _parse3.short;
    const actual = _parse3.actual;

    return transport.connect(actual).then(session => `${ short }-${ session }`);
  }

  disconnect(path, session) {
    var _parseBoth3 = this._parseBoth(path, session);

    const transport = _parseBoth3.transport;
    const actualPath = _parseBoth3.actualPath;
    const actualSession = _parseBoth3.actualSession;

    return transport.disconnect(actualPath, actualSession);
  }
}
exports.CombinedTransport = CombinedTransport;