/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-var-requires */

// it appears that plugins must be .js files, refer to this example by cypress dev
// https://github.com/bahmutov/add-typescript-to-cypress/tree/master/e2e/cypress

const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');
const webpack = require('@cypress/webpack-preprocessor');

const { Controller } = require('./websocket-client');
const googleMock = require('./google');
const dropboxMock = require('./dropbox');
const CONSTANTS = require('../constants');
import * as metadataUtils from '../../../../suite/src/utils/suite/metadata';

const controller = new Controller({ url: 'ws://localhost:9001/' });
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
        // default state of bridge is ON
        await controller.connect();
        await controller.send({ type: 'bridge-start' });
        controller.disconnect();

        if (browser.name === 'chrome') {
            launchOptions.args.push('--disable-dev-shm-usage');
            return launchOptions;
        }
        return launchOptions;
    });

    on('task', {
        startDropbox: async () => {
            await dropboxMock.start();
            return null;
        },
        stopDropbox: async () => {
            dropboxMock.stop();
            return null;
        },
        startGoogle: async () => {
            await googleMock.start();
            return null;
        },
        setupGoogle: options => {
            // use to set files, or user
            googleMock.setup(options.prop, options.value);
            return null;
        },
        stopGoogle: async () => {
            googleMock.stop();
            return null;
        },
        setFileContent: async ({ provider, file, content, aesKey }) => {
            const encrypted = await metadataUtils.encrypt(content, aesKey);
            switch (provider) {
                case 'dropbox':
                    dropboxMock.files[file] = encrypted;
                    break;
                // todo:
            }
            return null;
        },
        setNextResponse: ({ provider, status, body }) => {
            switch (provider) {
                case 'dropbox':
                    dropboxMock.nextResponse = { status, body};
                    break;
                // todo:
            }
            return null;
        },
        getRequests: ({ provider}) => {
            switch(provider){ 
                case 'dropbox':
                    return dropboxMock.requests;
                    // todo:
            }
        },
        startBridge: async version => {
            await controller.connect();
            await controller.send({ type: 'bridge-start', version });
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
            const defaults = {
                mnemonic: 'all all all all all all all all all all all all',
                pin: '',
                passphrase_protection: false,
                label: CONSTANTS.DEFAULT_TREZOR_LABEL,
                needs_backup: false,
            };

            await controller.connect();
            // before setup, stop bridge and start it again after it. it has no performance hit
            // and avoids 'wrong previous session' errors from bridge. actual setup is done
            // through udp transport if bridge transport is not available
            await controller.send({ type: 'bridge-stop' });
            await controller.send({
                type: 'emulator-setup',
                ...defaults,
                ...options,
            });
            await controller.send({ type: 'bridge-start' });
            await controller.disconnect();
            return null;
        },
        /**
         * @version
         * version of firmware in emulator, only few are supported
         * @wipe
         * shall be emulator wiped before start? defaults to true
         */
        startEmu: async arg => {
            await controller.connect();
            await controller.send({
                type: 'emulator-start',
                ...arg,
            });
            await controller.disconnect();
            return null;
        },
        stopEmu: async () => {
            await controller.connect();
            await controller.send({ type: 'emulator-stop' });
            await controller.disconnect();
            return null;
        },
        wipeEmu: async () => {
            await controller.connect();
            await controller.send({ type: 'emulator-wipe' });
            await controller.disconnect();
            return null;
        },
        pressYes: async () => {
            await controller.connect();
            await controller.send({ type: 'emulator-press-yes' });
            await controller.disconnect();
            return null;
        },
        pressNo: async () => {
            await controller.connect();
            await controller.send({ type: 'emulator-press-no' });
            await controller.disconnect();
            return null;
        },
        swipeEmu: async direction => {
            await controller.connect();
            await controller.send({ type: 'emulator-swipe', direction });
            await controller.disconnect();
            return null;
        },
        inputEmu: async value => {
            await controller.connect();
            await controller.send({ type: 'emulator-input', value });
            await controller.disconnect();
            return null;
        },
        resetDevice: async options => {
            await controller.connect();
            await controller.send({ type: 'emulator-reset-device', ...options });
            await controller.disconnect();
            return null;
        },
        readAndConfirmMnemonicEmu: async () => {
            await controller.connect();
            await controller.send({ type: 'emulator-read-and-confirm-mnemonic' });
            await controller.disconnect();
            return null;
        },
        applySettings: async options => {
            const defaults = {
                passphrase_always_on_device: false,
            };
            await controller.connect();
            await controller.send({
                type: 'emulator-apply-settings',
                ...defaults,
                ...options,
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
