"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.smartBitcoreHandler = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _bignumber = _interopRequireDefault(require("bignumber.js"));

var _formatUtils = require("../../../../utils/formatUtils");

var _backend = _interopRequireDefault(require("../../../../backend"));

var feeLevels = [{
  name: 'high',
  id: 0,
  info: {
    type: 'bitcore-smart',
    blocks: 2 // lowest possible

  }
}, {
  name: 'normal',
  id: 1,
  info: {
    type: 'bitcore-smart',
    blocks: 6 // 1 hour

  }
}, {
  name: 'economy',
  id: 2,
  info: {
    type: 'bitcore-smart',
    blocks: 36 // 6 hours

  }
}, {
  name: 'low',
  id: 3,
  info: {
    type: 'bitcore-smart',
    blocks: 144 * 3 // 3 days

  }
}];
var fees = {};
var backend;

function range(from, length) {
  var res = [];

  for (var i = 0; i < length; i++) {
    res.push(i + from);
  }

  return res;
}

function _refreshQuery(_x, _x2) {
  return _refreshQuery2.apply(this, arguments);
}

function _refreshQuery2() {
  _refreshQuery2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(query, res) {
    var fees, blocksS, blocks, fee, i, j, bn;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return backend.blockchain.estimateSmartTxFees(query, true);

          case 2:
            fees = _context.sent;

            for (blocksS in fees) {
              blocks = parseInt(blocksS);
              fee = fees[blocks];
              res[blocks] = (0, _formatUtils.btckb2satoshib)(fee);
            }

            for (i = 0; i <= query.length - 2; i++) {
              if (res[query[i]] === '-1') {
                for (j = query.length - 1; j >= i + 1; j--) {
                  bn = new _bignumber.default(res[query[j]]);

                  if (bn.gt(0)) {
                    res[query[i]] = res[query[j]];
                  }
                }
              }
            }

            if (!(res[query[query.length - 1]] === '1')) {
              _context.next = 7;
              break;
            }

            return _context.abrupt("return", false);

          case 7:
            return _context.abrupt("return", true);

          case 8:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _refreshQuery2.apply(this, arguments);
}

function _refresh2(_x3) {
  return _refresh.apply(this, arguments);
}

function _refresh() {
  _refresh = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(first) {
    var res, query, cont, last, end, _query;

    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            res = {};

            if (!first) {
              _context2.next = 7;
              break;
            }

            // first -> only query the fee levels, so we don't need to wait for all levels
            // and we see levels immediately, with worse time estimate
            query = feeLevels.map(function (level) {
              return level.info.blocks;
            });
            _context2.next = 5;
            return _refreshQuery(query, res);

          case 5:
            _context2.next = 19;
            break;

          case 7:
            // next refreshes -> query all levels for more exact time estimates
            cont = true;
            last = 2;
            end = feeLevels[feeLevels.length - 1].info.blocks;

          case 10:
            if (!cont) {
              _context2.next = 19;
              break;
            }

            _query = range(last, 10);
            _context2.next = 14;
            return _refreshQuery(_query, res);

          case 14:
            cont = _context2.sent;
            last += 10;
            cont = cont && last <= end;
            _context2.next = 10;
            break;

          case 19:
            fees = res;

          case 20:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _refresh.apply(this, arguments);
}

function detectWorking(_x4) {
  return _detectWorking.apply(this, arguments);
}

function _detectWorking() {
  _detectWorking = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3($backend) {
    var lfees;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            backend = $backend;

            if (backend.blockchain.hasSmartTxFees) {
              _context3.next = 3;
              break;
            }

            return _context3.abrupt("return", false);

          case 3:
            _context3.next = 5;
            return backend.blockchain.estimateSmartTxFees([1007], true);

          case 5:
            lfees = _context3.sent;

            if (!(lfees[1007] === '-1')) {
              _context3.next = 8;
              break;
            }

            return _context3.abrupt("return", false);

          case 8:
            _context3.next = 10;
            return _refresh2(true);

          case 10:
            _refresh2(false);

            return _context3.abrupt("return", new _bignumber.default(fees[2]).gt(0));

          case 12:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _detectWorking.apply(this, arguments);
}

function getFeeList() {
  return feeLevels;
}

function getFee(level) {
  if (level.type === 'bitcore-smart') {
    if (fees == null) {
      throw new Error('fees is null');
    }

    if (fees[level.blocks] == null) {
      return '1';
    }

    return fees[level.blocks];
  }

  throw new Error('Wrong level type');
}

function getBlocks(fee) {
  var bn = new _bignumber.default(fee);

  if (bn.lt(1)) {
    return null;
  }

  for (var block = 1008; block >= 2; block--) {
    var blockfee = fees[block] === null ? '1' : fees[block];

    if (bn.lt(blockfee)) {
      for (var biggerBlock = block + 1; biggerBlock < 1008; biggerBlock++) {
        if (fees[biggerBlock] != null) {
          return biggerBlock;
        }
      }

      return block + 1;
    }
  }

  return 2;
}

var smartBitcoreHandler = {
  refresh: function refresh() {
    return _refresh2(false);
  },
  detectWorking: detectWorking,
  getFeeList: getFeeList,
  getFee: getFee,
  getBlocks: getBlocks
};
exports.smartBitcoreHandler = smartBitcoreHandler;