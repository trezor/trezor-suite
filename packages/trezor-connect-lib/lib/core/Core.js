"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.initTransport = exports.init = exports.initData = exports.initCore = exports.Core = exports.onCall = exports.handleMessage = void 0;

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _events = _interopRequireDefault(require("events"));

var _DataManager = _interopRequireDefault(require("../data/DataManager"));

var _DeviceList = _interopRequireDefault(require("../device/DeviceList"));

var _Device = _interopRequireDefault(require("../device/Device"));

var _constants = require("../constants");

var TRANSPORT = _interopRequireWildcard(require("../constants/transport"));

var DEVICE = _interopRequireWildcard(require("../constants/device"));

var POPUP = _interopRequireWildcard(require("../constants/popup"));

var UI = _interopRequireWildcard(require("../constants/ui"));

var IFRAME = _interopRequireWildcard(require("../constants/iframe"));

var ERROR = _interopRequireWildcard(require("../constants/errors"));

var _builder = require("../message/builder");

var _AbstractMethod = _interopRequireDefault(require("./methods/AbstractMethod"));

var _methods = require("./methods");

var _deferred = require("../utils/deferred");

var _promiseUtils = require("../utils/promiseUtils");

var _browser = require("../utils/browser");

var _debug = _interopRequireWildcard(require("../utils/debug"));

var _ConnectSettings = require("../data/ConnectSettings");

// Public variables
var _core; // Class with event emitter


var _deviceList; // Instance of DeviceList


var _popupPromise; // Waiting for popup handshake


var _uiPromises = []; // Waiting for ui response

var _callMethods = [];

var _preferredDevice; // TODO: type
// custom log


var _log = (0, _debug.init)('Core');
/**
 * Emit message to listener (parent).
 * Clear method reference from _callMethods
 * @param {CoreMessage} message
 * @returns {void}
 * @memberof Core
 */


var postMessage = function postMessage(message) {
  if (message.event === _constants.RESPONSE_EVENT) {
    var index = _callMethods.findIndex(function (call) {
      return call && call.responseID === message.id;
    });

    if (index >= 0) {
      _callMethods.splice(index, 1);
    }
  }

  _core.emit(_constants.CORE_EVENT, message);
};
/**
 * Creates an instance of _popupPromise.
 * If Core is used without popup this promise should be always resolved automatically
 * @param {boolean} requestWindow
 * @returns {Promise<void>}
 * @memberof Core
 */


var getPopupPromise = function getPopupPromise(requestWindow) {
  if (requestWindow === void 0) {
    requestWindow = true;
  }

  // request ui window (used with modal)
  if (requestWindow) {
    postMessage(new _builder.UiMessage(UI.REQUEST_UI_WINDOW));
  }

  if (!_popupPromise) {
    _popupPromise = (0, _deferred.create)();
  }

  return _popupPromise;
};
/**
 * Creates an instance of uiPromise.
 * @param {string} promiseEvent
 * @param {Device} device
 * @returns {Promise<UiPromiseResponse>}
 * @memberof Core
 */


var createUiPromise = function createUiPromise(promiseEvent, device) {
  var uiPromise = (0, _deferred.create)(promiseEvent, device);

  _uiPromises.push(uiPromise);

  return uiPromise;
};
/**
 * Finds an instance of uiPromise.
 * @param {number} callId
 * @param {string} promiseEvent
 * @returns {Promise<UiPromiseResponse>}
 * @memberof Core
 */


var findUiPromise = function findUiPromise(callId, promiseEvent) {
  return _uiPromises.find(function (p) {
    return p.id === promiseEvent;
  });
};

var removeUiPromise = function removeUiPromise(promise) {
  _uiPromises = _uiPromises.filter(function (p) {
    return p !== promise;
  });
};
/**
 * Handle incoming message.
 * @param {CoreMessage} message
 * @param {boolean} isTrustedOrigin
 * @returns {void}
 * @memberof Core
 */


var _handleMessage = function handleMessage(message, isTrustedOrigin) {
  if (isTrustedOrigin === void 0) {
    isTrustedOrigin = false;
  }

  _log.log('handle message in core', isTrustedOrigin, message);

  var safeMessages = [IFRAME.CALL, POPUP.CLOSED, UI.CHANGE_SETTINGS, UI.CUSTOM_MESSAGE_RESPONSE, UI.LOGIN_CHALLENGE_RESPONSE, TRANSPORT.RECONNECT];

  if (!isTrustedOrigin && safeMessages.indexOf(message.type) === -1) {
    console.warn('Message not trusted', message);
    return;
  }

  switch (message.type) {
    case POPUP.HANDSHAKE:
      getPopupPromise(false).resolve();
      break;

    case POPUP.CLOSED:
      // eslint-disable-next-line no-use-before-define
      onPopupClosed(message.payload ? message.payload.error : null);
      break;

    case UI.CHANGE_SETTINGS:
      (0, _debug.enable)((0, _ConnectSettings.parse)(message.payload).debug);
      break;

    case TRANSPORT.RECONNECT:
      // eslint-disable-next-line no-use-before-define
      reconnectTransport();
      break;
    // messages from UI (popup/modal...)

    case UI.RECEIVE_DEVICE:
    case UI.RECEIVE_CONFIRMATION:
    case UI.RECEIVE_PERMISSION:
    case UI.RECEIVE_PIN:
    case UI.RECEIVE_PASSPHRASE:
    case UI.INVALID_PASSPHRASE_ACTION:
    case UI.RECEIVE_ACCOUNT:
    case UI.CHANGE_ACCOUNT:
    case UI.RECEIVE_FEE:
    case UI.RECEIVE_BROWSER:
    case UI.CUSTOM_MESSAGE_RESPONSE:
    case UI.RECEIVE_WORD:
    case UI.LOGIN_CHALLENGE_RESPONSE:
      {
        var uiPromise = findUiPromise(0, message.type);

        if (uiPromise) {
          uiPromise.resolve({
            event: message.type,
            payload: message.payload
          });
          removeUiPromise(uiPromise);
        }

        break;
      }
    // message from index

    case IFRAME.CALL:
      // eslint-disable-next-line no-use-before-define
      onCall(message).catch(function (error) {
        _log.debug('onCall error', error);
      });
      break;
  }
};
/**
 * Find device by device path. Returned device may be unacquired.
 * @param {AbstractMethod} method
 * @returns {Promise<Device>}
 * @memberof Core
 */


