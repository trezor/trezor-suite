"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
var _exportNames = {
  UI_EVENT: true,
  DEVICE_EVENT: true,
  RESPONSE_EVENT: true,
  TRANSPORT_EVENT: true,
  BLOCKCHAIN_EVENT: true,
  TRANSPORT: true,
  IFRAME: true,
  UI: true,
  DEVICE: true,
  BLOCKCHAIN: true
};
exports.BLOCKCHAIN = exports.DEVICE = exports.UI = exports.IFRAME = exports.TRANSPORT = exports.default = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _constants = require("./constants");

exports.UI_EVENT = _constants.UI_EVENT;
exports.DEVICE_EVENT = _constants.DEVICE_EVENT;
exports.RESPONSE_EVENT = _constants.RESPONSE_EVENT;
exports.TRANSPORT_EVENT = _constants.TRANSPORT_EVENT;
exports.BLOCKCHAIN_EVENT = _constants.BLOCKCHAIN_EVENT;

var TRANSPORT = _interopRequireWildcard(require("./constants/transport"));

exports.TRANSPORT = TRANSPORT;

var IFRAME = _interopRequireWildcard(require("./constants/iframe"));

exports.IFRAME = IFRAME;

var UI = _interopRequireWildcard(require("./constants/ui"));

exports.UI = UI;

var DEVICE = _interopRequireWildcard(require("./constants/device"));

exports.DEVICE = DEVICE;

var BLOCKCHAIN = _interopRequireWildcard(require("./constants/blockchain"));

exports.BLOCKCHAIN = BLOCKCHAIN;

var $T = _interopRequireWildcard(require("./types"));

var _node = require("./env/node");

var _blockchainEvent = require("./types/blockchainEvent");

Object.keys(_blockchainEvent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  exports[key] = _blockchainEvent[key];
});

var _account = require("./types/account");

Object.keys(_account).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  exports[key] = _account[key];
});

var TrezorConnect = function TrezorConnect() {};

