const { Controller } = require('../../websocket-client');

const mnemonicAll = 'all all all all all all all all all all all all';

const emulatorSetupOpts = {
    mnemonic: mnemonicAll,
    pin: '',
    passphrase_protection: false,
    label: 'TrezorT',
    needs_backup: false,
};

const emulatorStartOpts = { version: '2-master', wipe: true };

const wait = ms =>
    new Promise(resolve => {
        setTimeout(resolve, ms);
    });

const setup = async controller => {
    await controller.connect();
    await controller.send({ type: 'bridge-stop' });
    await controller.send({ type: 'emulator-start', ...emulatorStartOpts });
    await controller.send({ type: 'emulator-setup', ...emulatorSetupOpts });
};

global.Trezor = {
    wait,
    setup,
    Controller,
};