exports.handleMessage = _handleMessage;

var initDevice =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(method) {
    var isWebUsb, device, devicesCount, selectedDevicePath, uiPromise, uiResp;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (_deviceList) {
              _context.next = 2;
              break;
            }

            throw ERROR.NO_TRANSPORT;

          case 2:
            isWebUsb = _deviceList.transportType().indexOf('webusb') >= 0;

            if (!method.devicePath) {
              _context.next = 7;
              break;
            }

            device = _deviceList.getDevice(method.devicePath);
            _context.next = 31;
            break;

          case 7:
            devicesCount = _deviceList.length();

            if (!(devicesCount === 1 && !isWebUsb)) {
              _context.next = 13;
              break;
            }

            // there is only one device available. use it
            selectedDevicePath = _deviceList.getFirstDevicePath();
            device = _deviceList.getDevice(selectedDevicePath);
            _context.next = 31;
            break;

          case 13:
            // no devices available
            // initialize uiPromise instance which will catch changes in _deviceList (see: handleDeviceSelectionChanges function)
            // but do not wait for resolve yet
            createUiPromise(UI.RECEIVE_DEVICE); // wait for popup handshake

            _context.next = 16;
            return getPopupPromise().promise;

          case 16:
            // check again for available devices
            // there is a possible race condition before popup open
            devicesCount = _deviceList.length();

            if (!(devicesCount === 1 && !isWebUsb)) {
              _context.next = 22;
              break;
            }

            // there is one device available. use it
            selectedDevicePath = _deviceList.getFirstDevicePath();
            device = _deviceList.getDevice(selectedDevicePath);
            _context.next = 31;
            break;

          case 22:
            // request select device view
            postMessage(new _builder.UiMessage(UI.SELECT_DEVICE, {
              webusb: isWebUsb,
              devices: _deviceList.asArray()
            })); // wait for device selection

            uiPromise = findUiPromise(method.responseID, UI.RECEIVE_DEVICE);

            if (!uiPromise) {
              _context.next = 31;
              break;
            }

            _context.next = 27;
            return uiPromise.promise;

          case 27:
            uiResp = _context.sent;

            if (uiResp.payload.remember) {
              if (!uiResp.payload.device.state) {
                delete uiResp.payload.device.state;
              }

              _preferredDevice = uiResp.payload.device;
            }

            selectedDevicePath = uiResp.payload.device.path;
            device = _deviceList.getDevice(selectedDevicePath);

          case 31:
            if (device) {
              _context.next = 33;
              break;
            }

            throw ERROR.DEVICE_NOT_FOUND;

          case 33:
            return _context.abrupt("return", device);

          case 34:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function initDevice(_x) {
    return _ref.apply(this, arguments);
  };
}();
/**
 * Processing incoming message.
 * This method is async that's why it returns Promise but the real response is passed by postMessage(new ResponseMessage)
 * @param {CoreMessage} message
 * @returns {Promise<void>}
 * @memberof Core
 */


