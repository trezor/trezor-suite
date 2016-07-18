

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.storageGet = storageGet;
exports.storageSet = storageSet;


const TREZOR_DESC = {
  vendorId: 0x534c,
  productId: 0x0001
};

const FORBIDDEN_DESCRIPTORS = [0xf1d0, 0xff01];
const REPORT_ID = 63;

function deviceToJson(device) {
  return {
    path: device.deviceId.toString()
  };
}

function hidEnumerate() {
  return new Promise((resolve, reject) => {
    try {
      chrome.hid.getDevices(TREZOR_DESC, devices => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError));
        } else {
          resolve(devices);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

function hidSend(id, reportId, data) {
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

function hidReceive(id) {
  return new Promise((resolve, reject) => {
    try {
      chrome.hid.receive(id, (reportId, data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve({ data: data, reportId: reportId });
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

function hidConnect(id) {
  return new Promise((resolve, reject) => {
    try {
      chrome.hid.connect(id, connection => {
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
function hidDisconnect(id) {
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
function platformInfo() {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.getPlatformInfo(info => {
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

function storageGet(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, items => {
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
function storageSet(key, value) {
  return new Promise((resolve, reject) => {
    try {
      const obj = {};
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
class ChromeTransport {
  constructor() {
    this._hasReportId = {};
    this._udevError = false;
  }

  _catchUdevError(error) {
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

  _isLinux() {
    if (this._isLinuxCached != null) {
      return Promise.resolve(this._isLinuxCached);
    }
    return platformInfo().then(info => {
      const linux = info.os === `linux`;
      this._isLinuxCached = linux;
      return linux;
    });
  }

  _isAfterInstall() {
    return storageGet(`afterInstall`).then(afterInstall => {
      return afterInstall !== false;
    });
  }

  showUdevError() {
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

  clearUdevError() {
    this._udevError = false;
    return storageSet(`afterInstall`, true);
  }

  enumerate() {
    return hidEnumerate().then(devices => devices.filter(device => !FORBIDDEN_DESCRIPTORS.some(des => des === device.collections[0].usagePage))).then(devices => {
      this._hasReportId = {};

      devices.forEach(device => {
        this._hasReportId[device.deviceId.toString()] = device.collections[0].reportIds.length !== 0;
      });

      return devices;
    }).then(devices => devices.map(device => deviceToJson(device)));
  }

  send(device, session, data) {
    const sessionNu = parseInt(session);
    if (isNaN(sessionNu)) {
      return Promise.reject(new Error(`Session ${ session } is not a number`));
    }
    const hasReportId = this._hasReportId[device.toString()];
    const reportId = hasReportId ? REPORT_ID : 0;

    let ab = data;
    if (!hasReportId) {
      const newArray = new Uint8Array(64);
      newArray[0] = 63;
      newArray.set(new Uint8Array(data), 1);
      ab = newArray.buffer;
    }

    return hidSend(sessionNu, reportId, ab).catch(e => this._catchUdevError(e));
  }

  receive(device, session) {
    const sessionNu = parseInt(session);
    if (isNaN(sessionNu)) {
      return Promise.reject(new Error(`Session ${ session } is not a number`));
    }
    return hidReceive(sessionNu).then(_ref => {
      let data = _ref.data;
      let reportId = _ref.reportId;

      if (reportId !== 0) {
        return data;
      } else {
        return data.slice(1);
      }
    }).then(res => this.clearUdevError().then(() => res)).catch(e => this._catchUdevError(e));
  }

  connect(device) {
    const deviceNu = parseInt(device);
    if (isNaN(deviceNu)) {
      return Promise.reject(new Error(`Device ${ deviceNu } is not a number`));
    }
    return hidConnect(deviceNu).then(d => d.toString()).catch(e => this._catchUdevError(e));
  }

  disconnect(path, session) {
    const sessionNu = parseInt(session);
    if (isNaN(sessionNu)) {
      return Promise.reject(new Error(`Session ${ session } is not a number`));
    }
    return hidDisconnect(sessionNu);
  }
}

exports.ChromeTransport = ChromeTransport;
const chromeTransport = exports.chromeTransport = new ChromeTransport();