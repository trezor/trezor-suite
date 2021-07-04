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
            console.log('node: metadataStartProvider');
            switch (provider) {
                case 'dropbox':
                    await dropboxMock.start();
                case 'google':
                    await googleMock.start();
            }
            return null;
        },
        metadataStopProvider: async provider => {
            console.log('node: metadataStopProvider');
            switch (provider) {
                case 'dropbox':
                    dropboxMock.stop();
                case 'google':
                    googleMock.stop();
            }
            return null;
        },
        metadataSetFileContent: async ({ provider, file, content, aesKey }) => {
            console.log('node: metadataSetFileContent');
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
            console.log('node: metadataSetNextResponse');
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
            console.log('node: metadataSetNextResponse');
            switch (provider) {
                case 'dropbox':
                    return dropboxMock.requests;
                case 'google':
                    return googleMock.requests;
            }
        },
        trezorUserEnvConnect: async () => {
            console.log('node: trezorUserEnvConnect')
            await controller.connect();
            console.log('node: trezorUserEnvConnect connected')
            return null;
        },
        trezorUserEnvDisconnect: async () => {
            console.log('node: trezorUserEnvDisconnect')
            await controller.disconnect();
            console.log('node: trezorUserEnvDisconnect disconnected')
            return null;
        },
        startBridge: async version => {
            console.log('node: startBridge')
            await controller.send({ type: 'bridge-start', version });
            return null;
        },
        stopBridge: async () => {
            console.log('node: stopBridge');
            await controller.send({ type: 'bridge-stop' });
            return null;
        },
        setupEmu: async options => {
            console.log('node: setupEmu');
            const defaults = {
                // some random empty seed. most of the test don't need any account history so it is better not to slow them down with all all seed
                mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
                pin: '',
                passphrase_protection: false,
                label: 'My Trevor',
                needs_backup: false,
            };
            
            // before setup, stop bridge and start it again after it. it has no performance hit
            // and avoids 'wrong previous session' errors from bridge. actual setup is done
            // through udp transport if bridge transport is not available
            // await controller.send({ type: 'bridge-stop' });
            await controller.send({
                type: 'emulator-setup',
                ...defaults,
                ...options,
            });
            // await controller.send({ type: 'bridge-start' });
            return null;
        },
        /**
         * @version
         * version of firmware in emulator, only few are supported
         * @wipe
         * shall be emulator wiped before start? defaults to true
         */
        startEmu: async arg => {
            console.log('node: startEmu');
            await controller.send({
                type: 'emulator-start',
                ...arg,
            });
            return null;
        },
        stopEmu: async () => {
            console.log('node: stopEmu')
            await controller.send({ type: 'emulator-stop' });
            return null;
        },
        wipeEmu: async () => {
            console.log('node: wipeEmu')
            await controller.send({ type: 'emulator-wipe' });
            return null;
        },
        pressYes: async () => {
            console.log('node: pressYes')
            await controller.send({ type: 'emulator-press-yes' });
            return null;
        },
        pressNo: async () => {
            console.log('node: pressNo')
            await controller.send({ type: 'emulator-press-no' });
            return null;
        },
        swipeEmu: async direction => {
            console.log('node: swipeEmu')
            await controller.send({ type: 'emulator-swipe', direction });
            return null;
        },
        inputEmu: async value => {
            console.log('node: inputEmu')
            await controller.send({ type: 'emulator-input', value });
            return null;
        },
        clickEmu: async options => {
            await controller.send({ type: 'emulator-click', ...options });
            return null;
        },
        resetDevice: async options => {
            console.log('node: resetDevice')
            await controller.send({ type: 'emulator-reset-device', ...options });
            return null;
        },
        readAndConfirmMnemonicEmu: async () => {
            console.log('node: readAndConfirmMnemonicEmu')
            await controller.send({ type: 'emulator-read-and-confirm-mnemonic' });
            return null;
        },
        readAndConfirmShamirMnemonicEmu: async options => {
            await controller.send({ type: 'emulator-read-and-confirm-shamir-mnemonic', ...options});
            return null;
        },
        applySettings: async options => {
            console.log('node: applySettings');
            const defaults = {
                passphrase_always_on_device: false,
            };
            await controller.send({
                type: 'emulator-apply-settings',
                ...defaults,
                ...options,
            });
            return null;
        },
        selectNumOfWordsEmu: async num => {
            console.log('node: selectNumOfWordsEmu')
            await controller.send({ type: 'select-num-of-words', num });
            return null;
        },
        logTestDetails: async text => {
            await controller.send({ type: 'log', text });
            return null;
        },
    });
};
