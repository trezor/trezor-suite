/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-var-requires */

// it appears that plugins must be .js files, refer to this example by cypress dev
// https://github.com/bahmutov/add-typescript-to-cypress/tree/master/e2e/cypress

const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');
const webpack = require('@cypress/webpack-preprocessor');
const path = require('path');
const { spawn } = require('child_process');

const { Controller } = require('./python/websocket-client');
const CONSTANTS = require('../constants');

const controller = new Controller({ url: 'ws://localhost:9001/' });

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = on => {
    // make ts possible start
    const options = {
        // send in the options from your webpack.config.js, so it works the same
        // as your app's code
        // eslint-disable-next-line global-require
        webpackOptions: require('../webpack.config'),
        watchOptions: {},
    };
    on('file:preprocessor', webpack(options));
    // make ts possible end

    // add snapshot plugin
    addMatchImageSnapshotPlugin(on);

    on('before:browser:launch', async (browser = {}, launchOptions) => {
        // not the best solution by far, but seems to work.
        // problem is that bridge response to POST to '/' with 403 sometimes.
        // this request occurs on bridge start. so I disabled bridge stop/start functionality
        // in tests until I find another way how to fix this (debug in python scripts most probably)
        await controller.connect();
        const response = await controller.send({ type: 'bridge-start' });
        await controller.disconnect();

        if (browser.name === 'chrome') {
            launchOptions.args.push('--disable-dev-shm-usage');
            return launchOptions;
        }
        return launchOptions;
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
        startEmu: async version => {
            await controller.connect();
            const response = await controller.send({
                type: 'emulator-start',
                version,
            });
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
        swipeEmu: async direction => {
            await controller.connect();
            await controller.send({ type: 'emulator-swipe', direction });
            await controller.disconnect();
            return null;
        },
        inputEmu: async word => {
            await controller.connect();
            await controller.send({ type: 'emulator-input', word });
            await controller.disconnect();
            return null;
        },
        readAndConfirmMnemonicEmu: async word => {
            await controller.connect();
            await controller.send({ type: 'emulator-read-and-confirm-mnemonic' });
            await controller.disconnect();
            return null;
        },
        setPasshpraseSourceEmu: async passhpraseSource => {
            await controller.connect();
            let source;
            if (passhpraseSource === 'ask') {
                source = 0;
            } else if (passhpraseSource === 'device') {
                source = 1;
            } else if (passhpraseSource === 'host') {
                source = 2;
            } else {
                throw Error('unexpected passhpraseSource');
            }
            const response = await controller.send({
                type: 'emulator-set-passhphrase-source',
                passphrase_source: source,
            });
            await controller.disconnect();
            return null;
        },
        selectNumOfWordsEmu: async num => {
            await controller.connect();
            await controller.send({ type: 'select-num-of-words', num });
            await controller.disconnect();
            return null;
        },
    });
};
