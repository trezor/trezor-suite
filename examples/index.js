const { getLatestSafeFw } = require('../lib/trezor-update');

console.log('get latest safe firmware', getLatestSafeFw({
    trezorModel: 'T1',
    firmwareVersion: '1.5.4',
    shouldUseRolloutUpdate: false,
}));