var onCall =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(message) {
    var responseID, trustedHost, isUsingPopup, method, messageResponse, response, device, _response, previousCall, PIN_TRIES, MAX_PIN_TRIES, inner;

    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!(!message.id || !message.payload)) {
              _context3.next = 2;
              break;
            }

            throw ERROR.INVALID_PARAMETERS;

          case 2:
            if (_preferredDevice && !message.payload.device) {
              message.payload.device = _preferredDevice;
            }

            if (!(!_deviceList && !_DataManager.default.getSettings('transportReconnect'))) {
              _context3.next = 6;
              break;
            }

            _context3.next = 6;
            return initTransport(_DataManager.default.getSettings());

          case 6:
            responseID = message.id;
            trustedHost = _DataManager.default.getSettings('trustedHost');
            isUsingPopup = _DataManager.default.getSettings('popup'); // find method and parse incoming params

            _context3.prev = 9;
            method = (0, _methods.find)(message); // bind callbacks

            method.postMessage = postMessage;
            method.getPopupPromise = getPopupPromise;
            method.createUiPromise = createUiPromise;
            method.findUiPromise = findUiPromise;
            method.removeUiPromise = removeUiPromise;
            _context3.next = 23;
            break;

          case 18:
            _context3.prev = 18;
            _context3.t0 = _context3["catch"](9);
            postMessage(new _builder.UiMessage(POPUP.CANCEL_POPUP_REQUEST));
            postMessage(new _builder.ResponseMessage(responseID, false, {
              error: ERROR.INVALID_PARAMETERS.message + ': ' + _context3.t0.message
            }));
            throw ERROR.INVALID_PARAMETERS;

          case 23:
            _callMethods.push(method);

            if (_browser.state.supported) {
              _context3.next = 32;
              break;
            }

            _context3.next = 27;
            return getPopupPromise().promise;

          case 27:
            // show message about browser
            postMessage(new _builder.UiMessage(UI.BROWSER_NOT_SUPPORTED, _browser.state));
            postMessage(new _builder.ResponseMessage(responseID, false, {
              error: ERROR.BROWSER_NOT_SUPPORTED.message
            }));
            throw ERROR.BROWSER_NOT_SUPPORTED;

          case 32:
            if (!_browser.state.outdated) {
              _context3.next = 40;
              break;
            }

            if (!isUsingPopup) {
              _context3.next = 39;
              break;
            }

            _context3.next = 36;
            return getPopupPromise().promise;

          case 36:
            // show message about browser
            postMessage(new _builder.UiMessage(UI.BROWSER_OUTDATED, _browser.state)); // TODO: wait for user interaction
            // const uiPromise: Deferred<UiPromiseResponse> = createUiPromise(UI.RECEIVE_BROWSER);
            // const uiResp: UiPromiseResponse = await uiPromise.promise;

            _context3.next = 40;
            break;

          case 39:
            // just show message about browser
            postMessage(new _builder.UiMessage(UI.BROWSER_OUTDATED, _browser.state));

          case 40:
            if (!(isUsingPopup && method.requiredPermissions.includes('management') && !_DataManager.default.isManagementAllowed())) {
              _context3.next = 44;
              break;
            }

            postMessage(new _builder.UiMessage(POPUP.CANCEL_POPUP_REQUEST));
            postMessage(new _builder.ResponseMessage(responseID, false, {
              error: ERROR.MANAGEMENT_NOT_ALLOWED.message
            }));
            throw ERROR.MANAGEMENT_NOT_ALLOWED;

          case 44:
            if (method.useDevice) {
              _context3.next = 64;
              break;
            }

            if (!method.useUi) {
              _context3.next = 50;
              break;
            }

            _context3.next = 48;
            return getPopupPromise().promise;

          case 48:
            _context3.next = 51;
            break;

          case 50:
            // cancel popup request
            postMessage(new _builder.UiMessage(POPUP.CANCEL_POPUP_REQUEST));

          case 51:
            _context3.prev = 51;
            _context3.next = 54;
            return method.run();

          case 54:
            response = _context3.sent;
            messageResponse = new _builder.ResponseMessage(method.responseID, true, response);
            postMessage(messageResponse);
            return _context3.abrupt("return", Promise.resolve());

          case 60:
            _context3.prev = 60;
            _context3.t1 = _context3["catch"](51);
            postMessage(new _builder.ResponseMessage(method.responseID, false, {
              error: _context3.t1.message
            }));
            throw _context3.t1;

          case 64:
            _context3.prev = 64;
            _context3.next = 67;
            return initDevice(method);

          case 67:
            device = _context3.sent;
            _context3.next = 81;
            break;

          case 70:
            _context3.prev = 70;
            _context3.t2 = _context3["catch"](64);

            if (!(_context3.t2 === ERROR.NO_TRANSPORT)) {
              _context3.next = 78;
              break;
            }

            _context3.next = 75;
            return getPopupPromise().promise;

          case 75:
            // show message about transport
            postMessage(new _builder.UiMessage(UI.TRANSPORT));
            _context3.next = 79;
            break;

          case 78:
            // cancel popup request
            postMessage(new _builder.UiMessage(POPUP.CANCEL_POPUP_REQUEST));

          case 79:
            // TODO: this should not be returned here before user agrees on "read" perms...
            postMessage(new _builder.ResponseMessage(responseID, false, {
              error: _context3.t2.message
            }));
            throw _context3.t2;

          case 81:
            method.device = device;
            method.devicePath = device.getDevicePath(); // method is a debug link message

            if (!method.debugLink) {
              _context3.next = 97;
              break;
            }

            _context3.prev = 84;
            _context3.next = 87;
            return method.run();

          case 87:
            _response = _context3.sent;
            messageResponse = new _builder.ResponseMessage(method.responseID, true, _response);
            postMessage(messageResponse);
            return _context3.abrupt("return", Promise.resolve());

          case 93:
            _context3.prev = 93;
            _context3.t3 = _context3["catch"](84);
            postMessage(new _builder.ResponseMessage(method.responseID, false, {
              error: _context3.t3.message
            }));
            throw _context3.t3;

          case 97:
            // find pending calls to this device
            previousCall = _callMethods.filter(function (call) {
              return call && call !== method && call.devicePath === method.devicePath;
            });

            if (!(previousCall.length > 0 && method.overridePreviousCall)) {
              _context3.next = 107;
              break;
            }

            // set flag for each pending method
            previousCall.forEach(function (call) {
              call.overridden = true;
            }); // interrupt potential communication with device. this should throw error in try/catch block below
            // this error will apply to the last item of pending methods

            _context3.next = 102;
            return device.override(ERROR.CALL_OVERRIDE);

          case 102:
            if (!method.overridden) {
              _context3.next = 105;
              break;
            }

            postMessage(new _builder.ResponseMessage(method.responseID, false, {
              error: ERROR.CALL_OVERRIDE.message,
              code: ERROR.CALL_OVERRIDE.code
            }));
            throw ERROR.CALL_OVERRIDE;

          case 105:
            _context3.next = 116;
            break;

          case 107:
            if (!device.isRunning()) {
              _context3.next = 116;
              break;
            }

            if (device.isLoaded()) {
              _context3.next = 113;
              break;
            }

            _context3.next = 111;
            return device.waitForFirstRun();

          case 111:
            _context3.next = 116;
            break;

          case 113:
            // cancel popup request
            postMessage(new _builder.UiMessage(POPUP.CANCEL_POPUP_REQUEST));
            postMessage(new _builder.ResponseMessage(responseID, false, {
              error: ERROR.DEVICE_CALL_IN_PROGRESS.message
            }));
            throw ERROR.DEVICE_CALL_IN_PROGRESS;

          case 116:
            // set device instance. default is 0
            device.setInstance(method.deviceInstance);

            if (method.hasExpectedDeviceState) {
              device.setExpectedState(method.deviceState);
            } // device is available
            // set public variables, listeners and run method

            /* eslint-disable no-use-before-define */


            device.on(DEVICE.BUTTON, function (device, code) {
              onDeviceButtonHandler(device, code, method);
            });
            device.on(DEVICE.PIN, onDevicePinHandler);
            device.on(DEVICE.WORD, onDeviceWordHandler);
            device.on(DEVICE.PASSPHRASE, method.useEmptyPassphrase ? onEmptyPassphraseHandler : onDevicePassphraseHandler);
            device.on(DEVICE.PASSPHRASE_ON_DEVICE, function () {
              postMessage(new _builder.UiMessage(UI.REQUEST_PASSPHRASE_ON_DEVICE, {
                device: device.toMessageObject()
              }));
            });
            /* eslint-enable no-use-before-define */

            _context3.prev = 123;
            PIN_TRIES = 1;
            MAX_PIN_TRIES = 3; // This function will run inside Device.run() after device will be acquired and initialized

            inner =
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee2() {
                var unexpectedMode, permitted, deviceNeedsBackup, _permitted, firmwareException, confirmed, messages, deviceState, validState, uiPromise, uiResp, resp, customMessages, _response2;

                return _regenerator.default.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        // check if device is in unexpected mode [bootloader, not-initialized, required firmware]
                        unexpectedMode = device.hasUnexpectedMode(method.allowDeviceMode);

                        if (!unexpectedMode) {
                          _context2.next = 14;
                          break;
                        }

                        device.keepSession = false;

                        if (!isUsingPopup) {
                          _context2.next = 12;
                          break;
                        }

                        _context2.next = 6;
                        return getPopupPromise().promise;

                      case 6:
                        // show unexpected state information
                        postMessage(new _builder.UiMessage(unexpectedMode, device.toMessageObject())); // wait for device disconnect

                        _context2.next = 9;
                        return createUiPromise(DEVICE.DISCONNECT, device).promise;

                      case 9:
                        return _context2.abrupt("return", Promise.resolve());

                      case 12:
                        // return error if not using popup
                        postMessage(new _builder.ResponseMessage(method.responseID, false, {
                          error: unexpectedMode
                        }));
                        return _context2.abrupt("return", Promise.resolve());

                      case 14:
                        // check and request permissions [read, write...]
                        method.checkPermissions();

                        if (!(!trustedHost && method.requiredPermissions.length > 0)) {
                          _context2.next = 23;
                          break;
                        }

                        _context2.next = 18;
                        return method.requestPermissions();

                      case 18:
                        permitted = _context2.sent;

                        if (permitted) {
                          _context2.next = 23;
                          break;
                        }

                        postMessage(new _builder.ResponseMessage(method.responseID, false, {
                          error: ERROR.PERMISSIONS_NOT_GRANTED.message
                        })); // eslint-disable-next-line no-use-before-define

                        closePopup(); // interrupt process and go to "final" block

                        return _context2.abrupt("return", Promise.resolve());

                      case 23:
                        deviceNeedsBackup = device.features.needs_backup;

                        if (!(deviceNeedsBackup && typeof method.noBackupConfirmation === 'function')) {
                          _context2.next = 32;
                          break;
                        }

                        _context2.next = 27;
                        return method.noBackupConfirmation();

                      case 27:
                        _permitted = _context2.sent;

                        if (_permitted) {
                          _context2.next = 32;
                          break;
                        }

                        postMessage(new _builder.ResponseMessage(method.responseID, false, {
                          error: ERROR.PERMISSIONS_NOT_GRANTED.message,
                          code: ERROR.PERMISSIONS_NOT_GRANTED.code
                        })); // eslint-disable-next-line no-use-before-define

                        closePopup(); // interrupt process and go to "final" block

                        return _context2.abrupt("return", Promise.resolve());

                      case 32:
                        if (!deviceNeedsBackup) {
                          _context2.next = 36;
                          break;
                        }

                        _context2.next = 35;
                        return getPopupPromise().promise;

                      case 35:
                        // show notification
                        postMessage(new _builder.UiMessage(UI.DEVICE_NEEDS_BACKUP, device.toMessageObject()));

                      case 36:
                        _context2.next = 38;
                        return method.checkFirmwareRange(isUsingPopup);

                      case 38:
                        firmwareException = _context2.sent;

                        if (!firmwareException) {
                          _context2.next = 49;
                          break;
                        }

                        if (!isUsingPopup) {
                          _context2.next = 47;
                          break;
                        }

                        // show unexpected state information
                        postMessage(new _builder.UiMessage(firmwareException, device.toMessageObject())); // wait for device disconnect

                        _context2.next = 44;
                        return createUiPromise(DEVICE.DISCONNECT, device).promise;

                      case 44:
                        return _context2.abrupt("return", Promise.resolve());

                      case 47:
                        // return error if not using popup
                        postMessage(new _builder.ResponseMessage(method.responseID, false, {
                          error: firmwareException
                        }));
                        return _context2.abrupt("return", Promise.resolve());

                      case 49:
                        if (!(device.firmwareStatus === 'outdated')) {
                          _context2.next = 53;
                          break;
                        }

                        _context2.next = 52;
                        return getPopupPromise().promise;

                      case 52:
                        // show notification
                        postMessage(new _builder.UiMessage(UI.FIRMWARE_OUTDATED, device.toMessageObject()));

                      case 53:
                        if (!(!trustedHost && typeof method.confirmation === 'function')) {
                          _context2.next = 61;
                          break;
                        }

                        _context2.next = 56;
                        return method.confirmation();

                      case 56:
                        confirmed = _context2.sent;

                        if (confirmed) {
                          _context2.next = 61;
                          break;
                        }

                        postMessage(new _builder.ResponseMessage(method.responseID, false, {
                          error: 'Cancelled'
                        })); // eslint-disable-next-line no-use-before-define

                        closePopup(); // interrupt process and go to "final" block

                        return _context2.abrupt("return", Promise.resolve());

                      case 61:
                        if (!_deviceList) {
                          _context2.next = 65;
                          break;
                        }

                        // restore default messages
                        messages = _DataManager.default.findMessages(device.isT1() ? 0 : 1, device.getVersion());
                        _context2.next = 65;
                        return _deviceList.reconfigure(messages);

                      case 65:
                        _context2.prev = 65;

                        if (!method.useDeviceState) {
                          _context2.next = 72;
                          break;
                        }

                        _context2.next = 69;
                        return device.getCommands().getDeviceState();

                      case 69:
                        _context2.t0 = _context2.sent;
                        _context2.next = 73;
                        break;

                      case 72:
                        _context2.t0 = 'null';

                      case 73:
                        deviceState = _context2.t0;
                        validState = !method.useDeviceState || method.useEmptyPassphrase || device.validateExpectedState(deviceState);

                        if (validState) {
                          _context2.next = 93;
                          break;
                        }

                        if (!isUsingPopup) {
                          _context2.next = 92;
                          break;
                        }

                        // initialize user response promise
                        uiPromise = createUiPromise(UI.INVALID_PASSPHRASE_ACTION, device); // request action view

                        postMessage(new _builder.UiMessage(UI.INVALID_PASSPHRASE, {
                          device: device.toMessageObject()
                        })); // wait for user response

                        _context2.next = 81;
                        return uiPromise.promise;

                      case 81:
                        uiResp = _context2.sent;
                        resp = uiResp.payload;

                        if (!resp) {
                          _context2.next = 89;
                          break;
                        }

                        _context2.next = 86;
                        return device.getCommands().initialize(method.useEmptyPassphrase);

                      case 86:
                        return _context2.abrupt("return", inner());

                      case 89:
                        // set new state as requested
                        device.setState(deviceState);

                      case 90:
                        _context2.next = 93;
                        break;

                      case 92:
                        throw ERROR.INVALID_STATE;

                      case 93:
                        _context2.next = 108;
                        break;

                      case 95:
                        _context2.prev = 95;
                        _context2.t1 = _context2["catch"](65);

                        if (!(_context2.t1.message === ERROR.INVALID_PIN_ERROR_MESSAGE && PIN_TRIES < MAX_PIN_TRIES)) {
                          _context2.next = 103;
                          break;
                        }

                        PIN_TRIES++;
                        postMessage(new _builder.UiMessage(UI.INVALID_PIN, {
                          device: device.toMessageObject()
                        }));
                        return _context2.abrupt("return", inner());

                      case 103:
                        // other error
                        postMessage(new _builder.ResponseMessage(method.responseID, false, {
                          error: _context2.t1.message
                        })); // eslint-disable-next-line no-use-before-define

                        closePopup(); // clear cached passphrase. it's not valid

                        device.clearPassphrase();
                        device.setState(null); // interrupt process and go to "final" block

                        return _context2.abrupt("return", Promise.resolve());

                      case 108:
                        if (!method.useUi) {
                          _context2.next = 113;
                          break;
                        }

                        _context2.next = 111;
                        return getPopupPromise().promise;

                      case 111:
                        _context2.next = 114;
                        break;

                      case 113:
                        // popup is not required
                        postMessage(new _builder.UiMessage(POPUP.CANCEL_POPUP_REQUEST));

                      case 114:
                        _context2.prev = 114;
                        // for CustomMessage method reconfigure transport with custom messages definitions
                        customMessages = method.getCustomMessages();

                        if (!(_deviceList && customMessages)) {
                          _context2.next = 119;
                          break;
                        }

                        _context2.next = 119;
                        return _deviceList.reconfigure(customMessages, true);

                      case 119:
                        _context2.next = 121;
                        return method.run();

                      case 121:
                        _response2 = _context2.sent;
                        messageResponse = new _builder.ResponseMessage(method.responseID, true, _response2);
                        _context2.next = 134;
                        break;

                      case 125:
                        _context2.prev = 125;
                        _context2.t2 = _context2["catch"](114);

                        if (method) {
                          _context2.next = 129;
                          break;
                        }

                        return _context2.abrupt("return", Promise.resolve());

                      case 129:
                        if (_context2.t2.custom) {
                          delete _context2.t2.custom;
                          postMessage(new _builder.ResponseMessage(method.responseID, false, _context2.t2));
                        } else {
                          postMessage(new _builder.ResponseMessage(method.responseID, false, {
                            error: _context2.t2.message,
                            code: _context2.t2.code
                          }));
                        } // device.release();


                        device.removeAllListeners(); // eslint-disable-next-line no-use-before-define

                        closePopup(); // eslint-disable-next-line no-use-before-define

                        cleanup();
                        return _context2.abrupt("return", Promise.resolve());

                      case 134:
                        // eslint-disable-next-line no-use-before-define
                        closePopup();

                      case 135:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2, this, [[65, 95], [114, 125]]);
              }));

              return function inner() {
                return _ref3.apply(this, arguments);
              };
            }(); // run inner function


            _context3.next = 129;
            return device.run(inner, {
              keepSession: method.keepSession,
              useEmptyPassphrase: method.useEmptyPassphrase,
              skipFinalReload: method.skipFinalReload
            });

          case 129:
            _context3.next = 134;
            break;

          case 131:
            _context3.prev = 131;
            _context3.t4 = _context3["catch"](123);

            if (method) {
              // corner case:
              // thrown while acquiring device
              // it's a race condition between two tabs
              // workaround is to enumerate transport again and report changes to get a valid session number
              if (_deviceList && _context3.t4.message === ERROR.WRONG_PREVIOUS_SESSION_ERROR_MESSAGE) {
                _deviceList.enumerate();
              } // cancel popup request


              postMessage(new _builder.UiMessage(POPUP.CANCEL_POPUP_REQUEST)); // TODO: should it be here?

              postMessage(new _builder.ResponseMessage(method.responseID, false, {
                error: _context3.t4.message || _context3.t4,
                code: _context3.t4.code
              })); // eslint-disable-next-line no-use-before-define

              closePopup();
            }

          case 134:
            _context3.prev = 134;

            // Work done
            _log.log('onCall::finally', messageResponse);

            device.cleanup(); // eslint-disable-next-line no-use-before-define

            cleanup();

            if (method) {
              method.dispose();
            } // restore default messages


            if (!_deviceList) {
              _context3.next = 142;
              break;
            }

            _context3.next = 142;
            return _deviceList.restoreMessages();

          case 142:
            if (messageResponse) {
              postMessage(messageResponse);
            }

            return _context3.finish(134);

          case 144:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this, [[9, 18], [51, 60], [64, 70], [84, 93], [123, 131, 134, 144]]);
  }));

  return function onCall(_x2) {
    return _ref2.apply(this, arguments);
  };
}();
/**
 * Clean up all variables and references.
 * @returns {void}
 * @memberof Core
 */


