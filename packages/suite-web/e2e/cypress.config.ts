import { defineConfig } from 'cypress';

// import CDP from 'chrome-remote-interface';
import fs from 'fs';
import path from 'path';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin';
import { BridgeTransport } from '@trezor/transport';
import * as messages from '@trezor/protobuf/src/messages';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import * as metadataUtils from '@trezor/suite/src/utils/suite/metadata';

import {
    TrezorBridgeMock,
    DropboxMock,
    GoogleMock,
    BackendWebsocketServerMock,
} from '@trezor/e2e-utils';

const mocked = {
    bridge: new TrezorBridgeMock(),
    dropbox: new DropboxMock(),
    google: new GoogleMock(),
};

// const ensureRdpPort = (args: any[]) => {
//     const existing = args.find(arg => arg.slice(0, 23) === '--remote-debugging-port');

//     if (existing) {
//         return Number(existing.split('=')[1]);
//     }

//     const port = 40000 + Math.round(Math.random() * 25000);

//     args.push(`--remote-debugging-port=${port}`);

//     return port;
// };

// let port = 0;
let client: any = null;
let blockbook: BackendWebsocketServerMock | undefined;

// // add snapshot plugin
// addMatchImageSnapshotPlugin(on);

// on('before:browser:launch', (browser = {}, launchOptions) => {
//     const args = Array.isArray(launchOptions) ? launchOptions : launchOptions.args;
//     port = ensureRdpPort(args);

//     if (browser.name === 'chrome') {
//         launchOptions.args.push('--disable-dev-shm-usage');
//         return launchOptions;
//     }

//     return launchOptions;
// });

// simple memory key-value store
const store: { [key: string]: any } = {};

export default defineConfig({
    e2e: {
        specPattern: '**/*.test.{js,jsx,ts,tsx}',
        baseUrl: 'http://localhost:8000',
        fixturesFolder: './fixtures',
        downloadsFolder: './downloads',
        supportFile: './support/index.ts',
        defaultCommandTimeout: 20000,
        screenshotsFolder: './screenshots',
        videosFolder: './videos',
        video: true,
        trashAssetsBeforeRuns: false,
        chromeWebSecurity: false,
        experimentalFetchPolyfill: true,
        experimentalRunAllSpecs: true,
        setupNodeEvents(on, config) {
            on('before:browser:launch', _browser => {
                // const args = Array.isArray(launchOptions) ? launchOptions : launchOptions.args;
                // port = ensureRdpPort(args);
                addMatchImageSnapshotPlugin(on, config);
            });
            on('task', {
                metadataStartProvider: async provider => {
                    switch (provider) {
                        case 'dropbox':
                            await mocked.dropbox.start();
                            break;
                        case 'google':
                            await mocked.google.start();
                            break;
                        default:
                            throw new Error('not a valid case');
                    }
                    return null;
                },
                metadataStopProvider: provider => {
                    switch (provider) {
                        case 'dropbox':
                            mocked.dropbox.stop();
                            break;
                        case 'google':
                            mocked.google.stop();
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
                            mocked.dropbox.files[file] = encrypted;
                            break;
                        case 'google':
                            mocked.google.setFile(file, encrypted);
                            break;
                        default:
                            throw new Error('not a valid case');
                    }
                    return null;
                },
                metadataSetNextResponse: ({ provider, status, body }) => {
                    switch (provider) {
                        case 'dropbox':
                            mocked.dropbox.nextResponse.push({ status, body });
                            break;
                        case 'google':
                            mocked.google.nextResponse.push({ status, body });
                            break;
                        default:
                            throw new Error('not a valid case');
                    }
                    return null;
                },
                metadataGetRequests: ({ provider }) => {
                    switch (provider) {
                        case 'dropbox':
                            return mocked.dropbox.requests;
                        case 'google':
                            return mocked.google.requests;
                        default:
                            throw new Error('not a valid case');
                    }
                },
                startMockedBridge: async har => {
                    await mocked.bridge.start(har);
                    return null;
                },
                stopMockedBridge: async () => {
                    await mocked.bridge.stop();
                    return null;
                },
                stealBridgeSession: async () => {
                    const bridge = new BridgeTransport({ messages });
                    await bridge.init().promise;
                    const enumerateRes = await bridge.enumerate().promise;
                    if (!enumerateRes.success) return null;
                    await bridge.acquire({ input: { path: enumerateRes.payload[0].path } }).promise;

                    return null;
                },

                resetCRI: async () => {
                    if (client) {
                        await client.close();
                        client = null;
                    }

                    return Promise.resolve(true);
                },
                readDir: dir => fs.readdirSync(dir, { encoding: 'utf-8' }),
                readFile: path => fs.readFileSync(path, { encoding: 'utf-8' }),
                rmDir: (opts: {
                    recursive: fs.RmDirOptions['recursive'];
                    dir: string;
                    force?: boolean;
                }) => {
                    const { dir, recursive, force } = opts;
                    // just a security check so that we do accidentally wipe something we don't want
                    const restrictedPath = path.join(__dirname, '..', config.downloadsFolder);
                    if (!dir.startsWith(restrictedPath) && !force) {
                        console.warn('trying to rmDir ', dir);
                        throw new Error(`'it is not allowed to rm outside ${restrictedPath}`);
                    }
                    if (fs.existsSync(dir)) {
                        fs.rmdirSync(dir, { recursive });
                    }
                    return null;
                },
                csvToJson(data) {
                    const lines = data.split('\n');
                    const result = [];
                    const headers = lines[0].split(',');
                    for (let i = 1; i < lines.length; i++) {
                        const obj: Record<string, string> = {};
                        const currentline = lines[i].split(',');

                        for (let j = 0; j < headers.length; j++) {
                            obj[headers[j]] = currentline[j];
                        }
                        result.push(obj);
                    }
                    return result;
                },
                async startBlockbookMock({ endpointsFile }) {
                    const { fixtures } = await import(`./fixtures/${endpointsFile}.ts`);

                    blockbook = await BackendWebsocketServerMock.create('blockbook');
                    blockbook.setFixtures(fixtures);
                    return blockbook.options.port;
                },
                stopBlockbookMock() {
                    if (blockbook) {
                        blockbook.stop();
                    }
                    return null;
                },
                set({ key, value }: { key: string; value: any }) {
                    store[key] = value;
                    return null;
                },
                get({ key }: { key: string }): any {
                    return store[key];
                },
                ...TrezorUserEnvLink.api,
            });
        },
    },
});
