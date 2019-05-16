"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _constants = require("../constants");

var POPUP = _interopRequireWildcard(require("../constants/popup"));

var IFRAME = _interopRequireWildcard(require("../constants/iframe"));

var UI = _interopRequireWildcard(require("../constants/ui"));

var _ConnectSettings = require("../data/ConnectSettings");

var _DataManager = _interopRequireDefault(require("../data/DataManager"));

var _Core = require("../core/Core");

var _message = require("../message");

var _builder = require("../message/builder");

var _debug = _interopRequireWildcard(require("../utils/debug"));

var _windowsUtils = require("../utils/windowsUtils");

var _browser = require("../utils/browser");

var _networkUtils = require("../utils/networkUtils");

var _storage = require("./storage");

var _core; // custom log


var _log = (0, _debug.init)('IFrame');

var _popupMessagePort; // Wrapper which listen events from Core
// since iframe.html needs to send message via window.postMessage
// we need to listen events from Core and convert it to simple objects possible to send over window.postMessage


var handleMessage = function handleMessage(event) {
  // ignore messages from myself (chrome bug?)
  if (event.source === window || !event.data) return;
  var data = event.data;
  var id = typeof data.id === 'number' ? data.id : 0;

  var fail = function fail(error) {
    // eslint-disable-next-line no-use-before-define
    postMessage(new _builder.ResponseMessage(id, false, {
      error: error
    })); // eslint-disable-next-line no-use-before-define

    postMessage(new _builder.UiMessage(POPUP.CANCEL_POPUP_REQUEST));
  }; // respond to call
  // TODO: instead of error _core should be initialized automatically


  if (!_core && data.type === IFRAME.CALL) {
    fail('Core not initialized yet!');
    return;
  } // catch first message from window.opener


  if (data.type === IFRAME.INIT) {
    // eslint-disable-next-line no-use-before-define
    init(data.payload, event.origin);
    return;
  } // popup handshake initialization process, get reference to message channel


  if (data.type === POPUP.HANDSHAKE && event.origin === window.location.origin) {
    if (!_popupMessagePort) {
      fail('POPUP.OPENED: popupMessagePort not found');
      return;
    }

    if (!_core) {
      fail('POPUP.OPENED: Core not initialized');
      return;
    }

    if (_popupMessagePort instanceof MessagePort) {
      if (event.ports.length < 1) {
        fail('POPUP.OPENED: event.ports not found');
        return;
      }

      _popupMessagePort = event.ports[0];
    }

    var method = _core.getCurrentMethod()[0]; // eslint-disable-next-line no-use-before-define


    postMessage(new _builder.UiMessage(POPUP.HANDSHAKE, {
      settings: _DataManager.default.getSettings(),
      transport: _core.getTransportInfo(),
      method: method ? method.info : null
    }));
  } // clear reference to popup MessagePort


  if (data.type === POPUP.CLOSED) {
    if (_popupMessagePort instanceof MessagePort) {
      _popupMessagePort = null;
    }
  } // is message from popup or extension


  var whitelist = _DataManager.default.isWhitelisted(event.origin);

  var isTrustedDomain = event.origin === window.location.origin || !!whitelist; // ignore messages from domain other then parent.window or popup.window or chrome extension

  var eventOrigin = (0, _networkUtils.getOrigin)(event.origin);
  if (!isTrustedDomain && eventOrigin !== _DataManager.default.getSettings('origin') && eventOrigin !== (0, _networkUtils.getOrigin)(document.referrer)) return;
  var message = (0, _message.parseMessage)(data); // prevent from passing event up

  event.preventDefault();
  event.stopImmediatePropagation(); // pass data to Core

  _core.handleMessage(message, isTrustedDomain);
}; // communication with parent window