exports.onCall = onCall;

var cleanup = function cleanup() {
  // closePopup(); // this causes problem when action is interrupted (example: bootloader mode)
  _popupPromise = null;
  _uiPromises = []; // TODO: remove only promises with params callId

  _log.log('Cleanup...');
};
/**
 * Force close popup.
 * @returns {void}
 * @memberof Core
 */


var closePopup = function closePopup() {
  postMessage(new _builder.UiMessage(UI.CLOSE_UI_WINDOW));
};
/**
 * Handle button request from Device.
 * @param {Device} device
 * @param {string} code
 * @returns {Promise<void>}
 * @memberof Core
 */


var onDeviceButtonHandler =
/*#__PURE__*/
function () {
  var _ref4 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee4(device, code, method) {
    var addressRequest, data;
    return _regenerator.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            // wait for popup handshake
            addressRequest = code === 'ButtonRequest_Address';

            if (!(!addressRequest || addressRequest && method.useUi)) {
              _context4.next = 4;
              break;
            }

            _context4.next = 4;
            return getPopupPromise().promise;

          case 4:
            data = typeof method.getButtonRequestData === 'function' ? method.getButtonRequestData(code) : null; // request view

            postMessage(new _builder.DeviceMessage(DEVICE.BUTTON, {
              device: device.toMessageObject(),
              code: code
            }));
            postMessage(new _builder.UiMessage(UI.REQUEST_BUTTON, {
              device: device.toMessageObject(),
              code: code,
              data: data
            }));

            if (addressRequest && !method.useUi) {
              postMessage(new _builder.UiMessage(UI.ADDRESS_VALIDATION, data));
            }

          case 8:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function onDeviceButtonHandler(_x3, _x4, _x5) {
    return _ref4.apply(this, arguments);
  };
}();
/**
 * Handle pin request from Device.
 * @param {Device} device
 * @param {string} type
 * @param {Function} callback
 * @returns {Promise<void>}
 * @memberof Core
 */


var onDevicePinHandler =
/*#__PURE__*/
function () {
  var _ref5 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee5(device, type, callback) {
    var uiResp, pin;
    return _regenerator.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return getPopupPromise().promise;

          case 2:
            // request pin view
            postMessage(new _builder.UiMessage(UI.REQUEST_PIN, {
              device: device.toMessageObject()
            })); // wait for pin

            _context5.next = 5;
            return createUiPromise(UI.RECEIVE_PIN, device).promise;

          case 5:
            uiResp = _context5.sent;
            pin = uiResp.payload; // callback.apply(null, [null, pin]);

            callback(null, pin);

          case 8:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function onDevicePinHandler(_x6, _x7, _x8) {
    return _ref5.apply(this, arguments);
  };
}();

var onDeviceWordHandler =
/*#__PURE__*/
function () {
  var _ref6 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee6(device, type, callback) {
    var uiResp, word;
    return _regenerator.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return getPopupPromise().promise;

          case 2:
            postMessage(new _builder.UiMessage(UI.REQUEST_WORD, {
              device: device.toMessageObject(),
              type: type
            })); // wait for word

            _context6.next = 5;
            return createUiPromise(UI.RECEIVE_WORD, device).promise;

          case 5:
            uiResp = _context6.sent;
            word = uiResp.payload;
            callback(null, word);

          case 8:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function onDeviceWordHandler(_x9, _x10, _x11) {
    return _ref6.apply(this, arguments);
  };
}();
/**
 * Handle passphrase request from Device.
 * @param {Device} device
 * @param {Function} callback
 * @returns {Promise<void>}
 * @memberof Core
 */


var onDevicePassphraseHandler =
/*#__PURE__*/
function () {
  var _ref7 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee7(device, callback) {
    var cachedPassphrase, uiResp, value, cache;
    return _regenerator.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            cachedPassphrase = device.getPassphrase();

            if (!(typeof cachedPassphrase === 'string')) {
              _context7.next = 4;
              break;
            }

            callback(null, cachedPassphrase);
            return _context7.abrupt("return");

          case 4:
            _context7.next = 6;
            return getPopupPromise().promise;

          case 6:
            // request passphrase view
            postMessage(new _builder.UiMessage(UI.REQUEST_PASSPHRASE, {
              device: device.toMessageObject()
            })); // wait for passphrase

            _context7.next = 9;
            return createUiPromise(UI.RECEIVE_PASSPHRASE, device).promise;

          case 9:
            uiResp = _context7.sent;
            value = uiResp.payload.value;
            cache = uiResp.payload.save;
            device.setPassphrase(cache ? value : null);
            callback(null, value);

          case 14:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function onDevicePassphraseHandler(_x12, _x13) {
    return _ref7.apply(this, arguments);
  };
}();
/**
 * Handle passphrase request from Device and use empty
 * @param {Device} device
 * @param {Function} callback
 * @returns {Promise<void>}
 * @memberof Core
 */


var onEmptyPassphraseHandler =
/*#__PURE__*/
function () {
  var _ref8 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee8(device, callback) {
    return _regenerator.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            callback(null, '');

          case 1:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function onEmptyPassphraseHandler(_x14, _x15) {
    return _ref8.apply(this, arguments);
  };
}();
/**
 * Handle popup closed by user.
 * @returns {void}
 * @memberof Core
 */


var onPopupClosed = function onPopupClosed(customErrorMessage) {
  var error = customErrorMessage ? new Error(customErrorMessage) : ERROR.POPUP_CLOSED; // Device was already acquired. Try to interrupt running action which will throw error from onCall try/catch block

  if (_deviceList && _deviceList.asArray().length > 0) {
    _deviceList.allDevices().forEach(function (d) {
      if (d.isUsedHere()) {
        d.interruptionFromUser(error);
      } else {
        var uiPromise = findUiPromise(0, DEVICE.DISCONNECT);

        if (uiPromise) {
          uiPromise.resolve({
            event: error.message,
            payload: null
          });
        } else {
          _callMethods.forEach(function (m) {
            postMessage(new _builder.ResponseMessage(m.responseID, false, {
              error: error.message
            }));
          });

          _callMethods.splice(0, _callMethods.length);
        }
      }
    });

    cleanup(); // Waiting for device. Throw error before onCall try/catch block
  } else {
    if (_uiPromises.length > 0) {
      _uiPromises.forEach(function (p) {
        p.reject(error);
      });

      _uiPromises = [];
    }

    if (_popupPromise) {
      _popupPromise.reject(error);

      _popupPromise = null;
    }

    cleanup();
  }
};
/**
 * Handle DeviceList changes.
 * If there is uiPromise waiting for device selection update view.
 * Used in initDevice function
 * @param {DeviceTyped} interruptDevice
 * @returns {void}
 * @memberof Core
 */


var handleDeviceSelectionChanges = function handleDeviceSelectionChanges(interruptDevice) {
  if (interruptDevice === void 0) {
    interruptDevice = null;
  }

  // update list of devices in popup
  var uiPromise = findUiPromise(0, UI.RECEIVE_DEVICE);

  if (uiPromise && _deviceList) {
    var list = _deviceList.asArray();

    var isWebUsb = _deviceList.transportType().indexOf('webusb') >= 0;

    if (list.length === 1 && !isWebUsb) {
      // there is only one device. use it
      // resolve uiPromise to looks like it's a user choice (see: handleMessage function)
      uiPromise.resolve({
        event: UI.RECEIVE_DEVICE,
        payload: {
          device: list[0]
        }
      });
      removeUiPromise(uiPromise);
    } else {
      // update device selection list view
      postMessage(new _builder.UiMessage(UI.SELECT_DEVICE, {
        webusb: isWebUsb,
        devices: list
      }));
    }
  } // device was disconnected, interrupt pending uiPromises for this device


  if (interruptDevice) {
    var path = interruptDevice.path;
    var shouldClosePopup = false;

    _uiPromises.forEach(function (p) {
      if (p.device && p.device.getDevicePath() === path) {
        if (p.id === DEVICE.DISCONNECT) {
          p.resolve({
            event: DEVICE.DISCONNECT,
            payload: null
          });
        }

        shouldClosePopup = true;
      }
    });

    if (_preferredDevice && _preferredDevice.path === path) {
      _preferredDevice = null;
    }

    if (shouldClosePopup) {
      closePopup();
      cleanup();
    }
  }
};
/**
 * Start DeviceList with listeners.
 * @param {ConnectSettings} settings
 * @returns {Promise<void>}
 * @memberof Core
 */


var initDeviceList =
/*#__PURE__*/
function () {
  var _ref9 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee10(settings) {
    return _regenerator.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.prev = 0;
            _deviceList = new _DeviceList.default({
              rememberDevicePassphrase: true
            });

            _deviceList.on(DEVICE.CONNECT, function (device) {
              handleDeviceSelectionChanges();
              postMessage(new _builder.DeviceMessage(DEVICE.CONNECT, device));
            });

            _deviceList.on(DEVICE.CONNECT_UNACQUIRED, function (device) {
              handleDeviceSelectionChanges();
              postMessage(new _builder.DeviceMessage(DEVICE.CONNECT_UNACQUIRED, device));
            });

            _deviceList.on(DEVICE.DISCONNECT, function (device) {
              handleDeviceSelectionChanges(device);
              postMessage(new _builder.DeviceMessage(DEVICE.DISCONNECT, device));
            });

            _deviceList.on(DEVICE.CHANGED, function (device) {
              postMessage(new _builder.DeviceMessage(DEVICE.CHANGED, device));
            });

            _deviceList.on(TRANSPORT.ERROR,
            /*#__PURE__*/
            function () {
              var _ref10 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee9(error) {
                return _regenerator.default.wrap(function _callee9$(_context9) {
                  while (1) {
                    switch (_context9.prev = _context9.next) {
                      case 0:
                        _log.error('TRANSPORT ERROR', error);

                        if (_deviceList) {
                          _deviceList.disconnectDevices();

                          _deviceList.removeAllListeners();
                        }

                        _deviceList = null;
                        postMessage(new _builder.TransportMessage(TRANSPORT.ERROR, {
                          error: error.message || error,
                          bridge: _DataManager.default.getLatestBridgeVersion()
                        })); // if transport fails during app lifetime, try to reconnect

                        if (!settings.transportReconnect) {
                          _context9.next = 9;
                          break;
                        }

                        _context9.next = 7;
                        return (0, _promiseUtils.resolveAfter)(1000, null);

                      case 7:
                        _context9.next = 9;
                        return initDeviceList(settings);

                      case 9:
                      case "end":
                        return _context9.stop();
                    }
                  }
                }, _callee9, this);
              }));

              return function (_x17) {
                return _ref10.apply(this, arguments);
              };
            }());

            _deviceList.on(TRANSPORT.START, function (transportType) {
              return postMessage(new _builder.TransportMessage(TRANSPORT.START, transportType));
            });

            _context10.next = 10;
            return _deviceList.init();

          case 10:
            if (!_deviceList) {
              _context10.next = 13;
              break;
            }

            _context10.next = 13;
            return _deviceList.waitForTransportFirstEvent();

          case 13:
            _context10.next = 27;
            break;

          case 15:
            _context10.prev = 15;
            _context10.t0 = _context10["catch"](0);
            _deviceList = null;

            if (settings.transportReconnect) {
              _context10.next = 22;
              break;
            }

            throw _context10.t0;

          case 22:
            postMessage(new _builder.TransportMessage(TRANSPORT.ERROR, {
              error: _context10.t0.message || _context10.t0,
              bridge: _DataManager.default.getLatestBridgeVersion()
            }));
            _context10.next = 25;
            return (0, _promiseUtils.resolveAfter)(3000, null);

          case 25:
            _context10.next = 27;
            return initDeviceList(settings);

          case 27:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10, this, [[0, 15]]);
  }));

  return function initDeviceList(_x16) {
    return _ref9.apply(this, arguments);
  };
}();
/**
 * An event emitter for communication with parent
 * @extends EventEmitter
 * @memberof Core
 */


