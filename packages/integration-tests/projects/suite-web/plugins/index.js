/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-var-requires */

// it appears that plugins must be .js files, refer to this example by cypress dev
// https://github.com/bahmutov/add-typescript-to-cypress/tree/master/e2e/cypress

import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin';
import { Controller } from './websocket-client';
import googleMock from './google';
import dropboxMock from './dropbox';
import * as metadataUtils from '../../../../suite/src/utils/suite/metadata';
import createServer from '../../../../blockchain-link/tests/websocket';
const webpackPreprocessor = require('@cypress/webpack-preprocessor');
import fs from 'fs';

const controller = new Controller({ url: 'ws://localhost:9001/' });

let mockDiscoveryServer;

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
                mnemonic:
                    'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
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
        mockDiscoveryStart: async (options = {}) => {
            const { fixture, defaultResponses } = options;

            mockDiscoveryServer = await createServer('blockbook');

            // You may either provide fixtures for the entire communication or set a reasonable default response
            // that will be used when websocket server runs out of messages
            mockDiscoveryServer.setDefaultResponses({
                ...mockDiscoveryServer.defaultResponses,
                // all default responses in blockchain link tests seem to be ok to be used here, only problem is that 
                // it works with testnet and we want to test btc primarily so this is to override the default
                getInfo: {
                    data: {
                        name: 'Bitcoin',
                        shortcut: 'BTC',
                        decimals: 8,
                        version: '0.3.4',
                        bestHeight: 666026,
                        bestHash:
                            '0000000000000000000838c2e3a15a1f3756ec462e1be3878dfe39f263c87a96',
                        block0Hash:
                            '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
                        testnet: false,
                    },
                },
                ...defaultResponses,
            });

            if (fixture) {
                const raw = fs.readFileSync(`${__dirname}/../fixtures/${fixture}`, {
                    encoding: 'utf-8',
                });

                const har = JSON.parse(raw).map(item => ({
                    ...item,
                    data: JSON.parse(item.data),
                }));

                const fixtures = [];

                har.forEach(({ type, data }) => {
                    let send;
                    if (type === 'receive') {
                        send = har.find(i => i.data.id === data.id && i.type === 'send');
                    } else {
                        return;
                    }
                    const { id, ...partial } = data;
                    fixtures.push({
                        id,
                        method: send.data.method,
                        response: partial,
                    });
                });

                mockDiscoveryServer.setFixtures(fixtures);
            }

            return mockDiscoveryServer.options.port;
        },

        mockDiscoveryStop: async () => {
            if (!mockDiscoveryServer) return null;
            mockDiscoveryServer.close();
            return null;
        },
    });
};
