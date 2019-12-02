/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-var-requires */

// it appears that plugins must be .js files, refer to this example by cypress dev
// https://github.com/bahmutov/add-typescript-to-cypress/tree/master/e2e/cypress

const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');
const cypressTypeScriptPreprocessor = require('./ts-preprocessor');
const path = require('path');
const { spawn } = require('child_process');

const { Controller } = require('./python/websocket-client');
const CONSTANTS = require('../constants');

const controller = new Controller({ url: 'ws://localhost:9001/' });

module.exports = on => {
    addMatchImageSnapshotPlugin(on);
    on('file:preprocessor', cypressTypeScriptPreprocessor);
    on('before:browser:launch', (browser = {}, args) => {
        if (browser.name === 'chrome') {
            args.push('--disable-dev-shm-usage');
            return args;
        }
        return args;
    });

    on('task', {
        startBridge: async () => {
            await controller.connect();
            const response = await controller.send({ type: 'bridge-start' });
            await controller.disconnect();
            return null;
        },
        stopBridge: async () => {
            await controller.connect();
            const response = await controller.send({ type: 'bridge-stop' });
            await controller.disconnect();
            return null;
        },
        setupEmu: async options => {
            // todo: figure out how to pass more options.
            // these are probably all options supported by python trezor
            // https://github.com/trezor/python-trezor/blob/688d1ac03bfed162372bc5ac2dfafa0ee69378c8/trezorlib/debuglink.py
            const defaults = {
                mnemonic: 'all all all all all all all all all all all all',
                pin: '',
                passphrase_protection: false,
                label: CONSTANTS.DEFAULT_TREZOR_LABEL,
            };
            await controller.connect();
            const response = await controller.send({
                type: 'emulator-setup',
                ...defaults,
                ...options,
            });
            await controller.disconnect();
            return null;
        },
        startEmu: async () => {
            await controller.connect();
            const response = await controller.send({ type: 'emulator-start' });
            await controller.disconnect();
            return null;
        },
        stopEmu: async () => {
            await controller.connect();
            const response = await controller.send({ type: 'emulator-stop' });
            await controller.disconnect();
            return null;
        },
        wipeEmu: async () => {
            await controller.connect();
            const response = await controller.send({ type: 'emulator-wipe' });
            await controller.disconnect();
            return null;
        },
        sendDecision: async method => {
            await controller.connect();
            await controller.send({ type: 'emulator-decision', method });
            await controller.disconnect();
            return null;
        },
    });
};
