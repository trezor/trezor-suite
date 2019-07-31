'use strict';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.createTx = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var bs58check = _interopRequireWildcard(require("bs58check"));

var _paramsValidator = require("./../helpers/paramsValidator");

var prefix = {
  B: new Uint8Array([1, 52]),
  tz1: new Uint8Array([6, 161, 159]),
  tz2: new Uint8Array([6, 161, 161]),
  tz3: new Uint8Array([6, 161, 164]),
  KT1: new Uint8Array([2, 90, 121]),
  edpk: new Uint8Array([13, 15, 37, 217]),
  sppk: new Uint8Array([3, 254, 226, 86]),
  p2pk: new Uint8Array([3, 178, 139, 127])
};

var bs58checkDecode = function bs58checkDecode(prefix, enc) {
  return bs58check.decode(enc).slice(prefix.length);
};

var concatArray = function concatArray(first, second) {
  var result = new Uint8Array(first.length + second.length);
  result.set(first);
  result.set(second, first.length);
  return result;
}; // convert publicKeyHash to buffer


var publicKeyHash2buffer = function publicKeyHash2buffer(publicKeyHash) {
  switch (publicKeyHash.substr(0, 3)) {
    case 'tz1':
      return {
        originated: 0,
        hash: concatArray(new Uint8Array([0]), bs58checkDecode(prefix.tz1, publicKeyHash))
      };

    case 'tz2':
      return {
        originated: 0,
        hash: concatArray(new Uint8Array([1]), bs58checkDecode(prefix.tz2, publicKeyHash))
      };

    case 'tz3':
      return {
        originated: 0,
        hash: concatArray(new Uint8Array([2]), bs58checkDecode(prefix.tz3, publicKeyHash))
      };

    case 'KT1':
      return {
        originated: 1,
        hash: concatArray(bs58checkDecode(prefix.KT1, publicKeyHash), new Uint8Array([0]))
      };

    default:
      throw new Error('Wrong Tezos publicKeyHash address');
  }
}; // convert publicKeyHash to buffer


var publicKey2buffer = function publicKey2buffer(publicKey) {
  switch (publicKey.substr(0, 4)) {
    case 'edpk':
      return concatArray(new Uint8Array([0]), bs58checkDecode(prefix.edpk, publicKey));

    case 'sppk':
      return concatArray(new Uint8Array([1]), bs58checkDecode(prefix.sppk, publicKey));

    case 'p2pk':
      return concatArray(new Uint8Array([2]), bs58checkDecode(prefix.p2pk, publicKey));

    default:
      throw new Error('Wrong Tezos publicKey ');
  }
};