(0, _defineProperty2.default)(TrezorConnect, "manifest", function (data) {
  (0, _node.manifest)(data);
});
(0, _defineProperty2.default)(TrezorConnect, "getSettings",
/*#__PURE__*/
(0, _asyncToGenerator2.default)(
/*#__PURE__*/
_regenerator.default.mark(function _callee() {
  return _regenerator.default.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return (0, _node.getSettings)();

        case 2:
          return _context.abrupt("return", _context.sent);

        case 3:
        case "end":
          return _context.stop();
      }
    }
  }, _callee, this);
})));
(0, _defineProperty2.default)(TrezorConnect, "init",
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(settings) {
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return (0, _node.init)(settings);

          case 2:
            return _context2.abrupt("return", _context2.sent);

          case 3:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function (_x) {
    return _ref2.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "on", function (type, fn) {
  _node.eventEmitter.on(type, fn);
});
(0, _defineProperty2.default)(TrezorConnect, "off", function (type, fn) {
  _node.eventEmitter.removeListener(type, fn);
});
(0, _defineProperty2.default)(TrezorConnect, "uiResponse", function (response) {
  (0, _node.uiResponse)(response);
});
(0, _defineProperty2.default)(TrezorConnect, "blockchainDisconnect",
/*#__PURE__*/
function () {
  var _ref3 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(params) {
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'blockchainDisconnect'
            }, params));

          case 2:
            return _context3.abrupt("return", _context3.sent);

          case 3:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function (_x2) {
    return _ref3.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "blockchainEstimateFee",
/*#__PURE__*/
function () {
  var _ref4 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee4(params) {
    return _regenerator.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'blockchainEstimateFee'
            }, params));

          case 2:
            return _context4.abrupt("return", _context4.sent);

          case 3:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function (_x3) {
    return _ref4.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "blockchainSubscribe",
/*#__PURE__*/
function () {
  var _ref5 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee5(params) {
    return _regenerator.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'blockchainSubscribe'
            }, params));

          case 2:
            return _context5.abrupt("return", _context5.sent);

          case 3:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function (_x4) {
    return _ref5.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "blockchainUnsubscribe",
/*#__PURE__*/
function () {
  var _ref6 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee6(params) {
    return _regenerator.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'blockchainUnsubscribe'
            }, params));

          case 2:
            return _context6.abrupt("return", _context6.sent);

          case 3:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function (_x5) {
    return _ref6.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "customMessage",
/*#__PURE__*/
function () {
  var _ref7 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee7(params) {
    return _regenerator.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return (0, _node.customMessage)(params);

          case 2:
            return _context7.abrupt("return", _context7.sent);

          case 3:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function (_x6) {
    return _ref7.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "requestLogin",
/*#__PURE__*/
function () {
  var _ref8 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee8(params) {
    return _regenerator.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return (0, _node.requestLogin)(params);

          case 2:
            return _context8.abrupt("return", _context8.sent);

          case 3:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function (_x7) {
    return _ref8.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "resetDevice",
/*#__PURE__*/
function () {
  var _ref9 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee9(params) {
    return _regenerator.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'resetDevice'
            }, params));

          case 2:
            return _context9.abrupt("return", _context9.sent);

          case 3:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, this);
  }));

  return function (_x8) {
    return _ref9.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "cardanoGetAddress",
/*#__PURE__*/
function () {
  var _ref10 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee10(params) {
    var useEventListener;
    return _regenerator.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            _context10.next = 3;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'cardanoGetAddress'
            }, params, {
              useEventListener: useEventListener
            }));

          case 3:
            return _context10.abrupt("return", _context10.sent);

          case 4:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));

  return function (_x9) {
    return _ref10.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "cardanoGetPublicKey",
/*#__PURE__*/
function () {
  var _ref11 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee11(params) {
    return _regenerator.default.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'cardanoGetPublicKey'
            }, params));

          case 2:
            return _context11.abrupt("return", _context11.sent);

          case 3:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11, this);
  }));

  return function (_x10) {
    return _ref11.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "cardanoSignTransaction",
/*#__PURE__*/
function () {
  var _ref12 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee12(params) {
    return _regenerator.default.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'cardanoSignTransaction'
            }, params));

          case 2:
            return _context12.abrupt("return", _context12.sent);

          case 3:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12, this);
  }));

  return function (_x11) {
    return _ref12.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "cipherKeyValue",
/*#__PURE__*/
function () {
  var _ref13 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee13(params) {
    return _regenerator.default.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            _context13.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'cipherKeyValue'
            }, params));

          case 2:
            return _context13.abrupt("return", _context13.sent);

          case 3:
          case "end":
            return _context13.stop();
        }
      }
    }, _callee13, this);
  }));

  return function (_x12) {
    return _ref13.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "composeTransaction",
/*#__PURE__*/
function () {
  var _ref14 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee14(params) {
    return _regenerator.default.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            _context14.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'composeTransaction'
            }, params));

          case 2:
            return _context14.abrupt("return", _context14.sent);

          case 3:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee14, this);
  }));

  return function (_x13) {
    return _ref14.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "debugLinkDecision",
/*#__PURE__*/
function () {
  var _ref15 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee15(params) {
    return _regenerator.default.wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            _context15.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'debugLinkDecision'
            }, params));

          case 2:
            return _context15.abrupt("return", _context15.sent);

          case 3:
          case "end":
            return _context15.stop();
        }
      }
    }, _callee15, this);
  }));

  return function (_x14) {
    return _ref15.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "debugLinkGetState",
/*#__PURE__*/
function () {
  var _ref16 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee16(params) {
    return _regenerator.default.wrap(function _callee16$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:
            _context16.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'debugLinkGetState'
            }, params));

          case 2:
            return _context16.abrupt("return", _context16.sent);

          case 3:
          case "end":
            return _context16.stop();
        }
      }
    }, _callee16, this);
  }));

  return function (_x15) {
    return _ref16.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "ethereumGetAccountInfo",
/*#__PURE__*/
function () {
  var _ref17 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee17(params) {
    return _regenerator.default.wrap(function _callee17$(_context17) {
      while (1) {
        switch (_context17.prev = _context17.next) {
          case 0:
            _context17.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'ethereumGetAccountInfo'
            }, params));

          case 2:
            return _context17.abrupt("return", _context17.sent);

          case 3:
          case "end":
            return _context17.stop();
        }
      }
    }, _callee17, this);
  }));

  return function (_x16) {
    return _ref17.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "ethereumGetAddress",
/*#__PURE__*/
function () {
  var _ref18 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee18(params) {
    var useEventListener;
    return _regenerator.default.wrap(function _callee18$(_context18) {
      while (1) {
        switch (_context18.prev = _context18.next) {
          case 0:
            useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            _context18.next = 3;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'ethereumGetAddress'
            }, params, {
              useEventListener: useEventListener
            }));

          case 3:
            return _context18.abrupt("return", _context18.sent);

          case 4:
          case "end":
            return _context18.stop();
        }
      }
    }, _callee18, this);
  }));

  return function (_x17) {
    return _ref18.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "ethereumGetPublicKey",
/*#__PURE__*/
function () {
  var _ref19 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee19(params) {
    return _regenerator.default.wrap(function _callee19$(_context19) {
      while (1) {
        switch (_context19.prev = _context19.next) {
          case 0:
            _context19.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'ethereumGetPublicKey'
            }, params));

          case 2:
            return _context19.abrupt("return", _context19.sent);

          case 3:
          case "end":
            return _context19.stop();
        }
      }
    }, _callee19, this);
  }));

  return function (_x18) {
    return _ref19.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "ethereumSignMessage",
/*#__PURE__*/
function () {
  var _ref20 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee20(params) {
    return _regenerator.default.wrap(function _callee20$(_context20) {
      while (1) {
        switch (_context20.prev = _context20.next) {
          case 0:
            _context20.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'ethereumSignMessage'
            }, params));

          case 2:
            return _context20.abrupt("return", _context20.sent);

          case 3:
          case "end":
            return _context20.stop();
        }
      }
    }, _callee20, this);
  }));

  return function (_x19) {
    return _ref20.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "ethereumSignTransaction",
/*#__PURE__*/
function () {
  var _ref21 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee21(params) {
    return _regenerator.default.wrap(function _callee21$(_context21) {
      while (1) {
        switch (_context21.prev = _context21.next) {
          case 0:
            _context21.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'ethereumSignTransaction'
            }, params));

          case 2:
            return _context21.abrupt("return", _context21.sent);

          case 3:
          case "end":
            return _context21.stop();
        }
      }
    }, _callee21, this);
  }));

  return function (_x20) {
    return _ref21.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "ethereumVerifyMessage",
/*#__PURE__*/
function () {
  var _ref22 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee22(params) {
    return _regenerator.default.wrap(function _callee22$(_context22) {
      while (1) {
        switch (_context22.prev = _context22.next) {
          case 0:
            _context22.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'ethereumVerifyMessage'
            }, params));

          case 2:
            return _context22.abrupt("return", _context22.sent);

          case 3:
          case "end":
            return _context22.stop();
        }
      }
    }, _callee22, this);
  }));

  return function (_x21) {
    return _ref22.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "getAccountInfo",
/*#__PURE__*/
function () {
  var _ref23 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee23(params) {
    return _regenerator.default.wrap(function _callee23$(_context23) {
      while (1) {
        switch (_context23.prev = _context23.next) {
          case 0:
            _context23.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'getAccountInfo'
            }, params));

          case 2:
            return _context23.abrupt("return", _context23.sent);

          case 3:
          case "end":
            return _context23.stop();
        }
      }
    }, _callee23, this);
  }));

  return function (_x22) {
    return _ref23.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "getAddress",
/*#__PURE__*/
function () {
  var _ref24 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee24(params) {
    var useEventListener;
    return _regenerator.default.wrap(function _callee24$(_context24) {
      while (1) {
        switch (_context24.prev = _context24.next) {
          case 0:
            useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            _context24.next = 3;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'getAddress'
            }, params, {
              useEventListener: useEventListener
            }));

          case 3:
            return _context24.abrupt("return", _context24.sent);

          case 4:
          case "end":
            return _context24.stop();
        }
      }
    }, _callee24, this);
  }));

  return function (_x23) {
    return _ref24.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "getDeviceState",
/*#__PURE__*/
function () {
  var _ref25 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee25(params) {
    return _regenerator.default.wrap(function _callee25$(_context25) {
      while (1) {
        switch (_context25.prev = _context25.next) {
          case 0:
            _context25.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'getDeviceState'
            }, params));

          case 2:
            return _context25.abrupt("return", _context25.sent);

          case 3:
          case "end":
            return _context25.stop();
        }
      }
    }, _callee25, this);
  }));

  return function (_x24) {
    return _ref25.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "getFeatures",
/*#__PURE__*/
function () {
  var _ref26 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee26(params) {
    return _regenerator.default.wrap(function _callee26$(_context26) {
      while (1) {
        switch (_context26.prev = _context26.next) {
          case 0:
            _context26.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'getFeatures'
            }, params));

          case 2:
            return _context26.abrupt("return", _context26.sent);

          case 3:
          case "end":
            return _context26.stop();
        }
      }
    }, _callee26, this);
  }));

  return function (_x25) {
    return _ref26.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "getPublicKey",
/*#__PURE__*/
function () {
  var _ref27 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee27(params) {
    return _regenerator.default.wrap(function _callee27$(_context27) {
      while (1) {
        switch (_context27.prev = _context27.next) {
          case 0:
            _context27.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'getPublicKey'
            }, params));

          case 2:
            return _context27.abrupt("return", _context27.sent);

          case 3:
          case "end":
            return _context27.stop();
        }
      }
    }, _callee27, this);
  }));

  return function (_x26) {
    return _ref27.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "liskGetAddress",
/*#__PURE__*/
function () {
  var _ref28 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee28(params) {
    var useEventListener;
    return _regenerator.default.wrap(function _callee28$(_context28) {
      while (1) {
        switch (_context28.prev = _context28.next) {
          case 0:
            useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            _context28.next = 3;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'liskGetAddress'
            }, params, {
              useEventListener: useEventListener
            }));

          case 3:
            return _context28.abrupt("return", _context28.sent);

          case 4:
          case "end":
            return _context28.stop();
        }
      }
    }, _callee28, this);
  }));

  return function (_x27) {
    return _ref28.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "liskGetPublicKey",
/*#__PURE__*/
function () {
  var _ref29 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee29(params) {
    return _regenerator.default.wrap(function _callee29$(_context29) {
      while (1) {
        switch (_context29.prev = _context29.next) {
          case 0:
            _context29.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'liskGetPublicKey'
            }, params));

          case 2:
            return _context29.abrupt("return", _context29.sent);

          case 3:
          case "end":
            return _context29.stop();
        }
      }
    }, _callee29, this);
  }));

  return function (_x28) {
    return _ref29.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "liskSignMessage",
/*#__PURE__*/
function () {
  var _ref30 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee30(params) {
    return _regenerator.default.wrap(function _callee30$(_context30) {
      while (1) {
        switch (_context30.prev = _context30.next) {
          case 0:
            _context30.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'liskSignMessage'
            }, params));

          case 2:
            return _context30.abrupt("return", _context30.sent);

          case 3:
          case "end":
            return _context30.stop();
        }
      }
    }, _callee30, this);
  }));

  return function (_x29) {
    return _ref30.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "liskSignTransaction",
/*#__PURE__*/
function () {
  var _ref31 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee31(params) {
    return _regenerator.default.wrap(function _callee31$(_context31) {
      while (1) {
        switch (_context31.prev = _context31.next) {
          case 0:
            _context31.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'liskSignTransaction'
            }, params));

          case 2:
            return _context31.abrupt("return", _context31.sent);

          case 3:
          case "end":
            return _context31.stop();
        }
      }
    }, _callee31, this);
  }));

  return function (_x30) {
    return _ref31.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "liskVerifyMessage",
/*#__PURE__*/
function () {
  var _ref32 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee32(params) {
    return _regenerator.default.wrap(function _callee32$(_context32) {
      while (1) {
        switch (_context32.prev = _context32.next) {
          case 0:
            _context32.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'liskVerifyMessage'
            }, params));

          case 2:
            return _context32.abrupt("return", _context32.sent);

          case 3:
          case "end":
            return _context32.stop();
        }
      }
    }, _callee32, this);
  }));

  return function (_x31) {
    return _ref32.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "nemGetAddress",
/*#__PURE__*/
function () {
  var _ref33 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee33(params) {
    var useEventListener;
    return _regenerator.default.wrap(function _callee33$(_context33) {
      while (1) {
        switch (_context33.prev = _context33.next) {
          case 0:
            useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            _context33.next = 3;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'nemGetAddress'
            }, params, {
              useEventListener: useEventListener
            }));

          case 3:
            return _context33.abrupt("return", _context33.sent);

          case 4:
          case "end":
            return _context33.stop();
        }
      }
    }, _callee33, this);
  }));

  return function (_x32) {
    return _ref33.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "nemSignTransaction",
/*#__PURE__*/
function () {
  var _ref34 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee34(params) {
    return _regenerator.default.wrap(function _callee34$(_context34) {
      while (1) {
        switch (_context34.prev = _context34.next) {
          case 0:
            _context34.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'nemSignTransaction'
            }, params));

          case 2:
            return _context34.abrupt("return", _context34.sent);

          case 3:
          case "end":
            return _context34.stop();
        }
      }
    }, _callee34, this);
  }));

  return function (_x33) {
    return _ref34.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "pushTransaction",
/*#__PURE__*/
function () {
  var _ref35 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee35(params) {
    return _regenerator.default.wrap(function _callee35$(_context35) {
      while (1) {
        switch (_context35.prev = _context35.next) {
          case 0:
            _context35.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'pushTransaction'
            }, params));

          case 2:
            return _context35.abrupt("return", _context35.sent);

          case 3:
          case "end":
            return _context35.stop();
        }
      }
    }, _callee35, this);
  }));

  return function (_x34) {
    return _ref35.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "rippleGetAccountInfo",
/*#__PURE__*/
function () {
  var _ref36 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee36(params) {
    return _regenerator.default.wrap(function _callee36$(_context36) {
      while (1) {
        switch (_context36.prev = _context36.next) {
          case 0:
            _context36.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'rippleGetAccountInfo'
            }, params));

          case 2:
            return _context36.abrupt("return", _context36.sent);

          case 3:
          case "end":
            return _context36.stop();
        }
      }
    }, _callee36, this);
  }));

  return function (_x35) {
    return _ref36.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "rippleGetAddress",
/*#__PURE__*/
function () {
  var _ref37 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee37(params) {
    var useEventListener;
    return _regenerator.default.wrap(function _callee37$(_context37) {
      while (1) {
        switch (_context37.prev = _context37.next) {
          case 0:
            useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            _context37.next = 3;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'rippleGetAddress'
            }, params, {
              useEventListener: useEventListener
            }));

          case 3:
            return _context37.abrupt("return", _context37.sent);

          case 4:
          case "end":
            return _context37.stop();
        }
      }
    }, _callee37, this);
  }));

  return function (_x36) {
    return _ref37.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "rippleSignTransaction",
/*#__PURE__*/
function () {
  var _ref38 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee38(params) {
    return _regenerator.default.wrap(function _callee38$(_context38) {
      while (1) {
        switch (_context38.prev = _context38.next) {
          case 0:
            _context38.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'rippleSignTransaction'
            }, params));

          case 2:
            return _context38.abrupt("return", _context38.sent);

          case 3:
          case "end":
            return _context38.stop();
        }
      }
    }, _callee38, this);
  }));

  return function (_x37) {
    return _ref38.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "signMessage",
/*#__PURE__*/
function () {
  var _ref39 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee39(params) {
    return _regenerator.default.wrap(function _callee39$(_context39) {
      while (1) {
        switch (_context39.prev = _context39.next) {
          case 0:
            _context39.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'signMessage'
            }, params));

          case 2:
            return _context39.abrupt("return", _context39.sent);

          case 3:
          case "end":
            return _context39.stop();
        }
      }
    }, _callee39, this);
  }));

  return function (_x38) {
    return _ref39.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "signTransaction",
/*#__PURE__*/
function () {
  var _ref40 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee40(params) {
    return _regenerator.default.wrap(function _callee40$(_context40) {
      while (1) {
        switch (_context40.prev = _context40.next) {
          case 0:
            _context40.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'signTransaction'
            }, params));

          case 2:
            return _context40.abrupt("return", _context40.sent);

          case 3:
          case "end":
            return _context40.stop();
        }
      }
    }, _callee40, this);
  }));

  return function (_x39) {
    return _ref40.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "stellarGetAddress",
/*#__PURE__*/
function () {
  var _ref41 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee41(params) {
    var useEventListener;
    return _regenerator.default.wrap(function _callee41$(_context41) {
      while (1) {
        switch (_context41.prev = _context41.next) {
          case 0:
            useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            _context41.next = 3;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'stellarGetAddress'
            }, params, {
              useEventListener: useEventListener
            }));

          case 3:
            return _context41.abrupt("return", _context41.sent);

          case 4:
          case "end":
            return _context41.stop();
        }
      }
    }, _callee41, this);
  }));

  return function (_x40) {
    return _ref41.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "stellarSignTransaction",
/*#__PURE__*/
function () {
  var _ref42 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee42(params) {
    return _regenerator.default.wrap(function _callee42$(_context42) {
      while (1) {
        switch (_context42.prev = _context42.next) {
          case 0:
            _context42.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'stellarSignTransaction'
            }, params));

          case 2:
            return _context42.abrupt("return", _context42.sent);

          case 3:
          case "end":
            return _context42.stop();
        }
      }
    }, _callee42, this);
  }));

  return function (_x41) {
    return _ref42.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "tezosGetAddress",
/*#__PURE__*/
function () {
  var _ref43 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee43(params) {
    var useEventListener;
    return _regenerator.default.wrap(function _callee43$(_context43) {
      while (1) {
        switch (_context43.prev = _context43.next) {
          case 0:
            useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
            _context43.next = 3;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'tezosGetAddress'
            }, params, {
              useEventListener: useEventListener
            }));

          case 3:
            return _context43.abrupt("return", _context43.sent);

          case 4:
          case "end":
            return _context43.stop();
        }
      }
    }, _callee43, this);
  }));

  return function (_x42) {
    return _ref43.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "tezosGetPublicKey",
/*#__PURE__*/
function () {
  var _ref44 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee44(params) {
    return _regenerator.default.wrap(function _callee44$(_context44) {
      while (1) {
        switch (_context44.prev = _context44.next) {
          case 0:
            _context44.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'tezosGetPublicKey'
            }, params));

          case 2:
            return _context44.abrupt("return", _context44.sent);

          case 3:
          case "end":
            return _context44.stop();
        }
      }
    }, _callee44, this);
  }));

  return function (_x43) {
    return _ref44.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "tezosSignTransaction",
/*#__PURE__*/
function () {
  var _ref45 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee45(params) {
    return _regenerator.default.wrap(function _callee45$(_context45) {
      while (1) {
        switch (_context45.prev = _context45.next) {
          case 0:
            _context45.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'tezosSignTransaction'
            }, params));

          case 2:
            return _context45.abrupt("return", _context45.sent);

          case 3:
          case "end":
            return _context45.stop();
        }
      }
    }, _callee45, this);
  }));

  return function (_x44) {
    return _ref45.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "verifyMessage",
/*#__PURE__*/
function () {
  var _ref46 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee46(params) {
    return _regenerator.default.wrap(function _callee46$(_context46) {
      while (1) {
        switch (_context46.prev = _context46.next) {
          case 0:
            _context46.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'verifyMessage'
            }, params));

          case 2:
            return _context46.abrupt("return", _context46.sent);

          case 3:
          case "end":
            return _context46.stop();
        }
      }
    }, _callee46, this);
  }));

  return function (_x45) {
    return _ref46.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "wipeDevice",
/*#__PURE__*/
function () {
  var _ref47 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee47(params) {
    return _regenerator.default.wrap(function _callee47$(_context47) {
      while (1) {
        switch (_context47.prev = _context47.next) {
          case 0:
            _context47.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'wipeDevice'
            }, params));

          case 2:
            return _context47.abrupt("return", _context47.sent);

          case 3:
          case "end":
            return _context47.stop();
        }
      }
    }, _callee47, this);
  }));

  return function (_x46) {
    return _ref47.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "applyFlags",
/*#__PURE__*/
function () {
  var _ref48 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee48(params) {
    return _regenerator.default.wrap(function _callee48$(_context48) {
      while (1) {
        switch (_context48.prev = _context48.next) {
          case 0:
            _context48.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'applyFlags'
            }, params));

          case 2:
            return _context48.abrupt("return", _context48.sent);

          case 3:
          case "end":
            return _context48.stop();
        }
      }
    }, _callee48, this);
  }));

  return function (_x47) {
    return _ref48.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "applySettings",
/*#__PURE__*/
function () {
  var _ref49 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee49(params) {
    return _regenerator.default.wrap(function _callee49$(_context49) {
      while (1) {
        switch (_context49.prev = _context49.next) {
          case 0:
            _context49.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'applySettings'
            }, params));

          case 2:
            return _context49.abrupt("return", _context49.sent);

          case 3:
          case "end":
            return _context49.stop();
        }
      }
    }, _callee49, this);
  }));

  return function (_x48) {
    return _ref49.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "backupDevice",
/*#__PURE__*/
(0, _asyncToGenerator2.default)(
/*#__PURE__*/
_regenerator.default.mark(function _callee50() {
  return _regenerator.default.wrap(function _callee50$(_context50) {
    while (1) {
      switch (_context50.prev = _context50.next) {
        case 0:
          _context50.next = 2;
          return (0, _node.call)({
            method: 'backupDevice'
          });

        case 2:
          return _context50.abrupt("return", _context50.sent);

        case 3:
        case "end":
          return _context50.stop();
      }
    }
  }, _callee50, this);
})));
(0, _defineProperty2.default)(TrezorConnect, "changePin",
/*#__PURE__*/
function () {
  var _ref51 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee51(params) {
    return _regenerator.default.wrap(function _callee51$(_context51) {
      while (1) {
        switch (_context51.prev = _context51.next) {
          case 0:
            _context51.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'changePin'
            }, params));

          case 2:
            return _context51.abrupt("return", _context51.sent);

          case 3:
          case "end":
            return _context51.stop();
        }
      }
    }, _callee51, this);
  }));

  return function (_x49) {
    return _ref51.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "firmwareErase",
/*#__PURE__*/
function () {
  var _ref52 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee52(params) {
    return _regenerator.default.wrap(function _callee52$(_context52) {
      while (1) {
        switch (_context52.prev = _context52.next) {
          case 0:
            _context52.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'firmwareErase'
            }, params));

          case 2:
            return _context52.abrupt("return", _context52.sent);

          case 3:
          case "end":
            return _context52.stop();
        }
      }
    }, _callee52, this);
  }));

  return function (_x50) {
    return _ref52.apply(this, arguments);
  };
}());


