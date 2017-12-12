/* @flow */

declare var __VERSION__: string;

import {create as createDefered} from '../defered';
import type {Defered} from "../defered";

import {debugInOut} from '../debug-decorator';
import {rejectTimeoutPromise} from '../defered';

type TrezorDeviceInfo = {path: string};

const pingBuffer = new TextEncoder().encode(`PINGPING`).buffer;
const pongBuffer = new TextEncoder().encode(`PONGPONG`).buffer;

// This is overcomplicated and could probable be simplier
export default class ChromeUdpPlugin {
  name: string = `ChromeUdpPlugin`;

  // for streaming of reading results
  waiting: {[socketPlusType: string]: Defered<ArrayBuffer>} = {};
  buffered: {[socketPlusType: string]: Array<ArrayBuffer>} = {};

  // state of connections
  infos: {[socket: string]: {address: string, portOut: number, portIn: number}} = {};
  sockets: {[portIn: string]: string} = {};

  portDiff: number;

  version: string = __VERSION__;
  debug: boolean = false;

  allowsWriteAndEnumerate: boolean = true;

  constructor(portDiff?: ?number) {
    if (portDiff == null) {
      this.portDiff = 3;
    } else {
      this.portDiff = portDiff;
    }
  }

  @debugInOut
  init(debug: ?boolean): Promise<void> {
    this.debug = !!debug;
    try {
      chrome.sockets.udp.onReceive.addListener(({socketId, data}) => {
        this._udpListener(socketId, data);
      });
      return Promise.resolve();
    } catch (e) {
      // if not Chrome, not sockets etc, this will reject
      return Promise.reject(e);
    }
  }

  ports: Array<number> = [];

  async setPorts(ports: Array<number>): Promise<void> {
    if (ports.length > this.portDiff) {
      throw new Error(`Too many ports. Max ${this.portDiff} allowed.`);
    }
    const oldPorts = this.ports;
    for (const port of oldPorts) {
      const socket = this.sockets[(port + this.portDiff).toString()];
      if (socket) {
        await this._udpDisconnect(parseInt(socket));
      }
      const socket2 = this.sockets[(port + this.portDiff * 2).toString()];
      if (socket2) {
        await this._udpDisconnect(parseInt(socket2));
      }
    }
    this.ports = ports;
  }

