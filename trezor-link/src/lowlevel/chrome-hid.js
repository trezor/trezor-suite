/* @flow */

declare var __VERSION__: string;

import {debugInOut} from '../debug-decorator';
import {rejectTimeoutPromise} from '../defered';

type TrezorDeviceInfo = {path: string};

const TREZOR_DESCS = [{
  vendorId: 0x534c,
  productId: 0x0001,
}, {
  vendorId: 0x1209,
  productId: 0x53c1,
}];

const FORBIDDEN_DESCRIPTORS = [0xf1d0, 0xff01];
const REPORT_ID = 63;

function deviceToJson(device: ChromeHidDeviceInfo): TrezorDeviceInfo {
  return {
    path: device.deviceId.toString(),
  };
}

function hidEnumerate(): Promise<Array<ChromeHidDeviceInfo>> {
  return new Promise((resolve, reject) => {
    try {
      chrome.hid.getDevices(
        {filters: TREZOR_DESCS},
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
  // if send (of one data packet!) does not happen within 10 seconds, the connection
  // probably failed in an unexpected way => return an error!!
  const rejecting = rejectTimeoutPromise(10 * 1000, new Error(`Cannot send data to device, check the cable.`));

  const sendRes = new Promise((resolve, reject) => {
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

  return Promise.race([rejecting, sendRes]);
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

// encapsulating chrome's platform info into Promise API
function platformInfo(): Promise<ChromePlatformInfo> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.getPlatformInfo((info: ChromePlatformInfo) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          if (info == null) {
            reject(new Error(`info is null`));
          } else {
            resolve(info);
          }
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

export function storageGet(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, (items) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          if (items[key] === null || items[key] === undefined) {
            resolve(null);
          } else {
            resolve(items[key]);
          }
          resolve(items);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

// Set to storage
export function storageSet(key:string, value:any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const obj: {} = {};
      obj[key] = value;
      chrome.storage.local.set(obj, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(undefined);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

export default class ChromeHidPlugin {
  name: string = `ChromeHidPlugin`;

  _hasReportId: {[id: string]: boolean} = {};

  _udevError: boolean = false;
  _isLinuxCached: ?boolean;

  version: string = __VERSION__;
  debug: boolean = false;

  allowsWriteAndEnumerate: boolean = true;

  @debugInOut
  init(debug: ?boolean): Promise<void> {
    this.debug = !!debug;
    try {
      if (chrome.hid.getDevices == null) {
        return Promise.reject(new Error(`chrome.hid.getDevices is null`));
      } else {
        return Promise.resolve();
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  _catchUdevError(error: Error) {
    let errMessage = error;
    if (errMessage.message !== undefined) {
      errMessage = error.message;
    }
    // A little heuristics.
    // If error message is one of these and the type of original message is initialization, it's
    // probably udev error.
    if (errMessage === `Failed to open HID device.` || errMessage === `Transfer failed.`) {
      this._udevError = true;
    }
    throw error;
  }

  _isLinux(): Promise<boolean> {
    if (this._isLinuxCached != null) {
      return Promise.resolve(this._isLinuxCached);
    }
    return platformInfo().then(info => {
      const linux = info.os === `linux`;
      this._isLinuxCached = linux;
      return linux;
    });
  }

  _isAfterInstall(): Promise<boolean> {
    return storageGet(`afterInstall`).then((afterInstall) => {
      return (afterInstall !== false);
    });
  }

  showUdevError(): Promise<boolean> {
    return this._isLinux().then(isLinux => {
      if (!isLinux) {
        return false;
      }
      return this._isAfterInstall().then(isAfterInstall => {
        if (isAfterInstall) {
          return true;
        } else {
          return this._udevError;
        }
      });
    });
  }

  clearUdevError(): Promise<void> {
    this._udevError = false;
    return storageSet(`afterInstall`, true);
  }

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

  send(device: string, session: string, data: ArrayBuffer): Promise<void> {
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

    return hidSend(sessionNu, reportId, ab).catch(e => this._catchUdevError(e));
  }

  receive(device: string, session: string): Promise<ArrayBuffer> {
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
    }).then(res =>
      this.clearUdevError().then(() => res)
    ).catch(e => this._catchUdevError(e));
  }

  @debugInOut
  connect(device: string): Promise<string> {
    const deviceNu = parseInt(device);
    if (isNaN(deviceNu)) {
      return Promise.reject(new Error(`Device ${deviceNu} is not a number`));
    }
    return hidConnect(deviceNu).then(d => d.toString()).catch(e => this._catchUdevError(e));
  }

  @debugInOut
  disconnect(path: string, session: string): Promise<void> {
    const sessionNu = parseInt(session);
    if (isNaN(sessionNu)) {
      return Promise.reject(new Error(`Session ${session} is not a number`));
    }
    return hidDisconnect(sessionNu);
  }

  requestDevice(): Promise<void> {
    return Promise.reject();
  }

  requestNeeded: boolean = false;
}
