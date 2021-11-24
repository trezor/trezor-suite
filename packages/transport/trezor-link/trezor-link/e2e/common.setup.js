const Controller = require('./websocket-client').Controller;

const MNEMONICS = {
    mnemonic_all: 'all all all all all all all all all all all all',
    mnemonic_12: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
    mnemonic_abandon:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
};

const emulatorSetupOpts = {
    mnemonic: MNEMONICS.mnemonic_12,
    pin: '',
    passphrase_protection: false,
    label: 'TrezorT',
    needs_backup: false,
}

const emulatorStartOpts = { version: '2.4.1', wipe: true };

const wait = ms =>
    new Promise(resolve => {
        setTimeout(resolve, ms);
    });

const setup = async (controller) => {
    await controller.connect();
    await controller.send({ type: 'emulator-start', ...emulatorStartOpts });
    await controller.send({ type: 'emulator-setup', ...emulatorSetupOpts });
    await controller.send({ type: 'bridge-start' });
};

global.Trezor = {
    wait,
    setup,
    Controller,
};
