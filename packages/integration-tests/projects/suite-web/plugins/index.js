/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-var-requires */

// it appears that plugins must be .js files, refer to this example by cypress dev
// https://github.com/bahmutov/add-typescript-to-cypress/tree/master/e2e/cypress

import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin';
import { Controller } from './websocket-client';
import googleMock from './google';
import dropboxMock from './dropbox';
import * as metadataUtils from '../../../../suite/src/utils/suite/metadata';

const webpackPreprocessor = require('@cypress/webpack-preprocessor');

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
    on('file:preprocessor', webpackPreprocessor(options));

    // make ts possible end

    // add snapshot plugin
    addMatchImageSnapshotPlugin(on);

    on('before:browser:launch', async (browser = {}, launchOptions) => {
        if (browser.name === 'chrome') {
            launchOptions.args.push('--disable-dev-shm-usage');
            return launchOptions;
        }
        return launchOptions;
    });

    on('task', {
        metadataStartProvider: async provider => {
            switch (provider) {
                case 'dropbox':
                    await dropboxMock.start();
                case 'google':
                    await googleMock.start();
            }
            return null;
        },
        metadataStopProvider: async provider => {
            switch (provider) {
                case 'dropbox':
                    dropboxMock.stop();
                case 'google':
                    googleMock.stop();
            }
            return null;
        },
        metadataSetFileContent: async ({ provider, file, content, aesKey }) => {
            const encrypted = await metadataUtils.encrypt(content, aesKey);
            switch (provider) {
                case 'dropbox':
                    dropboxMock.files[file] = encrypted;
                    break;
                case 'google':
                    googleMock.setFile(file, encrypted);
            }
            return null;
        },
        metadataSetNextResponse: ({ provider, status, body }) => {
            switch (provider) {
                case 'dropbox':
                    dropboxMock.nextResponse = { status, body };
                    break;
                case 'google':
                    googleMock.nextResponse = { status, body };
                    break;
            }
            return null;
        },
        metadataGetRequests: ({ provider }) => {
            switch (provider) {
                case 'dropbox':
                    return dropboxMock.requests;
                case 'google':
                    return googleMock.requests;
            }
        },
        startBridge: async version => {
            await controller.connect();
            await controller.send({ type: 'bridge-start', version });
            controller.disconnect();
            return null;
        },
        stopBridge: async () => {
            await controller.connect();
            const response = await controller.send({ type: 'bridge-stop' });
            controller.disconnect();
            return null;
        },
        setupEmu: async options => {
            const defaults = {
                // some random empty seed. most of the test don't need any account history so it is better not to slow them down with all all seed
                mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
                pin: '',
                passphrase_protection: false,
                label: 'My Trevor',
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
            controller.disconnect();
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
            controller.disconnect();
            return null;
        },
        stopEmu: async () => {
            await controller.connect();
            await controller.send({ type: 'emulator-stop' });
            controller.disconnect();
            return null;
        },
        wipeEmu: async () => {
            await controller.connect();
            await controller.send({ type: 'emulator-wipe' });
            controller.disconnect();
            return null;
        },
        pressYes: async () => {
            await controller.connect();
            await controller.send({ type: 'emulator-press-yes' });
            controller.disconnect();
            return null;
        },
        pressNo: async () => {
            await controller.connect();
            await controller.send({ type: 'emulator-press-no' });
            controller.disconnect();
            return null;
        },
        swipeEmu: async direction => {
            await controller.connect();
            await controller.send({ type: 'emulator-swipe', direction });
            controller.disconnect();
            return null;
        },
        inputEmu: async value => {
            await controller.connect();
            await controller.send({ type: 'emulator-input', value });
            controller.disconnect();
            return null;
        },
        resetDevice: async options => {
            await controller.connect();
            await controller.send({ type: 'emulator-reset-device', ...options });
            controller.disconnect();
            return null;
        },
        readAndConfirmMnemonicEmu: async () => {
            await controller.connect();
            await controller.send({ type: 'emulator-read-and-confirm-mnemonic' });
            controller.disconnect();
            return null;
        },
        readAndConfirmShamirMnemonicEmu: async options => {
            await controller.connect();
            await controller.send({ type: 'emulator-read-and-confirm-shamir-mnemonic', ...options});
            controller.disconnect();
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
            controller.disconnect();
            return null;
        },
        selectNumOfWordsEmu: async num => {
            await controller.connect();
            await controller.send({ type: 'select-num-of-words', num });
            controller.disconnect();
            return null;
        },
        logTestDetails: async text => {
            await controller.connect();
            await controller.send({ type: 'log', text });
            controller.disconnect();
            return null;
        },
    });
};
