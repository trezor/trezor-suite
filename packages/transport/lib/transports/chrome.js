/* @flow */

"use strict";

import type {Transport, TrezorDeviceInfo} from './index.js';

const TREZOR_DESC = {
  vendorId: 0x534c,
  productId: 0x0001,
};

const FORBIDDEN_DESCRIPTORS = [0xf1d0, 0xff01];
const REPORT_ID = 63;

function deviceToJson(device: ChromeHidDeviceInfo): TrezorDeviceInfo {
  return {
    path: device.deviceId,
    vendor: device.vendorId,
    product: device.productId,
  };
}

function hidEnumerate(): Promise<Array<ChromeHidDeviceInfo>> {
  return new Promise((resolve, reject) => {
    try {
      chrome.hid.getDevices(
        TREZOR_DESC,
        (devices: Array<ChromeHidDeviceInfo>): void => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError));
          } else {
            resolve(devices);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

function hidSend(id: number, reportId: number, data: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.hid.send(id, reportId, data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError));
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

function hidReceive(id: number): Promise<{data: ArrayBuffer, reportId: number}> {
  return new Promise((resolve, reject) => {
    try {
      chrome.hid.receive(id, (reportId: number, data: ArrayBuffer) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve({data, reportId});
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

function hidConnect(id: number): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      chrome.hid.connect(id, (connection) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(connection.connectionId);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

// Disconnects from trezor.
// First parameter is connection ID (*not* device ID!)
function hidDisconnect(id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.hid.disconnect(id, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

export class ChromeTransport {

  _hasReportId: {[id: string]: boolean} = {};

  enumerate(): Promise<Array<TrezorDeviceInfo>> {
    return hidEnumerate().then(devices => devices.filter(
      device => !FORBIDDEN_DESCRIPTORS.some(des => des === device.collections[0].usagePage))
    ).then(devices => {
      this._hasReportId = {};

      devices.forEach(device => {
        this._hasReportId[device.deviceId.toString()] = device.collections[0].reportIds.length !== 0;
      });

      return devices;
    }).then(devices => devices.map(device => deviceToJson(device)));
  }

  send(device: number | string, session: number | string, data: ArrayBuffer): Promise<void> {
    const sessionNu = parseInt(session);
    if (isNaN(sessionNu)) {
      return Promise.reject(new Error(`Session ${session} is not a number`));
    }
    const hasReportId = this._hasReportId[device.toString()];
    const reportId = hasReportId ? REPORT_ID : 0;

    let ab: ArrayBuffer = data;
    if (!hasReportId) {
      const newArray: Uint8Array = new Uint8Array(64);
      newArray[0] = 63;
      newArray.set(new Uint8Array(data), 1);
      ab = newArray.buffer;
    }

    return hidSend(sessionNu, reportId, ab);
  }

  receive(device: number | string, session: number | string): Promise<ArrayBuffer> {
    const sessionNu = parseInt(session);
    if (isNaN(sessionNu)) {
      return Promise.reject(new Error(`Session ${session} is not a number`));
    }
    return hidReceive(sessionNu).then(({data, reportId}) => {
      if (reportId !== 0) {
        return data;
      } else {
        return data.slice(1);
      }
    });
  }

  connect(device: number | string): Promise<number | string> {
    const deviceNu = parseInt(device);
    if (isNaN(deviceNu)) {
      return Promise.reject(new Error(`Device ${deviceNu} is not a number`));
    }
    return hidConnect(deviceNu);
  }

  disconnect(session: number): Promise<void> {
    const sessionNu = parseInt(session);
    if (isNaN(sessionNu)) {
      return Promise.reject(new Error(`Session ${session} is not a number`));
    }
    return hidDisconnect(sessionNu);
  }
}

export const chromeTransport: Transport = new ChromeTransport();
