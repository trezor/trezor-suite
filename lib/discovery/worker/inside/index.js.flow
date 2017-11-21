'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

// This is the entry to the worker, doing account discovery + analysis

var _channel = require('./channel');

var channel = _interopRequireWildcard(_channel);

var _blocks = require('./blocks');

var _getChainTransactions = require('./get-chain-transactions');

var _integrateNewTxs = require('./integrate-new-txs');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Default starting info being used, when there is null
var defaultInfo = {
    utxos: [],
    transactions: [],
    usedAddresses: [],
    unusedAddresses: [],
    changeIndex: 0,
    balance: 0,
    sentAddresses: {},
    lastBlock: { height: 0, hash: 'abcd' },
    transactionHashes: {},
    changeAddresses: [],
    allowChange: false,
    lastConfirmedChange: -1,
    lastConfirmedMain: -1,
    version: 3
};

var recvInfo = void 0;
var recvNetwork = void 0;
var recvXpub = void 0;
var recvSegwit = void 0;
var recvWebAssembly = void 0;

// init on worker start
channel.initPromise.then(function (_ref) {
    var accountInfo = _ref.accountInfo,
        network = _ref.network,
        xpub = _ref.xpub,
        segwit = _ref.segwit,
        webassembly = _ref.webassembly;

    recvInfo = accountInfo;
    recvNetwork = network;
    recvSegwit = segwit;
    recvXpub = xpub;
    recvWebAssembly = webassembly;
});

channel.startDiscoveryPromise.then(function () {
    var initialState = recvInfo == null ? defaultInfo : recvInfo;

    // version null => 1 added infos about fees and sizes; we cannot calculate that
    // version 2 was correction in mytrezor
    // v3 added info, whether utxo is my own or not
    // so we have to re-download everything -> setting initial state as if nothing is known
    if (initialState.version == null || initialState.version < 3) {
        initialState = defaultInfo;
    }

    // first load blocks, then count last used indexes,
    // then start asking for new transactions,
    // then integrate new transactions into old transactions
    (0, _blocks.loadBlockRange)(initialState).then(function (range) {
        // when starting from 0, take as if there is no info
        var oldState = range.first.height === 0 ? defaultInfo : initialState;

        var lastUsedMain = oldState.usedAddresses.length - 1;
        var lastUsedChange = oldState.changeIndex - 1;
        var lastConfirmedMain = oldState.lastConfirmedMain == null ? lastUsedMain : oldState.lastConfirmedMain;
        var lastConfirmedChange = oldState.lastConfirmedChange == null ? lastUsedChange : oldState.lastConfirmedChange;

        var unconfirmedTxids = oldState.transactions.filter(function (t) {
            return t.height == null;
        }).map(function (t) {
            return t.hash;
        });

        var mainAddresses = oldState.usedAddresses.map(function (a) {
            return a.address;
        }).concat(oldState.unusedAddresses);
        var changeAddresses = oldState.changeAddresses;

        // get all the new info, then...
        return discoverAccount(range, [lastConfirmedMain, lastConfirmedChange], oldState.transactions, mainAddresses, changeAddresses).then(function (newInfo) {
            // then find out deleted info
            var deletedP = (0, _getChainTransactions.findDeleted)(unconfirmedTxids, channel.doesTransactionExist);
            var resP = deletedP.then(function (deleted) {
                // ... then integrate
                return (0, _integrateNewTxs.integrateNewTxs)(newInfo, oldState, range.last, deleted);
            });
            return resP;
        });
    }).then(
    // either success or failure
    // (other side will shut down the worker then)
    function (result) {
        return channel.returnSuccess(result);
    }, function (error) {
        return channel.returnError(error);
    });
});

function discoverAccount(range, lastUsedAddresses, transactions, mainAddresses, changeAddresses) {
    return Promise.all([new _getChainTransactions.GetChainTransactions(0, range, lastUsedAddresses[0], channel.chunkTransactions, transactions, mainAddresses, recvNetwork, recvXpub, recvSegwit, recvWebAssembly).discover(), new _getChainTransactions.GetChainTransactions(1, range, lastUsedAddresses[1], channel.chunkTransactions, [], changeAddresses, recvNetwork, recvXpub, recvSegwit, recvWebAssembly).discover()]).then(function (_ref2) {
        var _ref3 = _slicedToArray(_ref2, 2),
            main = _ref3[0],
            change = _ref3[1];

        return { main: main, change: change };
    });
}