var Core =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inheritsLoose2.default)(Core, _EventEmitter);

  function Core() {
    return _EventEmitter.call(this) || this;
  }

  var _proto = Core.prototype;

  _proto.handleMessage = function handleMessage(message, isTrustedOrigin) {
    _handleMessage(message, isTrustedOrigin);
  };

  _proto.onBeforeUnload = function onBeforeUnload() {
    if (_deviceList) {
      _deviceList.onBeforeUnload();
    }

    this.removeAllListeners();
  };

  _proto.getCurrentMethod = function getCurrentMethod() {
    return _callMethods;
  };

  _proto.getTransportInfo = function getTransportInfo() {
    if (_deviceList) {
      return {
        type: _deviceList.transportType(),
        version: _deviceList.transportVersion(),
        outdated: _deviceList.transportOutdated(),
        bridge: _DataManager.default.getLatestBridgeVersion()
      };
    }

    return null;
  };

  return Core;
}(_events.default);
/**
 * Init instance of Core event emitter.
 * @returns {Core}
 * @memberof Core
 */


exports.Core = Core;

var initCore = function initCore() {
  _core = new Core();
  return _core;
};
/**
 * Module initialization.
 * This will download the config.json, start DeviceList, init Core emitter instance.
 * Returns Core, an event emitter instance.
 * @param {Object} settings - optional // TODO
 * @returns {Promise<Core>}
 * @memberof Core
 */


