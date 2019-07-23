'use strict';

exports.__esModule = true;
exports.prepareTx = void 0;
var FIELDS_TO_CONVERT = ['amount', 'fee'];
var FIELDS_TO_RENAME = ['lifetime', 'keysgroup'];

var snakefy = function snakefy(val) {
  return val.replace(/([A-Z])/g, function (el) {
    return '_' + el.toLowerCase();
  });
};

var prepareField = function prepareField(name, value, obj) {
  // Convert camelCase -> snake_keys
  var newName = snakefy(name); // convert amount and fee to number

  if (FIELDS_TO_CONVERT.includes(name)) {
    obj[newName] = parseInt(value, 10);
    return;
  } // convert to snake_keys fields that are not in camelCase format


  if (FIELDS_TO_RENAME.includes(name)) {
    newName = [name.substr(0, 4), '_', name.substr(4)].join('');
  }

  obj[newName] = value;
};

var prepareTx = function prepareTx(tx, newTx) {
  if (newTx === void 0) {
    newTx = {};
  }

  for (var field in tx) {
    var value = tx[field];

    if (typeof value === 'object' && !Array.isArray(value)) {
      newTx[field] = prepareTx(value);
    } else {
      prepareField(field, value, newTx);
    }
  }

  return newTx;
};

exports.prepareTx = prepareTx;