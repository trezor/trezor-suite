"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var DEVICE = _interopRequireWildcard(require("../constants/device"));

var _randombytes = _interopRequireDefault(require("randombytes"));

var bitcoin = _interopRequireWildcard(require("trezor-utxo-lib"));

var hdnodeUtils = _interopRequireWildcard(require("../utils/hdnode"));

var _pathUtils = require("../utils/pathUtils");

var _promiseUtils = require("../utils/promiseUtils");

var _Device = _interopRequireDefault(require("./Device"));

var _CoinInfo = require("../data/CoinInfo");

var trezor = _interopRequireWildcard(require("../types/trezor"));

function assertType(res, resType) {
  var splitResTypes = resType.split('|');

  if (!splitResTypes.includes(res.type)) {
    throw new TypeError("Response of unexpected type: " + res.type + ". Should be " + resType);
  }
}

function generateEntropy(len) {
  if (global.crypto || global.msCrypto) {
    return (0, _randombytes.default)(len);
  } else {
    throw new Error('Browser does not support crypto random');
  }
}

function filterForLog(type, msg) {
  var blacklist = {// PassphraseAck: {
    //     passphrase: '(redacted...)',
    // },
    // CipheredKeyValue: {
    //     value: '(redacted...)',
    // },
    // GetPublicKey: {
    //     address_n: '(redacted...)',
    // },
    // PublicKey: {
    //     node: '(redacted...)',
    //     xpub: '(redacted...)',
    // },
    // DecryptedMessage: {
    //     message: '(redacted...)',
    //     address: '(redacted...)',
    // },
  };

  if (type in blacklist) {
    return (0, _objectSpread2.default)({}, msg, blacklist[type]);
  } else {
    return msg;
  }
}