var postMessage = function postMessage(message) {
  _log.debug('postMessage', message);

  var usingPopup = _DataManager.default.getSettings('popup');

  var trustedHost = _DataManager.default.getSettings('trustedHost');

  var handshake = message.type === IFRAME.LOADED; // popup handshake is resolved automatically

  if (!usingPopup) {
    if (message.type === UI.REQUEST_UI_WINDOW) {
      _core.handleMessage({
        event: _constants.UI_EVENT,
        type: POPUP.HANDSHAKE
      }, true);

      return;
    } else if (message.type === POPUP.CANCEL_POPUP_REQUEST) {
      return;
    }
  }

  if (!trustedHost && !handshake && message.event === _constants.TRANSPORT_EVENT) {
    return;
  } // check if permissions to read from device is granted
  // eslint-disable-next-line no-use-before-define


  if (!trustedHost && message.event === _constants.DEVICE_EVENT && !filterDeviceEvent(message)) {
    return;
  } // eslint-disable-next-line no-use-before-define


  if (usingPopup && targetUiEvent(message)) {
    if (_popupMessagePort) {
      _popupMessagePort.postMessage(message);
    } else {
      console.warn('iframe postMessage: popupMessagePort not found');
    }
  } else {
    var origin = _DataManager.default.getSettings('origin');

    if (!origin || origin.indexOf('file://') >= 0) origin = '*';
    (0, _windowsUtils.sendMessage)(message, origin);
  }
};

var targetUiEvent = function targetUiEvent(message) {
  var whitelistedMessages = [IFRAME.LOADED, IFRAME.ERROR, POPUP.CANCEL_POPUP_REQUEST, UI.CLOSE_UI_WINDOW, UI.CUSTOM_MESSAGE_REQUEST, UI.LOGIN_CHALLENGE_REQUEST, UI.BUNDLE_PROGRESS, UI.ADDRESS_VALIDATION];
  return message.event === _constants.UI_EVENT && whitelistedMessages.indexOf(message.type) < 0;
};

var filterDeviceEvent = function filterDeviceEvent(message) {
  if (!message.payload) return false; // const features: any = message.payload.device ? message.payload.device.features : message.payload.features;
  // exclude button/pin/passphrase events

  var features = message.payload.features;

  if (features) {
    var savedPermissions = (0, _storage.load)(_storage.PERMISSIONS_KEY) || (0, _storage.load)(_storage.PERMISSIONS_KEY, true);

    if (savedPermissions && Array.isArray(savedPermissions)) {
      var devicePermissions = savedPermissions.filter(function (p) {
        return p.origin === _DataManager.default.getSettings('origin') && p.type === 'read' && p.device === features.device_id;
      });
      return devicePermissions.length > 0;
    }
  }

  return false;
};

var init =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(payload, origin) {
    var parsedSettings, broadcastID;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!_DataManager.default.getSettings('origin')) {
              _context.next = 2;
              break;
            }

            return _context.abrupt("return");

          case 2:
            // already initialized
            parsedSettings = (0, _ConnectSettings.parse)((0, _objectSpread2.default)({}, payload.settings, {
              extension: payload.extension
            })); // set origin manually

            parsedSettings.origin = !origin || origin === 'null' ? payload.settings.origin : origin;

            if (parsedSettings.popup && typeof BroadcastChannel !== 'undefined') {
              // && parsedSettings.env !== 'web'
              broadcastID = parsedSettings.env + "-" + parsedSettings.timestamp;
              _popupMessagePort = new BroadcastChannel(broadcastID);

              _popupMessagePort.onmessage = function (message) {
                return handleMessage(message);
              };
            }

            _log.enabled = parsedSettings.debug;
            _context.prev = 6;
            _context.next = 9;
            return (0, _Core.init)(parsedSettings);

          case 9:
            _core = _context.sent;

            _core.on(_constants.CORE_EVENT, postMessage); // check if browser is supported


            (0, _browser.checkBrowser)();

            if (!_browser.state.supported) {
              _context.next = 15;
              break;
            }

            _context.next = 15;
            return (0, _Core.initTransport)(parsedSettings);

          case 15:
            postMessage(new _builder.UiMessage(IFRAME.LOADED, {
              browser: _browser.state
            }));
            _context.next = 21;
            break;

          case 18:
            _context.prev = 18;
            _context.t0 = _context["catch"](6);
            postMessage(new _builder.UiMessage(IFRAME.ERROR, {
              browser: _browser.state,
              error: _context.t0.message
            }));

          case 21:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[6, 18]]);
  }));

  return function init(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

window.addEventListener('message', handleMessage, false);
window.addEventListener('beforeunload', function () {
  if (_core) {
    _core.onBeforeUnload();
  }
});