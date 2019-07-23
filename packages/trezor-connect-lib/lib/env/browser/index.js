"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.requestLogin = exports.customMessage = exports.getSettings = exports.renderWebUSBButton = exports.uiResponse = exports.call = exports.init = exports.cancel = exports.dispose = exports.manifest = exports.eventEmitter = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _events = _interopRequireDefault(require("events"));

var _PopupManager = _interopRequireDefault(require("../../popup/PopupManager"));

var iframe = _interopRequireWildcard(require("../../iframe/builder"));

var _button = _interopRequireDefault(require("../../webusb/button"));

var _message = require("../../message");

var _ConnectSettings = require("../../data/ConnectSettings");

var _debug = _interopRequireWildcard(require("../../utils/debug"));

var _constants = require("../../constants");

var POPUP = _interopRequireWildcard(require("../../constants/popup"));

var IFRAME = _interopRequireWildcard(require("../../constants/iframe"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var ERROR = _interopRequireWildcard(require("../../constants/errors"));

var $T = _interopRequireWildcard(require("../../types"));

var eventEmitter = new _events.default();
exports.eventEmitter = eventEmitter;

var _log = (0, _debug.init)('[trezor-connect.js]');

var _settings;

var _popupManager;

var initPopupManager = function initPopupManager() {
  var pm = new _PopupManager.default(_settings);
  pm.on(POPUP.CLOSED, function () {
    iframe.postMessage({
      type: POPUP.CLOSED
    }, false);
  });
  return pm;
};

var manifest = function manifest(data) {
  _settings = (0, _ConnectSettings.parse)({
    manifest: data
  });
};

exports.manifest = manifest;

var dispose = function dispose() {
  iframe.dispose();

  if (_popupManager) {
    _popupManager.close();
  }
};

exports.dispose = dispose;

var cancel = function cancel() {
  if (_popupManager) {
    _popupManager.emit(POPUP.CLOSED);
  }
}; // handle message received from iframe


exports.cancel = cancel;

var handleMessage = function handleMessage(messageEvent) {
  // ignore messages from domain other then iframe origin
  if (messageEvent.origin !== iframe.origin) return;
  var message = (0, _message.parseMessage)(messageEvent.data); // TODO: destructuring with type
  // https://github.com/Microsoft/TypeScript/issues/240
  // const { id, event, type, data, error }: CoreMessage = message;

  var id = message.id || 0;
  var event = message.event;
  var type = message.type;
  var payload = message.payload;

  _log.log('handleMessage', message);

  switch (event) {
    case _constants.RESPONSE_EVENT:
      if (iframe.messagePromises[id]) {
        // clear unnecessary fields from message object
        delete message.type;
        delete message.event; // delete message.id;
        // message.__id = id;
        // resolve message promise (send result of call method)

        iframe.messagePromises[id].resolve(message);
        delete iframe.messagePromises[id];
      } else {
        _log.warn("Unknown message id " + id);
      }

      break;

    case _constants.DEVICE_EVENT:
      // pass DEVICE event up to html
      eventEmitter.emit(event, message);
      eventEmitter.emit(type, payload); // DEVICE_EVENT also emit single events (connect/disconnect...)

      break;

    case _constants.TRANSPORT_EVENT:
      eventEmitter.emit(event, message);
      eventEmitter.emit(type, payload);
      break;

    case _constants.BLOCKCHAIN_EVENT:
      eventEmitter.emit(event, message);
      eventEmitter.emit(type, payload);
      break;

    case _constants.UI_EVENT:
      if (type === IFRAME.BOOTSTRAP) {
        iframe.clearTimeout();
        break;
      }

      if (type === IFRAME.LOADED) {
        iframe.initPromise.resolve();
      }

      if (type === IFRAME.ERROR) {
        iframe.initPromise.reject(new Error(payload.error));
      } // pass UI event up


      eventEmitter.emit(event, message);
      eventEmitter.emit(type, payload);
      break;

    default:
      _log.log('Undefined message', event, messageEvent);

  }
};

var init =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(settings) {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (settings === void 0) {
              settings = {};
            }

            if (!iframe.instance) {
              _context.next = 3;
              break;
            }

            throw ERROR.IFRAME_INITIALIZED;

          case 3:
            if (!_settings) {
              _settings = (0, _ConnectSettings.parse)(settings);
            }

            if (_settings.manifest) {
              _context.next = 6;
              break;
            }

            throw ERROR.MANIFEST_NOT_SET;

          case 6:
            if (_settings.supportedBrowser) {
              _context.next = 8;
              break;
            }

            throw ERROR.BROWSER_NOT_SUPPORTED;

          case 8:
            if (!_settings.lazyLoad) {
              _context.next = 11;
              break;
            }

            // reset "lazyLoad" after first use
            _settings.lazyLoad = false;
            return _context.abrupt("return");

          case 11:
            if (!_popupManager) {
              _popupManager = initPopupManager();
            }

            _log.enabled = _settings.debug;
            window.addEventListener('message', handleMessage);
            window.addEventListener('beforeunload', dispose);
            _context.next = 17;
            return iframe.init(_settings);

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function init(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.init = init;

var call =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(params) {
    var response;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (!(!iframe.instance && !iframe.timeout)) {
              _context2.next = 17;
              break;
            }

            // init popup with lazy loading before iframe initialization
            _settings = (0, _ConnectSettings.parse)(_settings);

            if (_settings.manifest) {
              _context2.next = 4;
              break;
            }

            return _context2.abrupt("return", {
              success: false,
              payload: {
                error: ERROR.MANIFEST_NOT_SET.message
              }
            });

          case 4:
            if (_settings.supportedBrowser) {
              _context2.next = 6;
              break;
            }

            return _context2.abrupt("return", {
              success: false,
              payload: {
                error: ERROR.BROWSER_NOT_SUPPORTED.message
              }
            });

          case 6:
            if (!_popupManager) {
              _popupManager = initPopupManager();
            }

            _popupManager.request(true); // auto init with default settings


            _context2.prev = 8;
            _context2.next = 11;
            return init(_settings);

          case 11:
            _context2.next = 17;
            break;

          case 13:
            _context2.prev = 13;
            _context2.t0 = _context2["catch"](8);

            if (_popupManager) {
              _popupManager.close();
            }

            return _context2.abrupt("return", {
              success: false,
              payload: {
                error: _context2.t0
              }
            });

          case 17:
            if (!iframe.timeout) {
              _context2.next = 21;
              break;
            }

            return _context2.abrupt("return", {
              success: false,
              payload: {
                error: ERROR.NO_IFRAME.message
              }
            });

          case 21:
            if (!iframe.error) {
              _context2.next = 23;
              break;
            }

            return _context2.abrupt("return", {
              success: false,
              payload: {
                error: iframe.error
              }
            });

          case 23:
            // request popup window it might be used in the future
            if (_settings.popup && _popupManager) {
              _popupManager.request();
            } // post message to iframe


            _context2.prev = 24;
            _context2.next = 27;
            return iframe.postMessage({
              type: IFRAME.CALL,
              payload: params
            });

          case 27:
            response = _context2.sent;

            if (!response) {
              _context2.next = 33;
              break;
            }

            // TODO: unlock popupManager request only if there wasn't error "in progress"
            if (response.payload.error !== ERROR.DEVICE_CALL_IN_PROGRESS.message && _popupManager) {
              _popupManager.unlock();
            }

            return _context2.abrupt("return", response);

          case 33:
            if (_popupManager) {
              _popupManager.unlock();
            }

            return _context2.abrupt("return", {
              success: false,
              payload: {
                error: 'No response from iframe'
              }
            });

          case 35:
            _context2.next = 41;
            break;

          case 37:
            _context2.prev = 37;
            _context2.t1 = _context2["catch"](24);

            _log.error('__call error', _context2.t1);

            return _context2.abrupt("return", _context2.t1);

          case 41:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[8, 13], [24, 37]]);
  }));

  return function call(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

exports.call = call;

var customMessageResponse = function customMessageResponse(payload) {
  iframe.postMessage({
    event: _constants.UI_EVENT,
    type: UI.CUSTOM_MESSAGE_RESPONSE,
    payload: payload
  });
};

var uiResponse = function uiResponse(response) {
  iframe.postMessage((0, _objectSpread2.default)({
    event: _constants.UI_EVENT
  }, response));
};

exports.uiResponse = uiResponse;

var renderWebUSBButton = function renderWebUSBButton(className) {
  (0, _button.default)(className, _settings.webusbSrc, iframe.origin);
};

exports.renderWebUSBButton = renderWebUSBButton;

var getSettings =
/*#__PURE__*/
function () {
  var _ref3 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3() {
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (iframe.instance) {
              _context3.next = 2;
              break;
            }

            return _context3.abrupt("return", {
              success: false,
              payload: {
                error: 'Iframe not initialized yet, you need to call TrezorConnect.init or any other method first.'
              }
            });

          case 2:
            _context3.next = 4;
            return call({
              method: 'getSettings'
            });

          case 4:
            return _context3.abrupt("return", _context3.sent);

          case 5:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function getSettings() {
    return _ref3.apply(this, arguments);
  };
}();

exports.getSettings = getSettings;

var customMessage =
/*#__PURE__*/
function () {
  var _ref4 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee5(params) {
    var callback, customMessageListener, response;
    return _regenerator.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            if (!(typeof params.callback !== 'function')) {
              _context5.next = 2;
              break;
            }

            return _context5.abrupt("return", {
              success: false,
              payload: {
                error: 'Parameter "callback" is not a function'
              }
            });

          case 2:
            // TODO: set message listener only if iframe is loaded correctly
            callback = params.callback;
            delete params.callback;

            customMessageListener =
            /*#__PURE__*/
            function () {
              var _ref5 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee4(event) {
                var data, payload;
                return _regenerator.default.wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        data = event.data;

                        if (!(data && data.type === UI.CUSTOM_MESSAGE_REQUEST)) {
                          _context4.next = 6;
                          break;
                        }

                        _context4.next = 4;
                        return callback(data.payload);

                      case 4:
                        payload = _context4.sent;

                        if (payload) {
                          customMessageResponse(payload);
                        } else {
                          customMessageResponse({
                            message: 'release'
                          });
                        }

                      case 6:
                      case "end":
                        return _context4.stop();
                    }
                  }
                }, _callee4, this);
              }));

              return function customMessageListener(_x4) {
                return _ref5.apply(this, arguments);
              };
            }();

            window.addEventListener('message', customMessageListener, false);
            _context5.next = 8;
            return call((0, _objectSpread2.default)({
              method: 'customMessage'
            }, params));

          case 8:
            response = _context5.sent;
            window.removeEventListener('message', customMessageListener);
            return _context5.abrupt("return", response);

          case 11:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function customMessage(_x3) {
    return _ref4.apply(this, arguments);
  };
}();