  async enumerate(): Promise<Array<TrezorDeviceInfo>> {
    const res: Array<TrezorDeviceInfo> = [];
    const wrongBufferError = new Error();
    for (const port of this.ports) {
      try {
        let socket: number;
        const portIn: string = (port + this.portDiff).toString();
        const socketS: ?string = this.sockets[portIn];
        if (socketS != null) {
          socket = parseInt(socketS);
        } else {
          socket = await this._udpConnect(port, this.portDiff);
        }
        try {
          await this._udpLowSend(socket, pingBuffer);
          const resBuffer = await Promise.race([
            rejectTimeoutPromise(1000, wrongBufferError),
            this._udpLowReceive(socket, 80), // 80 is "P" in "PONG"
          ]);
          if (!arraybufferEqual(pongBuffer, resBuffer)) {
            throw wrongBufferError;
          }
          res.push({path: port.toString()});
        } catch (e) {
          // remove bound port if cancelled
          if (e === wrongBufferError) {
            const socket = this.sockets[(port + this.portDiff).toString()];
            if (socket) {
              await this._udpDisconnect(parseInt(socket));
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
    return res;
  }

  send(device: string, session: string, data: ArrayBuffer): Promise<void> {
    const socket = parseInt(session);
    if (isNaN(socket)) {
      return Promise.reject(new Error(`Session not a number`));
    }
    return this._udpSend(socket, data);
  }

  receive(device: string, session: string): Promise<ArrayBuffer> {
    const socket = parseInt(session);
    if (isNaN(socket)) {
      return Promise.reject(new Error(`Session not a number`));
    }
    return this._udpReceive(socket);
  }

  @debugInOut
  connect(device: string): Promise<string> {
    const port = parseInt(device);
    if (isNaN(port)) {
      return Promise.reject(new Error(`Device not a number`));
    }
    const socket = this.sockets[(port + this.portDiff).toString()];
    if (socket == null) {
      return Promise.reject(new Error(`Unknown device ${device}`));
    }
    return Promise.resolve(socket);
  }

  @debugInOut
  disconnect(path: string, session: string): Promise<void> {
    const socket = parseInt(session);
    if (isNaN(socket)) {
      return Promise.reject(new Error(`Session not a number`));
    }
    return Promise.resolve();
  }

  _udpDisconnect(socketId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        chrome.sockets.udp.close(socketId, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Disconnect error ${JSON.stringify(chrome.runtime.lastError)}`));
          } else {
            const info = this.infos[socketId.toString()];
            delete this.infos[socketId.toString()];
            if (info != null) {
              delete this.sockets[info.portIn.toString()];
            }
            resolve();
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  _udpConnect(
    port: number,
    diff: number
  ): Promise<number> {
    const address = `127.0.0.1`;
    return new Promise((resolve, reject) => {
      try {
        chrome.sockets.udp.create({}, ({socketId}) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Connect error ${JSON.stringify(chrome.runtime.lastError)}`));
          } else {
            try {
              chrome.sockets.udp.bind(socketId, `127.0.0.1`, port + diff, (result: number) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(`Bind error ${JSON.stringify(chrome.runtime.lastError)}`));
                } else {
                  if (result >= 0) {
                    const portIn = port + diff;
                    this.infos[socketId.toString()] = {address: address, portOut: port, portIn: portIn};
                    this.sockets[portIn.toString()] = socketId.toString();
                    resolve(socketId);
                  } else {
                    reject(`Cannot create socket, error: ${result}`);
                  }
                }
              });
            } catch (e) {
              reject(e);
            }
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  _udpReceive(socketId: number): Promise<ArrayBuffer> {
    return this._udpLowReceive(socketId, 63).then(data => {
      const dataView: Uint8Array = new Uint8Array(data);
      if (dataView[0] !== 63) {
        throw new Error(`Invalid data; first byte should be 63, is ${dataView[0]}`);
      }
      return data.slice(1);
    });
  }

  _udpLowReceive(
    socketId: number,
    type: number
  ): Promise<ArrayBuffer> {
    const id = socketId.toString();
    const socketPlusType = `${id}-${type}`;

    if (this.buffered[socketPlusType] != null) {
      const res = this.buffered[socketPlusType].shift();
      if (this.buffered[socketPlusType].length === 0) {
        delete this.buffered[socketPlusType];
      }
      return Promise.resolve(res);
    }

    if (this.waiting[socketPlusType] != null) {
      return Promise.reject(`Something else already listening on socketId ${socketPlusType}`);
    }
    const d = createDefered();
    this.waiting[socketPlusType] = d;
    return d.promise;
  }

  _udpSend(socketId: number, data: ArrayBuffer): Promise<void> {
    const sendDataV: Uint8Array = new Uint8Array(64);
    sendDataV[0] = 63;
    sendDataV.set(new Uint8Array(data), 1);
    const sendData = sendDataV.buffer;
    return this._udpLowSend(socketId, sendData);
  }

  _udpLowSend(socketId: number, sendData: ArrayBuffer): Promise<void> {
    const id = socketId.toString();
    const info = this.infos[id];
    if (info == null) {
      return Promise.reject(`Socket ${socketId} does not exist`);
    }

    return new Promise((resolve, reject) => {
      try {
        chrome.sockets.udp.send(socketId, sendData, info.address, info.portOut, ({resultCode}) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Send error ${JSON.stringify(chrome.runtime.lastError)}`));
          } else {
            if (resultCode >= 0) {
              resolve();
            } else {
              reject(`Cannot send, error: ${resultCode}`);
            }
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  _udpListener(socketId: number, data: ArrayBuffer) {
    const id = socketId.toString();
    const dataArr = new Uint8Array(data);
    const type = dataArr[0];

    const socketPlusType = `${id}-${type}`;

    const d: ?Defered<ArrayBuffer> = this.waiting[socketPlusType];
    if (d != null) {
      d.resolve(data);
      delete this.waiting[socketPlusType];
    } else {
      if (this.infos[socketPlusType] != null) {
        if (this.buffered[socketPlusType] == null) {
          this.buffered[socketPlusType] = [];
        }
        this.buffered[socketPlusType].push(data);
      }
    }
  }

  requestDevice(): Promise<void> {
    return Promise.reject();
  }

  requestNeeded: boolean = false;
}

// from https://github.com/wbinnssmith/arraybuffer-equal
// (c) 2015 Will Binns-Smith. Licensed MIT.
function arraybufferEqual(buf1: ArrayBuffer, buf2: ArrayBuffer): boolean {
  if (buf1 === buf2) {
    return true;
  }

  if (buf1.byteLength !== buf2.byteLength) {
    return false;
  }

  const view1 = new DataView(buf1);
  const view2 = new DataView(buf2);

  let i = buf1.byteLength;
  while (i--) {
    if (view1.getUint8(i) !== view2.getUint8(i)) {
      return false;
    }
  }

  return true;
}