exports.initCore = initCore;

var initData =
/*#__PURE__*/
function () {
  var _ref11 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee11(settings) {
    return _regenerator.default.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.prev = 0;
            _context11.next = 3;
            return _DataManager.default.load(settings);

          case 3:
            _context11.next = 9;
            break;

          case 5:
            _context11.prev = 5;
            _context11.t0 = _context11["catch"](0);

            _log.log('init error', _context11.t0);

            throw _context11.t0;

          case 9:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11, this, [[0, 5]]);
  }));

  return function initData(_x18) {
    return _ref11.apply(this, arguments);
  };
}();

exports.initData = initData;

var init =
/*#__PURE__*/
function () {
  var _ref12 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee12(settings) {
    return _regenerator.default.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.prev = 0;
            _log.enabled = settings.debug;
            _context12.next = 4;
            return _DataManager.default.load(settings);

          case 4:
            _context12.next = 6;
            return initCore();

          case 6:
            return _context12.abrupt("return", _core);

          case 9:
            _context12.prev = 9;
            _context12.t0 = _context12["catch"](0);

            // TODO: kill app
            _log.log('init error', _context12.t0);

            throw _context12.t0;

          case 13:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12, this, [[0, 9]]);
  }));

  return function init(_x19) {
    return _ref12.apply(this, arguments);
  };
}();

