// it appears that plugins must be .js files, refer to this example by cypress dev
// https://github.com/bahmutov/add-typescript-to-cypress/tree/master/e2e/cypress

import CDP from 'chrome-remote-interface';
import fs from 'fs';
import path from 'path';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin';
import { Controller } from '@trezor/trezor-user-env-link';
import controllerManager from '../../../controllerManager';
import googleMock from './google';
import dropboxMock from './dropbox';
import bridgeMock from './bridge';
import * as metadataUtils from '../../../../suite/src/utils/suite/metadata';
import config from '../cypress.json';
import releasesT2 from '../../../../connect-common/files/firmware/2/releases.json';

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

const controller = new Controller();
const firmwares = {};

const manager = controllerManager(controller, firmwares);

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
        startMockedBridge: async har => {
            await bridgeMock.start(har);
            return null;
        },
        stopMockedBridge: async () => {
            await bridgeMock.stop();
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
            if (fs.existsSync(dir)) {
                fs.rmdirSync(dir, { force, recursive });
            }
            return null;
        },
        csvToJson(data) {
            const lines = data.split('\n');
            const result = [];
            const headers = lines[0].split(',');
            for (let i = 1; i < lines.length; i++) {
                const obj = {};
                const currentline = lines[i].split(',');

                for (let j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }
            return result;
        },
        // Here `manager` adds all the required helper for websocket controller.
        ...manager,
    });
};
