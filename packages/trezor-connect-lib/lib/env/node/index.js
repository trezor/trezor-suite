"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.requestLogin = exports.customMessage = exports.getSettings = exports.renderWebUSBButton = exports.uiResponse = exports.call = exports.init = exports.cancel = exports.dispose = exports.manifest = exports.messagePromises = exports.eventEmitter = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _events = _interopRequireDefault(require("events"));

var _ConnectSettings = require("../../data/ConnectSettings");

var _debug = _interopRequireWildcard(require("../../utils/debug"));

var _browser = require("../../utils/browser");

var _Core = require("../../core/Core");

var _deferred = require("../../utils/deferred");

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

var _core;

var _messageID = 0;
var messagePromises = {};
exports.messagePromises = messagePromises;

var manifest = function manifest(data) {
  _settings = (0, _ConnectSettings.parse)({
    manifest: data
  });
};

exports.manifest = manifest;

var dispose = function dispose() {// iframe.dispose();
  // if (_popupManager) {
  //     _popupManager.close();
  // }
};

exports.dispose = dispose;

var cancel = function cancel() {// if (_popupManager) {
  //     _popupManager.emit(POPUP.CLOSED);
  // }
}; // handle message received from iframe


exports.cancel = cancel;

var handleMessage = function handleMessage(message) {
  // TODO: destructuring with type
  // https://github.com/Microsoft/TypeScript/issues/240
  var id = message.id || 0;
  var event = message.event;
  var type = message.type;
  var payload = message.payload;

  if (type === UI.REQUEST_UI_WINDOW) {
    _core.handleMessage({
      event: _constants.UI_EVENT,
      type: POPUP.HANDSHAKE
    }, true);

    return;
  }

  _log.log('handleMessage', message);

  switch (event) {
    case _constants.RESPONSE_EVENT:
      if (messagePromises[id]) {
        // clear unnecessary fields from message object
        delete message.type;
        delete message.event; // delete message.id;
        // message.__id = id;
        // resolve message promise (send result of call method)

        messagePromises[id].resolve(message);
        delete messagePromises[id];
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
      // pass UI event up
      eventEmitter.emit(event, message);
      eventEmitter.emit(type, payload);
      break;

    default:
      _log.log('Undefined message', event, message);

  }
};

var postMessage = function postMessage(message, usePromise) {
  if (usePromise === void 0) {
    usePromise = true;
  }

  if (!_core) {
    throw new Error('postMessage: _core not found');
  }

  if (usePromise) {
    _messageID++;
    message.id = _messageID;
    messagePromises[_messageID] = (0, _deferred.create)();

    _core.handleMessage(message, true);

    return messagePromises[_messageID].promise;
  }

  _core.handleMessage(message, true);

  return null;
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

            if (!_settings) {
              _settings = (0, _ConnectSettings.parse)(settings);
            } // set defaults for node


            _settings.origin = 'http://node.trezor.io/';
            _settings.popup = false;
            _settings.env = 'node';

            if (_settings.manifest) {
              _context.next = 7;
              break;
            }

            throw ERROR.MANIFEST_NOT_SET;

          case 7:
            if (_settings.supportedBrowser) {
              _context.next = 9;
              break;
            }

            throw ERROR.BROWSER_NOT_SUPPORTED;

          case 9:
            if (!_settings.lazyLoad) {
              _context.next = 12;
              break;
            }

            // reset "lazyLoad" after first use
            _settings.lazyLoad = false;
            return _context.abrupt("return");

          case 12:
            _log.enabled = _settings.debug; // instead of "checkBrowser"

            _browser.state.name = 'nodejs';
            _browser.state.supported = true;
            _context.next = 17;
            return (0, _Core.init)(_settings);

          case 17:
            _core = _context.sent;

            _core.on(_constants.CORE_EVENT, handleMessage);

            _context.next = 21;
            return (0, _Core.initTransport)(_settings);

          case 21:
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
            if (_core) {
              _context2.next = 10;
              break;
            }

            _settings = (0, _ConnectSettings.parse)({
              debug: false,
              popup: false
            }); // auto init with default settings

            _context2.prev = 2;
            _context2.next = 5;
            return init(_settings);

          case 5:
            _context2.next = 10;
            break;

          case 7:
            _context2.prev = 7;
            _context2.t0 = _context2["catch"](2);
            return _context2.abrupt("return", {
              success: false,
              payload: {
                error: _context2.t0
              }
            });

          case 10:
            _context2.prev = 10;
            _context2.next = 13;
            return postMessage({
              type: IFRAME.CALL,
              payload: params
            });

          case 13:
            response = _context2.sent;

            if (!response) {
              _context2.next = 18;
              break;
            }

            return _context2.abrupt("return", response);

          case 18:
            return _context2.abrupt("return", {
              success: false,
              payload: {
                error: 'No response from iframe'
              }
            });

          case 19:
            _context2.next = 25;
            break;

          case 21:
            _context2.prev = 21;
            _context2.t1 = _context2["catch"](10);

            _log.error('__call error', _context2.t1);

            return _context2.abrupt("return", _context2.t1);

          case 25:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[2, 7], [10, 21]]);
  }));

  return function call(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

exports.call = call;

var customMessageResponse = function customMessageResponse(payload) {
  _core.handleMessage({
    event: _constants.UI_EVENT,
    type: UI.CUSTOM_MESSAGE_RESPONSE,
    payload: payload
  }, true);
};

var uiResponse = function uiResponse(response) {
  _core.handleMessage((0, _objectSpread2.default)({
    event: _constants.UI_EVENT
  }, response), true);
};

exports.uiResponse = uiResponse;

var renderWebUSBButton = function renderWebUSBButton(className) {// webUSBButton(className, _settings.webusbSrc, iframe.origin);
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
            if (_core) {
              _context3.next = 2;
              break;
            }

            return _context3.abrupt("return", {
              success: false,
              payload: {
                error: 'Core not initialized yet, you need to call TrezorConnect.init or any other method first.'
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

            _core.on(_constants.CORE_EVENT, customMessageListener);

            _context5.next = 8;
            return call((0, _objectSpread2.default)({
              method: 'customMessage'
            }, params));

          case 8:
            response = _context5.sent;

            _core.removeListener(_constants.CORE_EVENT, customMessageListener);

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

                        _core.handleMessage({
                          event: _constants.UI_EVENT,
                          type: UI.LOGIN_CHALLENGE_RESPONSE,
                          payload: payload
                        }, true);

                        _context6.next = 13;
                        break;

                      case 9:
                        _context6.prev = 9;
                        _context6.t0 = _context6["catch"](2);
                        console.warn('TrezorConnect.requestLogin: callback error', _context6.t0);

                        _core.handleMessage({
                          event: _constants.UI_EVENT,
                          type: UI.LOGIN_CHALLENGE_RESPONSE,
                          payload: _context6.t0.message
                        }, true);

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

            _core.on(_constants.CORE_EVENT, loginChallengeListener);

            _context7.next = 7;
            return call((0, _objectSpread2.default)({
              method: 'requestLogin'
            }, params, {
              asyncChallenge: true
            }));

          case 7:
            response = _context7.sent;

            _core.removeListener(_constants.CORE_EVENT, loginChallengeListener);

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