exports.init = init;

var initTransport =
/*#__PURE__*/
function () {
  var _ref13 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee13(settings) {
    return _regenerator.default.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            _context13.prev = 0;

            if (settings.transportReconnect) {
              _context13.next = 6;
              break;
            }

            _context13.next = 4;
            return initDeviceList(settings);

          case 4:
            _context13.next = 7;
            break;

          case 6:
            // don't wait for DeviceList result, further communication will be thru TRANSPORT events
            initDeviceList(settings);

          case 7:
            _context13.next = 13;
            break;

          case 9:
            _context13.prev = 9;
            _context13.t0 = _context13["catch"](0);

            _log.log('initTransport', _context13.t0);

            throw _context13.t0;

          case 13:
          case "end":
            return _context13.stop();
        }
      }
    }, _callee13, this, [[0, 9]]);
  }));

  return function initTransport(_x20) {
    return _ref13.apply(this, arguments);
  };
}();

exports.initTransport = initTransport;

var reconnectTransport =
/*#__PURE__*/
function () {
  var _ref14 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee14() {
    return _regenerator.default.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            if (!_DataManager.default.getSettings('transportReconnect')) {
              _context14.next = 2;
              break;
            }

            return _context14.abrupt("return");

          case 2:
            _context14.prev = 2;
            _context14.next = 5;
            return initDeviceList(_DataManager.default.getSettings());

          case 5:
            _context14.next = 10;
            break;

          case 7:
            _context14.prev = 7;
            _context14.t0 = _context14["catch"](2);
            postMessage(new _builder.TransportMessage(TRANSPORT.ERROR, {
              error: _context14.t0.message || _context14.t0,
              bridge: _DataManager.default.getLatestBridgeVersion()
            }));

          case 10:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee14, this, [[2, 7]]);
  }));

  return function reconnectTransport() {
    return _ref14.apply(this, arguments);
  };
}();