(0, _defineProperty2.default)(TrezorConnect, "firmwareUpload",
/*#__PURE__*/
function () {
  var _ref53 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee53(params) {
    return _regenerator.default.wrap(function _callee53$(_context53) {
      while (1) {
        switch (_context53.prev = _context53.next) {
          case 0:
            _context53.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'firmwareUpload'
            }, params));

          case 2:
            return _context53.abrupt("return", _context53.sent);

          case 3:
          case "end":
            return _context53.stop();
        }
      }
    }, _callee53, this);
  }));

  return function (_x51) {
    return _ref53.apply(this, arguments);
  };
}());

(0, _defineProperty2.default)(TrezorConnect, "firmwareUpdate",
/*#__PURE__*/
function () {
  var _ref53 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee53(params) {
    return _regenerator.default.wrap(function _callee53$(_context53) {
      while (1) {
        switch (_context53.prev = _context53.next) {
          case 0:
            _context53.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'firmwareUpdate'
            }, params));

          case 2:
            return _context53.abrupt("return", _context53.sent);

          case 3:
          case "end":
            return _context53.stop();
        }
      }
    }, _callee53, this);
  }));

  return function (_x51) {
    return _ref53.apply(this, arguments);
  };
}());


(0, _defineProperty2.default)(TrezorConnect, "recoveryDevice",
/*#__PURE__*/
function () {
  var _ref54 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee54(params) {
    return _regenerator.default.wrap(function _callee54$(_context54) {
      while (1) {
        switch (_context54.prev = _context54.next) {
          case 0:
            _context54.next = 2;
            return (0, _node.call)((0, _objectSpread2.default)({
              method: 'recoveryDevice'
            }, params));

          case 2:
            return _context54.abrupt("return", _context54.sent);

          case 3:
          case "end":
            return _context54.stop();
        }
      }
    }, _callee54, this);
  }));

  return function (_x52) {
    return _ref54.apply(this, arguments);
  };
}());
(0, _defineProperty2.default)(TrezorConnect, "dispose", function () {
  (0, _node.dispose)();
});
(0, _defineProperty2.default)(TrezorConnect, "cancel", function () {
  (0, _node.cancel)();
});
(0, _defineProperty2.default)(TrezorConnect, "renderWebUSBButton", function (className) {
  (0, _node.renderWebUSBButton)(className);
});
var _default = TrezorConnect;
exports.default = _default;