exports.customMessage = customMessage;

var requestLogin =
/*#__PURE__*/
function () {
  var _ref6 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee7(params) {
    var callback, loginChallengeListener, response;
    return _regenerator.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            if (!(typeof params.callback === 'function')) {
              _context7.next = 12;
              break;
            }

            callback = params.callback;
            delete params.callback; // delete callback value. this field cannot be sent using postMessage function
            // TODO: set message listener only if iframe is loaded correctly

            loginChallengeListener =
            /*#__PURE__*/
            function () {
              var _ref7 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee6(event) {
                var data, payload;
                return _regenerator.default.wrap(function _callee6$(_context6) {
                  while (1) {
                    switch (_context6.prev = _context6.next) {
                      case 0:
                        data = event.data;

                        if (!(data && data.type === UI.LOGIN_CHALLENGE_REQUEST)) {
                          _context6.next = 13;
                          break;
                        }

                        _context6.prev = 2;
                        _context6.next = 5;
                        return callback();

                      case 5:
                        payload = _context6.sent;
                        iframe.postMessage({
                          event: _constants.UI_EVENT,
                          type: UI.LOGIN_CHALLENGE_RESPONSE,
                          payload: payload
                        });
                        _context6.next = 13;
                        break;

                      case 9:
                        _context6.prev = 9;
                        _context6.t0 = _context6["catch"](2);
                        console.warn('TrezorConnect.requestLogin: callback error', _context6.t0);
                        iframe.postMessage({
                          event: _constants.UI_EVENT,
                          type: UI.LOGIN_CHALLENGE_RESPONSE,
                          payload: _context6.t0.message
                        });

                      case 13:
                      case "end":
                        return _context6.stop();
                    }
                  }
                }, _callee6, this, [[2, 9]]);
              }));

              return function loginChallengeListener(_x6) {
                return _ref7.apply(this, arguments);
              };
            }();

            window.addEventListener('message', loginChallengeListener, false);
            _context7.next = 7;
            return call((0, _objectSpread2.default)({
              method: 'requestLogin'
            }, params, {
              asyncChallenge: true
            }));

          case 7:
            response = _context7.sent;
            window.removeEventListener('message', loginChallengeListener);
            return _context7.abrupt("return", response);

          case 12:
            _context7.next = 14;
            return call((0, _objectSpread2.default)({
              method: 'requestLogin'
            }, params));

          case 14:
            return _context7.abrupt("return", _context7.sent);

          case 15:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function requestLogin(_x5) {
    return _ref6.apply(this, arguments);
  };
}();

exports.requestLogin = requestLogin;