var createTx = function createTx(address_n, branch, operation) {
  var message = {
    address_n: address_n,
    branch: bs58checkDecode(prefix.B, branch)
  }; // reveal public key

  if (operation.reveal) {
    var reveal = operation.reveal; // validate reveal parameters

    (0, _paramsValidator.validateParams)(reveal, [{
      name: 'source',
      type: 'string',
      obligatory: true
    }, {
      name: 'public_key',
      type: 'string',
      obligatory: true
    }, {
      name: 'fee',
      type: 'number',
      obligatory: true
    }, {
      name: 'counter',
      type: 'number',
      obligatory: true
    }, {
      name: 'gas_limit',
      type: 'number',
      obligatory: true
    }, {
      name: 'storage_limit',
      type: 'number',
      obligatory: true
    }]);
    message = (0, _objectSpread2.default)({}, message, {
      reveal: {
        source: {
          tag: publicKeyHash2buffer(reveal.source).originated,
          hash: publicKeyHash2buffer(reveal.source).hash
        },
        public_key: publicKey2buffer(reveal.public_key),
        fee: reveal.fee,
        counter: reveal.counter,
        gas_limit: reveal.gas_limit,
        storage_limit: reveal.storage_limit
      }
    });
  } // transaction


  if (operation.transaction) {
    var transaction = operation.transaction; // validate transaction parameters

    (0, _paramsValidator.validateParams)(transaction, [{
      name: 'source',
      type: 'string',
      obligatory: true
    }, {
      name: 'destination',
      type: 'string',
      obligatory: true
    }, {
      name: 'amount',
      type: 'number',
      obligatory: true
    }, {
      name: 'counter',
      type: 'number',
      obligatory: true
    }, {
      name: 'fee',
      type: 'number',
      obligatory: true
    }, {
      name: 'gas_limit',
      type: 'number',
      obligatory: true
    }, {
      name: 'storage_limit',
      type: 'number',
      obligatory: true
    }]);
    message = (0, _objectSpread2.default)({}, message, {
      transaction: {
        source: {
          tag: publicKeyHash2buffer(transaction.source).originated,
          hash: publicKeyHash2buffer(transaction.source).hash
        },
        destination: {
          tag: publicKeyHash2buffer(transaction.destination).originated,
          hash: publicKeyHash2buffer(transaction.destination).hash
        },
        amount: transaction.amount,
        counter: transaction.counter,
        fee: transaction.fee,
        gas_limit: transaction.gas_limit,
        storage_limit: transaction.storage_limit
      }
    }); //  add parameters to transaction

    if (transaction.hasOwnProperty('parameters')) {
      message = (0, _objectSpread2.default)({}, message, {
        transaction: (0, _objectSpread2.default)({}, message.transaction, {
          parameters: transaction.parameters
        })
      });
    }
  } // origination


  if (operation.origination) {
    var origination = operation.origination; // validate origination parameters

    (0, _paramsValidator.validateParams)(origination, [{
      name: 'source',
      type: 'string',
      obligatory: true
    }, {
      name: 'manager_pubkey',
      type: 'string',
      obligatory: true
    }, {
      name: 'delegate',
      type: 'string',
      obligatory: true
    }, {
      name: 'balance',
      type: 'number',
      obligatory: true
    }, {
      name: 'spendable',
      type: 'boolean',
      obligatory: true
    }, {
      name: 'delegatable',
      type: 'boolean',
      obligatory: true
    }, {
      name: 'fee',
      type: 'number',
      obligatory: true
    }, {
      name: 'counter',
      type: 'number',
      obligatory: true
    }, {
      name: 'gas_limit',
      type: 'number',
      obligatory: true
    }, {
      name: 'storage_limit',
      type: 'number',
      obligatory: true
    }]);
    message = (0, _objectSpread2.default)({}, message, {
      origination: {
        source: {
          tag: publicKeyHash2buffer(origination.source).originated,
          hash: publicKeyHash2buffer(origination.source).hash
        },
        manager_pubkey: publicKeyHash2buffer(origination.manager_pubkey).hash,
        delegate: publicKeyHash2buffer(origination.delegate).hash,
        balance: origination.balance,
        spendable: origination.spendable,
        delegatable: origination.delegatable,
        fee: origination.fee,
        counter: origination.counter,
        gas_limit: origination.gas_limit,
        storage_limit: origination.storage_limit
      }
    }); //  add script to origination

    if (origination.hasOwnProperty('script')) {
      message = (0, _objectSpread2.default)({}, message, {
        origination: (0, _objectSpread2.default)({}, message.origination, {
          script: origination.script
        })
      });
    }
  } // delegation


  if (operation.delegation) {
    var delegation = operation.delegation; // validate delegation parameters

    (0, _paramsValidator.validateParams)(delegation, [{
      name: 'source',
      type: 'string',
      obligatory: true
    }, {
      name: 'delegate',
      type: 'string',
      obligatory: true
    }, {
      name: 'fee',
      type: 'number',
      obligatory: true
    }, {
      name: 'counter',
      type: 'number',
      obligatory: true
    }, {
      name: 'gas_limit',
      type: 'number',
      obligatory: true
    }, {
      name: 'storage_limit',
      type: 'number',
      obligatory: true
    }]);
    message = (0, _objectSpread2.default)({}, message, {
      delegation: {
        source: {
          tag: publicKeyHash2buffer(delegation.source).originated,
          hash: publicKeyHash2buffer(delegation.source).hash
        },
        delegate: publicKeyHash2buffer(delegation.delegate).hash,
        fee: delegation.fee,
        counter: delegation.counter,
        gas_limit: delegation.gas_limit,
        storage_limit: delegation.storage_limit
      }
    });
  }

  return message;
};

exports.createTx = createTx;