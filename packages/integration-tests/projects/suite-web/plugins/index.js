/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-var-requires */

// it appears that plugins must be .js files, refer to this example by cypress dev
// https://github.com/bahmutov/add-typescript-to-cypress/tree/master/e2e/cypress

import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin';
import webpack from '@cypress/webpack-preprocessor';
import { Controller } from './websocket-client';
import googleMock from './google';
import dropboxMock from './dropbox';
import CONSTANTS from '../constants';
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
        // todo: maybe turn of bridge on and off here before launching test files.
        // this would help to prevent messed sessions between tests (unacquired device) which is 
        // the likeliest source of flakiness in tests
        // but it is not a silver bullet also, if there are more tests in one file, you still
        // need to handle bridge reloading manually
        await controller.connect();
        // default state of bridge is ON
        await controller.send({ type: 'bridge-start' });
        controller.disconnect();

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
    });
};
