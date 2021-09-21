/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-var-requires */

// it appears that plugins must be .js files, refer to this example by cypress dev
// https://github.com/bahmutov/add-typescript-to-cypress/tree/master/e2e/cypress

import CDP from 'chrome-remote-interface';
import fs from 'fs';
import path from 'path';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin';
import { Controller } from './websocket-client';
import googleMock from './google';
import dropboxMock from './dropbox';
import * as metadataUtils from '../../../../suite/src/utils/suite/metadata';
import config from '../cypress.json';

const webpackPreprocessor = require('@cypress/webpack-preprocessor');

const ensureRdpPort = args => {
    const existing = args.find(arg => arg.slice(0, 23) === '--remote-debugging-port');

    if (existing) {
        return Number(existing.split('=')[1]);
    }

    const port = 40000 + Math.round(Math.random() * 25000);

    args.push(`--remote-debugging-port=${port}`);

    return port;
};

let port = 0;
let client = null;

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

    on('before:browser:launch', (browser = {}, launchOptions) => {
        const args = Array.isArray(launchOptions) ? launchOptions : launchOptions.args;
        port = ensureRdpPort(args);

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
                    break;
                case 'google':
                    await googleMock.start();
                    break;
                default:
                    throw new Error('not a valid case');
            }
            return null;
        },
        metadataStopProvider: provider => {
            switch (provider) {
                case 'dropbox':
                    dropboxMock.stop();
                    break;
                case 'google':
                    googleMock.stop();
                    break;
                default:
                    throw new Error('not a valid case');
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
                    break;
                default:
                    throw new Error('not a valid case');
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
                default:
                    throw new Error('not a valid case');
            }
            return null;
        },
        metadataGetRequests: ({ provider }) => {
            switch (provider) {
                case 'dropbox':
                    return dropboxMock.requests;
                case 'google':
                    return googleMock.requests;
                default:
                    throw new Error('not a valid case');
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
        clickEmu: async options => {
            await controller.connect();
            await controller.send({ type: 'emulator-click', ...options });
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
            await controller.send({
                type: 'emulator-read-and-confirm-shamir-mnemonic',
                ...options,
            });
            controller.disconnect();
            return null;
        },
        applySettings: async options => {
            await controller.connect();
            await controller.send({
                type: 'emulator-apply-settings',
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
        resetCRI: async () => {
            if (client) {
                await client.close();
                client = null;
            }

            return Promise.resolve(true);
        },
        activateHoverPseudo: async ({ selector }) => {
            client = client || (await CDP({ port }));
            await client.DOM.enable();
            await client.CSS.enable();
            // as the Window consists of two IFrames, we must retrieve the right one
            const allRootNodes = await client.DOM.getFlattenedDocument();
            const isIframe = node => node.nodeName === 'IFRAME' && node.contentDocument;
            const filtered = allRootNodes.nodes.filter(isIframe);
            // The first IFrame is our App
            const root = filtered[0].contentDocument;
            const { nodeId } = await client.DOM.querySelector({
                nodeId: root.nodeId,
                selector,
            });

            return client.CSS.forcePseudoState({
                nodeId,
                forcedPseudoClasses: ['hover'],
            });
        },

        readDir: dir => fs.readdirSync(dir, { encoding: 'utf-8' }),
        rmDir: opts => {
            const { dir, force, recursive } = opts;
            // just a security check so that we do accidentally wipe something we don't want
            const restrictedPath = path.join(__dirname, '..', config.downloadsFolder);
            if (!dir.startsWith(restrictedPath)) {
                console.warn('trying to rmDir ', dir);
                throw new Error(`'it is not allowed to rm outside ${restrictedPath}`);
            }

            fs.rmdirSync(dir, { force, recursive });
            return null;
        },
    });
};
