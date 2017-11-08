'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.loadBlockRange = loadBlockRange;

var _channel = require('./channel');

// Some helper functions for loading block status
// from blockchain

function loadBlockRange(initialState) {
    var pBlock = initialState.lastBlock;

    return getBlock(0).then(function (nullBlock) {
        return getCurrentBlock().then(function (last) {
            var first = pBlock.height !== 0 ? getBlock(pBlock.height).then(function (block) {
                if (block.hash === pBlock.hash) {
                    return block;
                } else {
                    console.warn('Blockhash mismatch', pBlock, block);
                    return nullBlock;
                }
            }, function (err) {
                if (err.message === 'RPCError: Block height out of range') {
                    console.warn('Block height out of range', pBlock.height);
                    return nullBlock;
                }
                throw err;
            }) : Promise.resolve(nullBlock);

            return Promise.all([first, last]).then(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 2),
                    first = _ref2[0],
                    last = _ref2[1];

                return { first: first, last: last, nullBlock: nullBlock };
            });
        });
    });
}

function getBlock(height) {
    return (0, _channel.lookupBlockHash)(height).then(function (hash) {
        return { hash: hash, height: height };
    });
}

function getCurrentBlock() {
    return (0, _channel.lookupSyncStatus)().then(function (height) {
        return getBlock(height);
    });
}