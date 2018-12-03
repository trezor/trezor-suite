const trezorUpdate = require('../lib/trezor-update');

console.log('get latest fw', trezorUpdate.getLatestFw());
console.log('get list from model', trezorUpdate.getListForModel());
console.log('get latest safe firmware', trezorUpdate.getLatestSafeFw());
