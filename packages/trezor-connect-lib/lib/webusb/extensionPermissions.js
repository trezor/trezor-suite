"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _networkUtils = require("../utils/networkUtils");

var _windowsUtils = require("../utils/windowsUtils");

var _popup = _interopRequireDefault(require("../../styles/popup.less"));

// eslint-disable-next-line no-unused-vars
var config;

var onLoad =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _networkUtils.httpRequest)('./data/config.json', 'json');

          case 2:
            config = _context.sent;
            (0, _windowsUtils.sendMessage)('usb-permissions-init', '*');

          case 4:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function onLoad() {
    return _ref.apply(this, arguments);
  };
}();

var init = function init(label) {
  var extensionName = document.getElementsByClassName('extension-name')[0];
  extensionName.innerText = label;
  var usbButton = document.getElementsByClassName('confirm')[0];
  var cancelButton = document.getElementsByClassName('cancel')[0];
  usbButton.onclick =
  /*#__PURE__*/
  (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2() {
    var filters, usb;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            filters = config.webusb.map(function (desc) {
              return {
                vendorId: parseInt(desc.vendorId),
                productId: parseInt(desc.productId)
              };
            });
            usb = navigator.usb;

            if (!usb) {
              _context2.next = 12;
              break;
            }

            _context2.prev = 3;
            _context2.next = 6;
            return usb.requestDevice({
              filters: filters
            });

          case 6:
            (0, _windowsUtils.sendMessage)('usb-permissions-close', '*');
            _context2.next = 12;
            break;

          case 9:
            _context2.prev = 9;
            _context2.t0 = _context2["catch"](3);
            console.warn('Webusb error', _context2.t0);

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[3, 9]]);
  }));

  cancelButton.onclick = function () {
    (0, _windowsUtils.sendMessage)('usb-permissions-close', '*');
  };
};

var handleMessage = function handleMessage(message) {
  var data = message.data;

  if (data && data.type === 'usb-permissions-init') {
    window.removeEventListener('message', handleMessage, false);
    var knownHost = config.knownHosts.find(function (host) {
      return host.origin === data.extension;
    });
    var label = knownHost && knownHost.label ? knownHost.label : message.origin;
    init(label);
  }
};

window.addEventListener('load', onLoad, false);
window.addEventListener('message', handleMessage, false);