var DeviceCommands =
/*#__PURE__*/
function () {
  function DeviceCommands(device, transport, sessionId) {
    this.device = device;
    this.transport = transport;
    this.sessionId = sessionId;
    this.debug = false;
    this.disposed = false;
  }

  var _proto = DeviceCommands.prototype;

  _proto.dispose = function dispose() {
    this.disposed = true;
  };

  _proto.isDisposed = function isDisposed() {
    return this.disposed;
  };

  _proto.getPublicKey =
  /*#__PURE__*/
  function () {
    var _getPublicKey = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee(address_n, coin_name, script_type) {
      var response;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.typedCall('GetPublicKey', 'PublicKey', {
                address_n: address_n,
                coin_name: coin_name,
                script_type: script_type
              });

            case 2:
              response = _context.sent;
              return _context.abrupt("return", response.message);

            case 4:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function getPublicKey(_x, _x2, _x3) {
      return _getPublicKey.apply(this, arguments);
    }

    return getPublicKey;
  }() // Validation of xpub
  ;

  _proto.getHDNode =
  /*#__PURE__*/
  function () {
    var _getHDNode = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2(path, coinInfo, validation) {
      var network, scriptType, publicKey, suffix, childPath, resKey, childKey, response;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (validation === void 0) {
                validation = true;
              }

              if (this.device.atLeast(['1.7.2', '2.0.10'])) {
                _context2.next = 5;
                break;
              }

              _context2.next = 4;
              return this.getBitcoinHDNode(path, coinInfo, validation);

            case 4:
              return _context2.abrupt("return", _context2.sent);

            case 5:
              if (coinInfo) {
                _context2.next = 9;
                break;
              }

              _context2.next = 8;
              return this.getBitcoinHDNode(path, null, validation);

            case 8:
              return _context2.abrupt("return", _context2.sent);

            case 9:
              if ((0, _pathUtils.isMultisigPath)(path)) {
                network = coinInfo.network;
              } else if ((0, _pathUtils.isSegwitPath)(path)) {
                network = (0, _CoinInfo.getSegwitNetwork)(coinInfo);
              } else if ((0, _pathUtils.isBech32Path)(path)) {
                network = (0, _CoinInfo.getBech32Network)(coinInfo);
              }

              scriptType = (0, _pathUtils.getScriptType)(path);

              if (!network) {
                network = coinInfo.network;

                if (scriptType !== 'SPENDADDRESS') {
                  scriptType = undefined;
                }
              }

              if (validation) {
                _context2.next = 18;
                break;
              }

              _context2.next = 15;
              return this.getPublicKey(path, coinInfo.name, scriptType);

            case 15:
              publicKey = _context2.sent;
              _context2.next = 27;
              break;

            case 18:
              suffix = 0;
              childPath = path.concat([suffix]);
              _context2.next = 22;
              return this.getPublicKey(path, coinInfo.name, scriptType);

            case 22:
              resKey = _context2.sent;
              _context2.next = 25;
              return this.getPublicKey(childPath, coinInfo.name, scriptType);

            case 25:
              childKey = _context2.sent;
              publicKey = hdnodeUtils.xpubDerive(resKey, childKey, suffix, network, coinInfo.network);

            case 27:
              response = {
                path: path,
                serializedPath: (0, _pathUtils.getSerializedPath)(path),
                childNum: publicKey.node.child_num,
                xpub: publicKey.xpub,
                chainCode: publicKey.node.chain_code,
                publicKey: publicKey.node.public_key,
                fingerprint: publicKey.node.fingerprint,
                depth: publicKey.node.depth
              };

              if (network !== coinInfo.network) {
                response.xpubSegwit = response.xpub;
                response.xpub = hdnodeUtils.convertXpub(publicKey.xpub, network, coinInfo.network);
              }

              return _context2.abrupt("return", response);

            case 30:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function getHDNode(_x4, _x5, _x6) {
      return _getHDNode.apply(this, arguments);
    }

    return getHDNode;
  }() // deprecated
  // legacy method (below FW 1.7.2 & 2.0.10), remove it after next "required" FW update.
  // keys are exported in BTC format and converted to proper format in hdnodeUtils
  // old firmware didn't return keys with proper prefix (ypub, Ltub.. and so on)
  ;

  _proto.getBitcoinHDNode =
  /*#__PURE__*/
  function () {
    var _getBitcoinHDNode = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee3(path, coinInfo, validation) {
      var publicKey, suffix, childPath, resKey, childKey, response, segwitNetwork;
      return _regenerator.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (validation === void 0) {
                validation = true;
              }

              if (validation) {
                _context3.next = 7;
                break;
              }

              _context3.next = 4;
              return this.getPublicKey(path, 'Bitcoin');

            case 4:
              publicKey = _context3.sent;
              _context3.next = 16;
              break;

            case 7:
              suffix = 0;
              childPath = path.concat([suffix]);
              _context3.next = 11;
              return this.getPublicKey(path, 'Bitcoin');

            case 11:
              resKey = _context3.sent;
              _context3.next = 14;
              return this.getPublicKey(childPath, 'Bitcoin');

            case 14:
              childKey = _context3.sent;
              publicKey = hdnodeUtils.xpubDerive(resKey, childKey, suffix);

            case 16:
              response = {
                path: path,
                serializedPath: (0, _pathUtils.getSerializedPath)(path),
                childNum: publicKey.node.child_num,
                xpub: coinInfo ? hdnodeUtils.convertBitcoinXpub(publicKey.xpub, coinInfo.network) : publicKey.xpub,
                chainCode: publicKey.node.chain_code,
                publicKey: publicKey.node.public_key,
                fingerprint: publicKey.node.fingerprint,
                depth: publicKey.node.depth
              }; // if requested path is a segwit
              // convert xpub to new format

              if (coinInfo) {
                segwitNetwork = (0, _CoinInfo.getSegwitNetwork)(coinInfo);

                if (segwitNetwork && (0, _pathUtils.isSegwitPath)(path)) {
                  response.xpubSegwit = hdnodeUtils.convertBitcoinXpub(publicKey.xpub, segwitNetwork);
                }
              }

              return _context3.abrupt("return", response);

            case 19:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function getBitcoinHDNode(_x7, _x8, _x9) {
      return _getBitcoinHDNode.apply(this, arguments);
    }

    return getBitcoinHDNode;
  }();

  _proto.getDeviceState =
  /*#__PURE__*/
  function () {
    var _getDeviceState = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee4() {
      var response, secret, state;
      return _regenerator.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return this.getPublicKey([(44 | 0x80000000) >>> 0, (1 | 0x80000000) >>> 0, (0 | 0x80000000) >>> 0], 'Testnet', 'SPENDADDRESS');

            case 2:
              response = _context4.sent;
              secret = response.xpub + "#" + this.device.features.device_id + "#" + this.device.instance;
              state = this.device.getTemporaryState() || bitcoin.crypto.hash256(Buffer.from(secret, 'binary')).toString('hex');
              return _context4.abrupt("return", state);

            case 6:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function getDeviceState() {
      return _getDeviceState.apply(this, arguments);
    }

    return getDeviceState;
  }();

  _proto.getAddress =
  /*#__PURE__*/
  function () {
    var _getAddress = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee5(address_n, coinInfo, showOnTrezor) {
      var scriptType, response;
      return _regenerator.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              scriptType = (0, _pathUtils.getScriptType)(address_n);
              _context5.next = 3;
              return this.typedCall('GetAddress', 'Address', {
                address_n: address_n,
                coin_name: coinInfo.name,
                show_display: !!showOnTrezor,
                script_type: scriptType && scriptType !== 'SPENDMULTISIG' ? scriptType : 'SPENDADDRESS' // script_type 'SPENDMULTISIG' throws Failure_FirmwareError

              });

            case 3:
              response = _context5.sent;
              return _context5.abrupt("return", {
                address: response.message.address,
                path: address_n,
                serializedPath: (0, _pathUtils.getSerializedPath)(address_n)
              });

            case 5:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    function getAddress(_x10, _x11, _x12) {
      return _getAddress.apply(this, arguments);
    }

    return getAddress;
  }();

  _proto.signMessage =
  /*#__PURE__*/
  function () {
    var _signMessage = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee6(address_n, message, coin) {
      var scriptType, response;
      return _regenerator.default.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              scriptType = (0, _pathUtils.getScriptType)(address_n);
              _context6.next = 3;
              return this.typedCall('SignMessage', 'MessageSignature', {
                address_n: address_n,
                message: message,
                coin_name: coin || 'Bitcoin',
                script_type: scriptType && scriptType !== 'SPENDMULTISIG' ? scriptType : 'SPENDADDRESS' // script_type 'SPENDMULTISIG' throws Failure_FirmwareError

              });

            case 3:
              response = _context6.sent;
              return _context6.abrupt("return", response.message);

            case 5:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    function signMessage(_x13, _x14, _x15) {
      return _signMessage.apply(this, arguments);
    }

    return signMessage;
  }();

  _proto.verifyMessage =
  /*#__PURE__*/
  function () {
    var _verifyMessage = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee7(address, signature, message, coin) {
      var response;
      return _regenerator.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _context7.next = 2;
              return this.typedCall('VerifyMessage', 'Success', {
                address: address,
                signature: signature,
                message: message,
                coin_name: coin
              });

            case 2:
              response = _context7.sent;
              return _context7.abrupt("return", response.message);

            case 4:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7, this);
    }));

    function verifyMessage(_x16, _x17, _x18, _x19) {
      return _verifyMessage.apply(this, arguments);
    }

    return verifyMessage;
  }();

  _proto.ethereumGetAddress =
  /*#__PURE__*/
  function () {
    var _ethereumGetAddress = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee8(address_n, showOnTrezor) {
      var response;
      return _regenerator.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return this.typedCall('EthereumGetAddress', 'EthereumAddress', {
                address_n: address_n,
                show_display: !!showOnTrezor
              });

            case 2:
              response = _context8.sent;
              return _context8.abrupt("return", response.message);

            case 4:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8, this);
    }));

    function ethereumGetAddress(_x20, _x21) {
      return _ethereumGetAddress.apply(this, arguments);
    }

    return ethereumGetAddress;
  }();

  _proto.ethereumGetPublicKey =
  /*#__PURE__*/
  function () {
    var _ethereumGetPublicKey = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee9(address_n, showOnTrezor) {
      var suffix, childPath, resKey, childKey, publicKey;
      return _regenerator.default.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              if (this.device.atLeast(['1.8.1', '2.1.0'])) {
                _context9.next = 4;
                break;
              }

              _context9.next = 3;
              return this.getHDNode(address_n);

            case 3:
              return _context9.abrupt("return", _context9.sent);

            case 4:
              suffix = 0;
              childPath = address_n.concat([suffix]);
              _context9.next = 8;
              return this.typedCall('EthereumGetPublicKey', 'EthereumPublicKey', {
                address_n: address_n,
                show_display: false
              });

            case 8:
              resKey = _context9.sent;
              _context9.next = 11;
              return this.typedCall('EthereumGetPublicKey', 'EthereumPublicKey', {
                address_n: childPath,
                show_display: false
              });

            case 11:
              childKey = _context9.sent;
              publicKey = hdnodeUtils.xpubDerive(resKey.message, childKey.message, suffix);
              return _context9.abrupt("return", {
                path: address_n,
                serializedPath: (0, _pathUtils.getSerializedPath)(address_n),
                childNum: publicKey.node.child_num,
                xpub: publicKey.xpub,
                chainCode: publicKey.node.chain_code,
                publicKey: publicKey.node.public_key,
                fingerprint: publicKey.node.fingerprint,
                depth: publicKey.node.depth
              });

            case 14:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9, this);
    }));

    function ethereumGetPublicKey(_x22, _x23) {
      return _ethereumGetPublicKey.apply(this, arguments);
    }

    return ethereumGetPublicKey;
  }();

  _proto.ethereumSignMessage =
  /*#__PURE__*/
  function () {
    var _ethereumSignMessage = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee10(address_n, message) {
      var response;
      return _regenerator.default.wrap(function _callee10$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              _context10.next = 2;
              return this.typedCall('EthereumSignMessage', 'EthereumMessageSignature', {
                address_n: address_n,
                message: message
              });

            case 2:
              response = _context10.sent;
              return _context10.abrupt("return", response.message);

            case 4:
            case "end":
              return _context10.stop();
          }
        }
      }, _callee10, this);
    }));

    function ethereumSignMessage(_x24, _x25) {
      return _ethereumSignMessage.apply(this, arguments);
    }

    return ethereumSignMessage;
  }();

  _proto.ethereumVerifyMessage =
  /*#__PURE__*/
  function () {
    var _ethereumVerifyMessage = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee11(address, signature, message) {
      var response;
      return _regenerator.default.wrap(function _callee11$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              _context11.next = 2;
              return this.typedCall('EthereumVerifyMessage', 'Success', {
                address: address,
                signature: signature,
                message: message
              });

            case 2:
              response = _context11.sent;
              return _context11.abrupt("return", response.message);

            case 4:
            case "end":
              return _context11.stop();
          }
        }
      }, _callee11, this);
    }));

    function ethereumVerifyMessage(_x26, _x27, _x28) {
      return _ethereumVerifyMessage.apply(this, arguments);
    }

    return ethereumVerifyMessage;
  }();

  _proto.nemGetAddress =
  /*#__PURE__*/
  function () {
    var _nemGetAddress = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee12(address_n, network, showOnTrezor) {
      var response;
      return _regenerator.default.wrap(function _callee12$(_context12) {
        while (1) {
          switch (_context12.prev = _context12.next) {
            case 0:
              _context12.next = 2;
              return this.typedCall('NEMGetAddress', 'NEMAddress', {
                address_n: address_n,
                network: network,
                show_display: !!showOnTrezor
              });

            case 2:
              response = _context12.sent;
              return _context12.abrupt("return", response.message);

            case 4:
            case "end":
              return _context12.stop();
          }
        }
      }, _callee12, this);
    }));

    function nemGetAddress(_x29, _x30, _x31) {
      return _nemGetAddress.apply(this, arguments);
    }

    return nemGetAddress;
  }();

  _proto.nemSignTx =
  /*#__PURE__*/
  function () {
    var _nemSignTx = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee13(transaction) {
      var response;
      return _regenerator.default.wrap(function _callee13$(_context13) {
        while (1) {
          switch (_context13.prev = _context13.next) {
            case 0:
              _context13.next = 2;
              return this.typedCall('NEMSignTx', 'NEMSignedTx', transaction);

            case 2:
              response = _context13.sent;
              return _context13.abrupt("return", response.message);

            case 4:
            case "end":
              return _context13.stop();
          }
        }
      }, _callee13, this);
    }));

    function nemSignTx(_x32) {
      return _nemSignTx.apply(this, arguments);
    }

    return nemSignTx;
  }() // Ripple: begin
  ;

  _proto.rippleGetAddress =
  /*#__PURE__*/
  function () {
    var _rippleGetAddress = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee14(address_n, showOnTrezor) {
      var response;
      return _regenerator.default.wrap(function _callee14$(_context14) {
        while (1) {
          switch (_context14.prev = _context14.next) {
            case 0:
              _context14.next = 2;
              return this.typedCall('RippleGetAddress', 'RippleAddress', {
                address_n: address_n,
                show_display: !!showOnTrezor
              });

            case 2:
              response = _context14.sent;
              return _context14.abrupt("return", response.message);

            case 4:
            case "end":
              return _context14.stop();
          }
        }
      }, _callee14, this);
    }));

    function rippleGetAddress(_x33, _x34) {
      return _rippleGetAddress.apply(this, arguments);
    }

    return rippleGetAddress;
  }();

  _proto.rippleSignTx =
  /*#__PURE__*/
  function () {
    var _rippleSignTx = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee15(transaction) {
      var response;
      return _regenerator.default.wrap(function _callee15$(_context15) {
        while (1) {
          switch (_context15.prev = _context15.next) {
            case 0:
              _context15.next = 2;
              return this.typedCall('RippleSignTx', 'RippleSignedTx', transaction);

            case 2:
              response = _context15.sent;
              return _context15.abrupt("return", response.message);

            case 4:
            case "end":
              return _context15.stop();
          }
        }
      }, _callee15, this);
    }));

    function rippleSignTx(_x35) {
      return _rippleSignTx.apply(this, arguments);
    }

    return rippleSignTx;
  }() // Ripple: end
  // Stellar: begin
  ;

  _proto.stellarGetAddress =
  /*#__PURE__*/
  function () {
    var _stellarGetAddress = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee16(address_n, showOnTrezor) {
      var response;
      return _regenerator.default.wrap(function _callee16$(_context16) {
        while (1) {
          switch (_context16.prev = _context16.next) {
            case 0:
              _context16.next = 2;
              return this.typedCall('StellarGetAddress', 'StellarAddress', {
                address_n: address_n,
                show_display: !!showOnTrezor
              });

            case 2:
              response = _context16.sent;
              return _context16.abrupt("return", response.message);

            case 4:
            case "end":
              return _context16.stop();
          }
        }
      }, _callee16, this);
    }));

    function stellarGetAddress(_x36, _x37) {
      return _stellarGetAddress.apply(this, arguments);
    }

    return stellarGetAddress;
  }() // StellarSignTx message can be found inside ./core/methods/helpers/stellarSignTx
  // Stellar: end
  // Cardano: begin
  ;

  _proto.cardanoGetPublicKey =
  /*#__PURE__*/
  function () {
    var _cardanoGetPublicKey = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee17(address_n, showOnTrezor) {
      var response;
      return _regenerator.default.wrap(function _callee17$(_context17) {
        while (1) {
          switch (_context17.prev = _context17.next) {
            case 0:
              _context17.next = 2;
              return this.typedCall('CardanoGetPublicKey', 'CardanoPublicKey', {
                address_n: address_n,
                show_display: !!showOnTrezor
              });

            case 2:
              response = _context17.sent;
              return _context17.abrupt("return", response.message);

            case 4:
            case "end":
              return _context17.stop();
          }
        }
      }, _callee17, this);
    }));

    function cardanoGetPublicKey(_x38, _x39) {
      return _cardanoGetPublicKey.apply(this, arguments);
    }

    return cardanoGetPublicKey;
  }();

  _proto.cardanoGetAddress =
  /*#__PURE__*/
  function () {
    var _cardanoGetAddress = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee18(address_n, showOnTrezor) {
      var response;
      return _regenerator.default.wrap(function _callee18$(_context18) {
        while (1) {
          switch (_context18.prev = _context18.next) {
            case 0:
              _context18.next = 2;
              return this.typedCall('CardanoGetAddress', 'CardanoAddress', {
                address_n: address_n,
                show_display: !!showOnTrezor
              });

            case 2:
              response = _context18.sent;
              return _context18.abrupt("return", response.message);

            case 4:
            case "end":
              return _context18.stop();
          }
        }
      }, _callee18, this);
    }));

    function cardanoGetAddress(_x40, _x41) {
      return _cardanoGetAddress.apply(this, arguments);
    }

    return cardanoGetAddress;
  }() // CardanoSignTx message can be found inside ./core/methods/helpers/cardanoSignTx
  // Cardano: end
  // Lisk: begin
  ;

  _proto.liskGetAddress =
  /*#__PURE__*/
  function () {
    var _liskGetAddress = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee19(address_n, showOnTrezor) {
      var response;
      return _regenerator.default.wrap(function _callee19$(_context19) {
        while (1) {
          switch (_context19.prev = _context19.next) {
            case 0:
              _context19.next = 2;
              return this.typedCall('LiskGetAddress', 'LiskAddress', {
                address_n: address_n,
                show_display: !!showOnTrezor
              });

            case 2:
              response = _context19.sent;
              return _context19.abrupt("return", response.message);

            case 4:
            case "end":
              return _context19.stop();
          }
        }
      }, _callee19, this);
    }));

    function liskGetAddress(_x42, _x43) {
      return _liskGetAddress.apply(this, arguments);
    }

    return liskGetAddress;
  }();

  _proto.liskGetPublicKey =
  /*#__PURE__*/
  function () {
    var _liskGetPublicKey = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee20(address_n, showOnTrezor) {
      var response;
      return _regenerator.default.wrap(function _callee20$(_context20) {
        while (1) {
          switch (_context20.prev = _context20.next) {
            case 0:
              _context20.next = 2;
              return this.typedCall('LiskGetPublicKey', 'LiskPublicKey', {
                address_n: address_n,
                show_display: !!showOnTrezor
              });

            case 2:
              response = _context20.sent;
              return _context20.abrupt("return", response.message);

            case 4:
            case "end":
              return _context20.stop();
          }
        }
      }, _callee20, this);
    }));

    function liskGetPublicKey(_x44, _x45) {
      return _liskGetPublicKey.apply(this, arguments);
    }

    return liskGetPublicKey;
  }();

  _proto.liskSignMessage =
  /*#__PURE__*/
  function () {
    var _liskSignMessage = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee21(address_n, message) {
      var response;
      return _regenerator.default.wrap(function _callee21$(_context21) {
        while (1) {
          switch (_context21.prev = _context21.next) {
            case 0:
              _context21.next = 2;
              return this.typedCall('LiskSignMessage', 'LiskMessageSignature', {
                address_n: address_n,
                message: message
              });

            case 2:
              response = _context21.sent;
              return _context21.abrupt("return", response.message);

            case 4:
            case "end":
              return _context21.stop();
          }
        }
      }, _callee21, this);
    }));

    function liskSignMessage(_x46, _x47) {
      return _liskSignMessage.apply(this, arguments);
    }

    return liskSignMessage;
  }();

  _proto.liskVerifyMessage =
  /*#__PURE__*/
  function () {
    var _liskVerifyMessage = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee22(public_key, signature, message) {
      var response;
      return _regenerator.default.wrap(function _callee22$(_context22) {
        while (1) {
          switch (_context22.prev = _context22.next) {
            case 0:
              _context22.next = 2;
              return this.typedCall('LiskVerifyMessage', 'Success', {
                public_key: public_key,
                signature: signature,
                message: message
              });

            case 2:
              response = _context22.sent;
              return _context22.abrupt("return", response.message);

            case 4:
            case "end":
              return _context22.stop();
          }
        }
      }, _callee22, this);
    }));

    function liskVerifyMessage(_x48, _x49, _x50) {
      return _liskVerifyMessage.apply(this, arguments);
    }

    return liskVerifyMessage;
  }();

  _proto.liskSignTx =
  /*#__PURE__*/
  function () {
    var _liskSignTx = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee23(address_n, transaction) {
      var response;
      return _regenerator.default.wrap(function _callee23$(_context23) {
        while (1) {
          switch (_context23.prev = _context23.next) {
            case 0:
              _context23.next = 2;
              return this.typedCall('LiskSignTx', 'LiskSignedTx', {
                address_n: address_n,
                transaction: transaction
              });

            case 2:
              response = _context23.sent;
              return _context23.abrupt("return", response.message);

            case 4:
            case "end":
              return _context23.stop();
          }
        }
      }, _callee23, this);
    }));

    function liskSignTx(_x51, _x52) {
      return _liskSignTx.apply(this, arguments);
    }

    return liskSignTx;
  }() // Lisk: end
  // Tezos: begin
  ;

  _proto.tezosGetAddress =
  /*#__PURE__*/
  function () {
    var _tezosGetAddress = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee24(address_n, showOnTrezor) {
      var response;
      return _regenerator.default.wrap(function _callee24$(_context24) {
        while (1) {
          switch (_context24.prev = _context24.next) {
            case 0:
              _context24.next = 2;
              return this.typedCall('TezosGetAddress', 'TezosAddress', {
                address_n: address_n,
                show_display: !!showOnTrezor
              });

            case 2:
              response = _context24.sent;
              return _context24.abrupt("return", response.message);

            case 4:
            case "end":
              return _context24.stop();
          }
        }
      }, _callee24, this);
    }));

    function tezosGetAddress(_x53, _x54) {
      return _tezosGetAddress.apply(this, arguments);
    }

    return tezosGetAddress;
  }();

  _proto.tezosGetPublicKey =
  /*#__PURE__*/
  function () {
    var _tezosGetPublicKey = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee25(address_n, showOnTrezor) {
      var response;
      return _regenerator.default.wrap(function _callee25$(_context25) {
        while (1) {
          switch (_context25.prev = _context25.next) {
            case 0:
              _context25.next = 2;
              return this.typedCall('TezosGetPublicKey', 'TezosPublicKey', {
                address_n: address_n,
                show_display: !!showOnTrezor
              });

            case 2:
              response = _context25.sent;
              return _context25.abrupt("return", response.message);

            case 4:
            case "end":
              return _context25.stop();
          }
        }
      }, _callee25, this);
    }));

    function tezosGetPublicKey(_x55, _x56) {
      return _tezosGetPublicKey.apply(this, arguments);
    }

    return tezosGetPublicKey;
  }();

  _proto.tezosSignTransaction =
  /*#__PURE__*/
  function () {
    var _tezosSignTransaction = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee26(message) {
      var response;
      return _regenerator.default.wrap(function _callee26$(_context26) {
        while (1) {
          switch (_context26.prev = _context26.next) {
            case 0:
              _context26.next = 2;
              return this.typedCall('TezosSignTx', 'TezosSignedTx', message);

            case 2:
              response = _context26.sent;
              return _context26.abrupt("return", response.message);

            case 4:
            case "end":
              return _context26.stop();
          }
        }
      }, _callee26, this);
    }));

    function tezosSignTransaction(_x57) {
      return _tezosSignTransaction.apply(this, arguments);
    }

    return tezosSignTransaction;
  }() // Tezos: end
  ;

  _proto.cipherKeyValue =
  /*#__PURE__*/
  function () {
    var _cipherKeyValue = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee27(address_n, key, value, encrypt, ask_on_encrypt, ask_on_decrypt, iv // in hexadecimal
    ) {
      var valueString, ivString, response;
      return _regenerator.default.wrap(function _callee27$(_context27) {
        while (1) {
          switch (_context27.prev = _context27.next) {
            case 0:
              valueString = value instanceof Buffer ? value.toString('hex') : value;
              ivString = iv instanceof Buffer ? iv.toString('hex') : iv;
              _context27.next = 4;
              return this.typedCall('CipherKeyValue', 'CipheredKeyValue', {
                address_n: address_n,
                key: key,
                value: valueString,
                encrypt: encrypt,
                ask_on_encrypt: ask_on_encrypt,
                ask_on_decrypt: ask_on_decrypt,
                iv: ivString
              });

            case 4:
              response = _context27.sent;
              return _context27.abrupt("return", response.message);

            case 6:
            case "end":
              return _context27.stop();
          }
        }
      }, _callee27, this);
    }));

    function cipherKeyValue(_x58, _x59, _x60, _x61, _x62, _x63, _x64) {
      return _cipherKeyValue.apply(this, arguments);
    }

    return cipherKeyValue;
  }();

  _proto.signIdentity =
  /*#__PURE__*/
  function () {
    var _signIdentity = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee28(identity, challenge_hidden, challenge_visual) {
      var response;
      return _regenerator.default.wrap(function _callee28$(_context28) {
        while (1) {
          switch (_context28.prev = _context28.next) {
            case 0:
              _context28.next = 2;
              return this.typedCall('SignIdentity', 'SignedIdentity', {
                identity: identity,
                challenge_hidden: challenge_hidden,
                challenge_visual: challenge_visual
              });

            case 2:
              response = _context28.sent;
              return _context28.abrupt("return", response.message);

            case 4:
            case "end":
              return _context28.stop();
          }
        }
      }, _callee28, this);
    }));

    function signIdentity(_x65, _x66, _x67) {
      return _signIdentity.apply(this, arguments);
    }

    return signIdentity;
  }() // async clearSession(): Promise<MessageResponse<trezor.Success>> {
  ;

  _proto.clearSession =
  /*#__PURE__*/
  function () {
    var _clearSession = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee29(settings) {
      return _regenerator.default.wrap(function _callee29$(_context29) {
        while (1) {
          switch (_context29.prev = _context29.next) {
            case 0:
              _context29.next = 2;
              return this.typedCall('ClearSession', 'Success', settings);

            case 2:
              return _context29.abrupt("return", _context29.sent);

            case 3:
            case "end":
              return _context29.stop();
          }
        }
      }, _callee29, this);
    }));

    function clearSession(_x68) {
      return _clearSession.apply(this, arguments);
    }

    return clearSession;
  }();

  _proto.initialize =
  /*#__PURE__*/
  function () {
    var _initialize = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee30(useEmptyPassphrase) {
      var payload, response;
      return _regenerator.default.wrap(function _callee30$(_context30) {
        while (1) {
          switch (_context30.prev = _context30.next) {
            case 0:
              if (useEmptyPassphrase === void 0) {
                useEmptyPassphrase = false;
              }

              if (!this.disposed) {
                _context30.next = 3;
                break;
              }

              throw new Error('DeviceCommands already disposed');

            case 3:
              payload = {};

              if (!this.device.isT1()) {
                // T2 features
                payload.state = this.device.getExpectedState() || this.device.getState();

                if (useEmptyPassphrase) {
                  payload.skip_passphrase = useEmptyPassphrase;
                  payload.state = null;
                }
              }

              _context30.next = 7;
              return this.call('Initialize', payload);

            case 7:
              response = _context30.sent;
              assertType(response, 'Features');
              return _context30.abrupt("return", response);

            case 10:
            case "end":
              return _context30.stop();
          }
        }
      }, _callee30, this);
    }));

    function initialize(_x69) {
      return _initialize.apply(this, arguments);
    }

    return initialize;
  }();

  _proto.wipe =
  /*#__PURE__*/
  function () {
    var _wipe = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee31() {
      var response;
      return _regenerator.default.wrap(function _callee31$(_context31) {
        while (1) {
          switch (_context31.prev = _context31.next) {
            case 0:
              _context31.next = 2;
              return this.typedCall('WipeDevice', 'Success');

            case 2:
              response = _context31.sent;
              return _context31.abrupt("return", response.message);

            case 4:
            case "end":
              return _context31.stop();
          }
        }
      }, _callee31, this);
    }));

    function wipe() {
      return _wipe.apply(this, arguments);
    }

    return wipe;
  }();

  _proto.reset =
  /*#__PURE__*/
  function () {
    var _reset = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee32(flags) {
      var response;
      return _regenerator.default.wrap(function _callee32$(_context32) {
        while (1) {
          switch (_context32.prev = _context32.next) {
            case 0:
              _context32.next = 2;
              return this.typedCall('ResetDevice', 'Success', flags);

            case 2:
              response = _context32.sent;
              return _context32.abrupt("return", response.message);

            case 4:
            case "end":
              return _context32.stop();
          }
        }
      }, _callee32, this);
    }));

    function reset(_x70) {
      return _reset.apply(this, arguments);
    }

    return reset;
  }();

  _proto.load =
  /*#__PURE__*/
  function () {
    var _load = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee33(flags) {
      var response;
      return _regenerator.default.wrap(function _callee33$(_context33) {
        while (1) {
          switch (_context33.prev = _context33.next) {
            case 0:
              _context33.next = 2;
              return this.typedCall('LoadDevice', 'Success', flags);

            case 2:
              response = _context33.sent;
              return _context33.abrupt("return", response.message);

            case 4:
            case "end":
              return _context33.stop();
          }
        }
      }, _callee33, this);
    }));

    function load(_x71) {
      return _load.apply(this, arguments);
    }

    return load;
  }();

  _proto.applyFlags =
  /*#__PURE__*/
  function () {
    var _applyFlags = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee34(params) {
      var response;
      return _regenerator.default.wrap(function _callee34$(_context34) {
        while (1) {
          switch (_context34.prev = _context34.next) {
            case 0:
              _context34.next = 2;
              return this.typedCall('ApplyFlags', 'Success', params);

            case 2:
              response = _context34.sent;
              return _context34.abrupt("return", response.message);

            case 4:
            case "end":
              return _context34.stop();
          }
        }
      }, _callee34, this);
    }));

    function applyFlags(_x72) {
      return _applyFlags.apply(this, arguments);
    }

    return applyFlags;
  }();

  _proto.applySettings =
  /*#__PURE__*/
  function () {
    var _applySettings = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee35(params) {
      var response;
      return _regenerator.default.wrap(function _callee35$(_context35) {
        while (1) {
          switch (_context35.prev = _context35.next) {
            case 0:
              _context35.next = 2;
              return this.typedCall('ApplySettings', 'Success', params);

            case 2:
              response = _context35.sent;
              return _context35.abrupt("return", response.message);

            case 4:
            case "end":
              return _context35.stop();
          }
        }
      }, _callee35, this);
    }));

    function applySettings(_x73) {
      return _applySettings.apply(this, arguments);
    }

    return applySettings;
  }();

  _proto.backupDevice =
  /*#__PURE__*/
  function () {
    var _backupDevice = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee36() {
      var response;
      return _regenerator.default.wrap(function _callee36$(_context36) {
        while (1) {
          switch (_context36.prev = _context36.next) {
            case 0:
              _context36.next = 2;
              return this.typedCall('BackupDevice', 'Success');

            case 2:
              response = _context36.sent;
              return _context36.abrupt("return", response.message);

            case 4:
            case "end":
              return _context36.stop();
          }
        }
      }, _callee36, this);
    }));

    function backupDevice() {
      return _backupDevice.apply(this, arguments);
    }

    return backupDevice;
  }();

  _proto.changePin =
  /*#__PURE__*/
  function () {
    var _changePin = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee37(params) {
      var response;
      return _regenerator.default.wrap(function _callee37$(_context37) {
        while (1) {
          switch (_context37.prev = _context37.next) {
            case 0:
              _context37.next = 2;
              return this.typedCall('ChangePin', 'Success', params);

            case 2:
              response = _context37.sent;
              return _context37.abrupt("return", response.message);

            case 4:
            case "end":
              return _context37.stop();
          }
        }
      }, _callee37, this);
    }));

    function changePin(_x74) {
      return _changePin.apply(this, arguments);
    }

    return changePin;
  }();

  _proto.firmwareErase =
  /*#__PURE__*/
  function () {
    var _firmwareErase = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee38(params) {
      var response;
      return _regenerator.default.wrap(function _callee38$(_context38) {
        while (1) {
          switch (_context38.prev = _context38.next) {
            case 0:
              _context38.next = 2;
              return this.typedCall('FirmwareErase', this.device.features.major_version === 1 ? 'Success' : 'FirmwareRequest', params);

            case 2:
              response = _context38.sent;
              return _context38.abrupt("return", response.message);

            case 4:
            case "end":
              return _context38.stop();
          }
        }
      }, _callee38, this);
    }));

    function firmwareErase(_x75) {
      return _firmwareErase.apply(this, arguments);
    }

    return firmwareErase;
  }();

  _proto.firmwareUpload =
  /*#__PURE__*/
  function () {
    var _firmwareUpload = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee39(params) {
      var response;
      return _regenerator.default.wrap(function _callee39$(_context39) {
        while (1) {
          switch (_context39.prev = _context39.next) {
            case 0:
              _context39.next = 2;
              return this.typedCall('FirmwareUpload', 'Success', params);

            case 2:
              response = _context39.sent;
              return _context39.abrupt("return", response.message);

            case 4:
            case "end":
              return _context39.stop();
          }
        }
      }, _callee39, this);
    }));

    function firmwareUpload(_x76) {
      return _firmwareUpload.apply(this, arguments);
    }

    return firmwareUpload;
  }();

  _proto.recoveryDevice =
  /*#__PURE__*/
  function () {
    var _recoveryDevice = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee40(params) {
      var response;
      return _regenerator.default.wrap(function _callee40$(_context40) {
        while (1) {
          switch (_context40.prev = _context40.next) {
            case 0:
              _context40.next = 2;
              return this.typedCall('RecoveryDevice', 'Success', params);

            case 2:
              response = _context40.sent;
              return _context40.abrupt("return", response.message);

            case 4:
            case "end":
              return _context40.stop();
          }
        }
      }, _callee40, this);
    }));

    function recoveryDevice(_x77) {
      return _recoveryDevice.apply(this, arguments);
    }

    return recoveryDevice;
  }() // Sends an async message to the opened device.
  ;

  _proto.call =
  /*#__PURE__*/
  function () {
    var _call = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee41(type, msg) {
      var logMessage, res, _logMessage;

      return _regenerator.default.wrap(function _callee41$(_context41) {
        while (1) {
          switch (_context41.prev = _context41.next) {
            case 0:
              if (msg === void 0) {
                msg = {};
              }

              logMessage = filterForLog(type, msg);

              if (this.debug) {
                console.log('[DeviceCommands] [call] Sending', type, logMessage, this.transport);
              }

              _context41.prev = 3;
              _context41.next = 6;
              return this.transport.call(this.sessionId, type, msg, false);

            case 6:
              res = _context41.sent;
              _logMessage = filterForLog(res.type, res.message);

              if (this.debug) {
                console.log('[DeviceCommands] [call] Received', res.type, _logMessage);
              }

              return _context41.abrupt("return", res);

            case 12:
              _context41.prev = 12;
              _context41.t0 = _context41["catch"](3);

              if (this.debug) {
                console.warn('[DeviceCommands] [call] Received error', _context41.t0);
              } // TODO: throw trezor error


              throw _context41.t0;

            case 16:
            case "end":
              return _context41.stop();
          }
        }
      }, _callee41, this, [[3, 12]]);
    }));

    function call(_x78, _x79) {
      return _call.apply(this, arguments);
    }

    return call;
  }();

  _proto.typedCall =
  /*#__PURE__*/
  function () {
    var _typedCall = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee42(type, resType, msg) {
      var response;
      return _regenerator.default.wrap(function _callee42$(_context42) {
        while (1) {
          switch (_context42.prev = _context42.next) {
            case 0:
              if (msg === void 0) {
                msg = {};
              }

              if (!this.disposed) {
                _context42.next = 3;
                break;
              }

              throw new Error('DeviceCommands already disposed');

            case 3:
              _context42.next = 5;
              return this._commonCall(type, msg);

            case 5:
              response = _context42.sent;
              assertType(response, resType);
              return _context42.abrupt("return", response);

            case 8:
            case "end":
              return _context42.stop();
          }
        }
      }, _callee42, this);
    }));

    function typedCall(_x80, _x81, _x82) {
      return _typedCall.apply(this, arguments);
    }

    return typedCall;
  }();

  _proto._commonCall =
  /*#__PURE__*/
  function () {
    var _commonCall2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee43(type, msg) {
      var resp;
      return _regenerator.default.wrap(function _callee43$(_context43) {
        while (1) {
          switch (_context43.prev = _context43.next) {
            case 0:
              _context43.prev = 0;
              _context43.next = 3;
              return this.call(type, msg);

            case 3:
              resp = _context43.sent;
              _context43.next = 6;
              return this._filterCommonTypes(resp);

            case 6:
              return _context43.abrupt("return", _context43.sent);

            case 9:
              _context43.prev = 9;
              _context43.t0 = _context43["catch"](0);
              throw _context43.t0;

            case 12:
            case "end":
              return _context43.stop();
          }
        }
      }, _callee43, this, [[0, 9]]);
    }));

    function _commonCall(_x83, _x84) {
      return _commonCall2.apply(this, arguments);
    }

    return _commonCall;
  }();

  _proto._filterCommonTypes =
  /*#__PURE__*/
  function () {
    var _filterCommonTypes2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee44(res) {
      var _this = this;

      var e, state, _state;

      return _regenerator.default.wrap(function _callee44$(_context44) {
        while (1) {
          switch (_context44.prev = _context44.next) {
            case 0:
              if (!(res.type === 'Failure')) {
                _context44.next = 4;
                break;
              }

              e = new Error(res.message.message); // $FlowIssue extending errors in ES6 "correctly" is a PITA

              e.code = res.message.code;
              return _context44.abrupt("return", Promise.reject(e));

            case 4:
              if (!(res.type === 'ButtonRequest')) {
                _context44.next = 7;
                break;
              }

              this.device.emit('button', this.device, res.message.code);
              return _context44.abrupt("return", this._commonCall('ButtonAck', {}));

            case 7:
              if (!(res.type === 'EntropyRequest')) {
                _context44.next = 9;
                break;
              }

              return _context44.abrupt("return", this._commonCall('EntropyAck', {
                entropy: generateEntropy(32).toString('hex')
              }));

            case 9:
              if (!(res.type === 'PinMatrixRequest')) {
                _context44.next = 11;
                break;
              }

              return _context44.abrupt("return", this._promptPin(res.message.type).then(function (pin) {
                return _this._commonCall('PinMatrixAck', {
                  pin: pin
                });
              }, function () {
                return _this._commonCall('Cancel', {});
              }));

            case 11:
              if (!(res.type === 'PassphraseRequest')) {
                _context44.next = 17;
                break;
              }

              state = !this.device.isT1() ? this.device.getExpectedState() || this.device.getState() : null;

              if (!res.message.on_device) {
                _context44.next = 16;
                break;
              }

              this.device.emit(DEVICE.PASSPHRASE_ON_DEVICE, this.device);
              return _context44.abrupt("return", this._commonCall('PassphraseAck', {
                state: state
              }));

            case 16:
              return _context44.abrupt("return", this._promptPassphrase().then(function (passphrase) {
                return _this._commonCall('PassphraseAck', {
                  passphrase: passphrase,
                  state: state
                });
              }, function (err) {
                return _this._commonCall('Cancel', {}).catch(function (e) {
                  throw err || e;
                });
              }));

            case 17:
              if (!(res.type === 'PassphraseStateRequest')) {
                _context44.next = 21;
                break;
              }

              _state = res.message.state;
              this.device.setTemporaryState(_state);
              return _context44.abrupt("return", this._commonCall('PassphraseStateAck', {}));

            case 21:
              if (!(res.type === 'WordRequest')) {
                _context44.next = 23;
                break;
              }

              return _context44.abrupt("return", this._promptWord(res.message.type).then(function (word) {
                return _this._commonCall('WordAck', {
                  word: word
                });
              }, function () {
                return _this._commonCall('Cancel', {});
              }));

            case 23:
              return _context44.abrupt("return", Promise.resolve(res));

            case 24:
            case "end":
              return _context44.stop();
          }
        }
      }, _callee44, this);
    }));

    function _filterCommonTypes(_x85) {
      return _filterCommonTypes2.apply(this, arguments);
    }

    return _filterCommonTypes;
  }();

  _proto._promptPin = function _promptPin(type) {
    var _this2 = this;

    return new Promise(function (resolve, reject) {
      if (_this2.device.listenerCount(DEVICE.PIN) > 0) {
        _this2.device.emit(DEVICE.PIN, _this2.device, type, function (err, pin) {
          if (err || pin == null) {
            reject(err);
          } else {
            resolve(pin);
          }
        });
      } else {
        // if (this.session.debug) {
        console.warn('[DeviceCommands] [call] PIN callback not configured, cancelling request'); // }

        reject(new Error('PIN callback not configured'));
      }
    });
  };

  _proto._promptPassphrase = function _promptPassphrase() {
    var _this3 = this;

    return new Promise(function (resolve, reject) {
      if (_this3.device.listenerCount(DEVICE.PASSPHRASE) > 0) {
        _this3.device.emit(DEVICE.PASSPHRASE, _this3.device, function (err, passphrase) {
          if (err || passphrase == null) {
            reject(err);
          } else {
            resolve(passphrase.normalize('NFKD'));
          }
        });
      } else {
        // if (this.session.debug) {
        console.warn('[DeviceCommands] [call] Passphrase callback not configured, cancelling request'); // }

        reject(new Error('Passphrase callback not configured'));
      }
    });
  };

  _proto._promptWord = function _promptWord(type) {
    var _this4 = this;

    return new Promise(function (resolve, reject) {
      _this4.device.emit(DEVICE.WORD, _this4.device, type, function (err, word) {
        if (err || word == null) {
          reject(err);
        } else {
          resolve(word.toLocaleLowerCase());
        }
      });
    });
  } // DebugLink messages
  ;

  _proto.debugLinkDecision =
  /*#__PURE__*/
  function () {
    var _debugLinkDecision = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee45(msg) {
      var session;
      return _regenerator.default.wrap(function _callee45$(_context45) {
        while (1) {
          switch (_context45.prev = _context45.next) {
            case 0:
              _context45.next = 2;
              return this.transport.acquire({
                path: this.device.originalDescriptor.path,
                previous: this.device.originalDescriptor.debugSession
              }, true);

            case 2:
              session = _context45.sent;
              _context45.next = 5;
              return (0, _promiseUtils.resolveAfter)(501, null);

            case 5:
              _context45.next = 7;
              return this.transport.post(session, 'DebugLinkDecision', msg, true);

            case 7:
              _context45.next = 9;
              return this.transport.release(session, true, true);

            case 9:
              this.device.originalDescriptor.debugSession = null; // make sure there are no leftovers

              _context45.next = 12;
              return (0, _promiseUtils.resolveAfter)(501, null);

            case 12:
            case "end":
              return _context45.stop();
          }
        }
      }, _callee45, this);
    }));

    function debugLinkDecision(_x86) {
      return _debugLinkDecision.apply(this, arguments);
    }

    return debugLinkDecision;
  }();

  _proto.debugLinkGetState =
  /*#__PURE__*/
  function () {
    var _debugLinkGetState = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee46(msg) {
      var session, response;
      return _regenerator.default.wrap(function _callee46$(_context46) {
        while (1) {
          switch (_context46.prev = _context46.next) {
            case 0:
              _context46.next = 2;
              return this.transport.acquire({
                path: this.device.originalDescriptor.path,
                previous: this.device.originalDescriptor.debugSession
              }, true);

            case 2:
              session = _context46.sent;
              _context46.next = 5;
              return (0, _promiseUtils.resolveAfter)(501, null);

            case 5:
              _context46.next = 7;
              return this.transport.call(session, 'DebugLinkGetState', {}, true);

            case 7:
              response = _context46.sent;
              assertType(response, 'DebugLinkState');
              _context46.next = 11;
              return this.transport.release(session, true, true);

            case 11:
              _context46.next = 13;
              return (0, _promiseUtils.resolveAfter)(501, null);

            case 13:
              return _context46.abrupt("return", response.message);

            case 14:
            case "end":
              return _context46.stop();
          }
        }
      }, _callee46, this);
    }));

    function debugLinkGetState(_x87) {
      return _debugLinkGetState.apply(this, arguments);
    }

    return debugLinkGetState;
  }();

  return DeviceCommands;
}();

exports.default = DeviceCommands;