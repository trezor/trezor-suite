"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.legacyBitcoreHandler = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _formatUtils = require("../../../../utils/formatUtils");

var _backend = _interopRequireDefault(require("../../../../backend"));

// special case - when blockchain is empty and returns same levels for all 3,
var emptyBlockchain = false;
var feeLevels = [{
  id: 0,
  name: 'high',
  info: {
    type: 'bitcore-legacy',
    blocks: 2
  }
}, {
  name: 'normal',
  id: 1,
  info: {
    type: 'bitcore-legacy',
    blocks: 6
  }
}, {
  name: 'economy',
  id: 2,
  info: {
    type: 'bitcore-legacy',
    blocks: 25 // 25 is max

  }
}];
var oneFeeLevel = {
  name: 'normal',
  id: 1,
  info: {
    type: 'bitcore-legacy',
    blocks: 6
  }
};
var fees = null;

var detectEmptyBlockchain = function detectEmptyBlockchain(fees) {
  var setFees = new Set();
  Object.keys(fees).forEach(function (f) {
    return setFees.add(fees[parseInt(f)]);
  }); // parseInt for flow

  return setFees.size === 1;
}; // We have stuff from bitcore in blocks, BUT
// bitcore sometimes returns "-1" randomly (as does bitcoind)
// we try all the bigger ones, hopefully we get hit
// 25 is the largest we can ask


var getMinFee = function getMinFee(start, input) {
  for (var i = start; i <= 145; i++) {
    if (input[i]) {
      return input[i]; // trying all the bigger ones until the end
    }
  }

  return null;
}; // This gets "dirty" bitcore output as input and returns something usable, level -> fee


var deriveFeeList = function deriveFeeList(input) {
  var res = {};
  var allblocks = feeLevels.reduce(function (pr, level) {
    return pr.concat([level.info.blocks]);
  }, []);

  for (var _iterator = allblocks, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var _blocks = _ref;
    var fee = getMinFee(_blocks, input);

    if (fee == null) {
      return; // if even one is not found at all -> fail
    }

    res[_blocks] = (0, _formatUtils.btckb2satoshib)(fee);
  }

  return res;
};

var refresh =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(backend) {
    var blockquery, readFees, newActualFees;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // I need blocks and blocks+1 in the case that bitcore returns -1 for low levels
            blockquery = feeLevels.reduce(function (pr, level) {
              return pr.concat([level.info.blocks, level.info.blocks + 1]);
            }, []);
            _context.next = 3;
            return backend.blockchain.estimateTxFees(blockquery, true);

          case 3:
            readFees = _context.sent;
            newActualFees = deriveFeeList(readFees);

            if (newActualFees != null) {
              fees = newActualFees;
              emptyBlockchain = detectEmptyBlockchain(newActualFees);
            }

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function refresh(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var detectWorking =
/*#__PURE__*/
function () {
  var _ref3 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(backend) {
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return refresh(backend);

          case 3:
            return _context2.abrupt("return", fees != null);

          case 6:
            _context2.prev = 6;
            _context2.t0 = _context2["catch"](0);
            return _context2.abrupt("return", false);

          case 9:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[0, 6]]);
  }));

  return function detectWorking(_x2) {
    return _ref3.apply(this, arguments);
  };
}();

var getFeeList = function getFeeList() {
  return emptyBlockchain ? [oneFeeLevel] : feeLevels;
};

var getFee = function getFee(level) {
  if (level.type === 'bitcore-legacy') {
    if (fees == null) {
      throw new Error('actualFees is null');
    }

    return fees[level.blocks];
  }

  throw new Error('Wrong level type');
};

var getBlocks = function getBlocks(fee) {
  if (fees == null) {
    throw new Error('actualFees is null');
  }

  for (var _iterator2 = Object.keys(fees).map(function (k) {
    return parseInt(k);
  }).sort(function (a, b) {
    return a - b;
  }), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
    var _ref4;

    if (_isArray2) {
      if (_i2 >= _iterator2.length) break;
      _ref4 = _iterator2[_i2++];
    } else {
      _i2 = _iterator2.next();
      if (_i2.done) break;
      _ref4 = _i2.value;
    }

    var _blocks2 = _ref4;

    if (fees[_blocks2] === fee) {
      return _blocks2;
    }
  }

  return null;
};

var legacyBitcoreHandler = {
  refresh: refresh,
  detectWorking: detectWorking,
  getFeeList: getFeeList,
  getFee: getFee,
  getBlocks: getBlocks
};
exports.legacyBitcoreHandler = legacyBitcoreHandler;