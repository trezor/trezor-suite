var nativeBinding = require('./trezor-bluetooth.node');
module.exports = nativeBinding;
module.exports.connectDevice = nativeBinding.connectDevice;
