"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _networkUtils = require("../utils/networkUtils");

var _webusb = _interopRequireDefault(require("../../styles/webusb.less"));

// eslint-disable-next-line no-unused-vars
// handle message received from connect.js
var handleMessage =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(event) {
    var data, exists, config, filters, button, css, _arr, _i, key;

    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (event.data) {
              _context2.next = 2;
              break;
            }

            return _context2.abrupt("return");

          case 2:
            data = event.data;
            exists = document.getElementsByTagName('button');

            if (!(exists && exists.length > 0)) {
              _context2.next = 6;
              break;
            }

            return _context2.abrupt("return");

          case 6:
            _context2.next = 8;
            return (0, _networkUtils.httpRequest)('./data/config.json', 'json');

          case 8:
            config = _context2.sent;
            filters = config.webusb.map(function (desc) {
              return {
                vendorId: parseInt(desc.vendorId),
                productId: parseInt(desc.productId)
              };
            });
            button = document.createElement('button');

            if (data.style) {
              css = JSON.parse(data.style);
              _arr = Object.keys(css);

              for (_i = 0; _i < _arr.length; _i++) {
                key = _arr[_i];

                if (button.style.hasOwnProperty(key)) {
                  button.style.setProperty(key, css[key]);
                }
              }
            } else {
              button.className = 'default';
            }

            button.onclick =
            /*#__PURE__*/
            (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee() {
              var usb;
              return _regenerator.default.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      usb = navigator.usb;

                      if (!usb) {
                        _context.next = 10;
                        break;
                      }

                      _context.prev = 2;
                      _context.next = 5;
                      return usb.requestDevice({
                        filters: filters
                      });

                    case 5:
                      _context.next = 10;
                      break;

                    case 7:
                      _context.prev = 7;
                      _context.t0 = _context["catch"](2);
                      console.warn('Webusb error', _context.t0);

                    case 10:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this, [[2, 7]]);
            }));

            if (document.body) {
              document.body.append(button);
            }

          case 14:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function handleMessage(_x) {
    return _ref.apply(this, arguments);
  };
}();

window.addEventListener('message', handleMessage);