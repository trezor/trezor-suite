import fs from 'fs';
import path from 'path';

import { BitcoinAddressDb } from './bitcoin-address-db';
import { verifyAndUpdateEntry } from './verify-authenticity';
import TrezorConnect, {
    type AddressMetadata,
    createBitcoinAddressNotificationHandler,
    type Device,
    ThpPairingMethod,
    type UiRequestThpPairing,
} from '@trezor/connect';

import { HELP, args } from './args';
import { stdioManager } from './stdio';
import {
    debugLinkDecision,
    debugLinkState,
    getTransport,
    initDebugLink,
    isDebugLinkInteraction,
} from './transport';

/* eslint-disable no-console */

const waitForStdio = stdioManager();

const waitForPairingTag = async (uiEvent: UiRequestThpPairing) => {
    const { selectedMethod } = uiEvent.payload;
    if (!isDebugLinkInteraction('pairing')) {
        const resp = await waitForStdio('Enter pairing code or type [C] for Cancel:').promise;
        if (resp === 'c') {
            return;
        }

        return resp;
    } else {
        const state = await debugLinkState(uiEvent.payload);
        if (!state?.success) {
            throw new Error('DebugLinkState missing: ' + state.error);
        }
        const { payload } = state;
        if (payload.type !== 'DebugLinkPairingInfo') {
            throw new Error(
                'DebugLinkState missing, received ' + state.payload.type,
                // state.payload.message,
            );
        }
        const { code_entry_code, code_qr_code, nfc_secret_trezor } = payload.message;
        if (selectedMethod === ThpPairingMethod.CodeEntry && code_entry_code) {
            return Number(code_entry_code).toString().padStart(6, '0');
        }
        if (selectedMethod === ThpPairingMethod.QrCode && code_qr_code) {
            // NOTE: qrcode throws from firmware: Pairing tag cancelled (Failure) ?
            return code_qr_code;
        }
        if (selectedMethod === ThpPairingMethod.NFC && nfc_secret_trezor) {
            return nfc_secret_trezor;
        }

        return 'unknown-tag';
    }
};

const DB_METHODS = new Set(['dblookup', 'dbchange']);

const getDbPath = () =>
    typeof args['db-path'] === 'string'
        ? args['db-path']
        : path.join(__dirname, 'bitcoin-addresses.db');

const getMethods = (): string[] =>
    args.method && args.method !== 'none'
        ? String(args.method)
              .split(',')
              .map((m: string) => m.trim())
        : [args.method ?? 'none'];

// Run DB methods, optionally with a device for authenticity verification.
// Returns true if all requested methods were DB methods (caller can skip TrezorConnect init).
const runDbMethods = async (device?: Device): Promise<boolean> => {
    const methods = getMethods();
    const dbMethods = methods.filter(m => DB_METHODS.has(m));
    if (dbMethods.length === 0) return false;

    if (!args.params) {
        console.error(
            'DB methods require --params (note the double dash). Example:\n' +
            '  --params=\'{"address":"...","networkSymbol":"btc"}\'',
        );
        process.exit(1);
    }
    let params: any;
    try {
        params = JSON.parse(args.params);
    } catch (e) {
        console.error('Invalid JSON in --params:', (e as Error).message);
        console.error('Received:', args.params);
        process.exit(1);
    }
    const db = new BitcoinAddressDb(getDbPath());

    try {
        for (const method of dbMethods) {
            if (method === 'dblookup') {
                const { address, networkSymbol } = params;
                if (!address || !networkSymbol) {
                    console.error('dblookup requires --params=\'{"address":"...","networkSymbol":"..."}\' ');
                    process.exit(1);
                }
                const entry = db.lookupOrCreate(address, networkSymbol);
                const treeState = db.getTreeState();
                console.log(JSON.stringify({ method: 'dblookup', address, networkSymbol, metadata: entry.metadata, counter: entry.counter, treeState }, null, 2));
            }

            if (method === 'dbchange') {
                const { address, networkSymbol, metadata: rawMetadata } = params;
                if (!address || !networkSymbol || !rawMetadata) {
                    console.error(
                        'dbchange requires --params=\'{"address":"...","networkSymbol":"...","metadata":{...}}\' ',
                    );
                    process.exit(1);
                }
                // Strip unknown fields — only persist known AddressMetadata keys.
                const metadata: AddressMetadata = {
                    ...(rawMetadata.label !== undefined && { label: String(rawMetadata.label) }),
                    ...(rawMetadata.data !== undefined && { data: rawMetadata.data }),
                };
                const oldEntry = db.lookup(address, networkSymbol);
                const treeState = db.getTreeState();
                const { authentic, newTreeState, newEntryCounter } = await verifyAndUpdateEntry(
                    address, networkSymbol, oldEntry, metadata, treeState, device,
                );
                db.upsert(address, networkSymbol, { metadata, counter: newEntryCounter });
                db.setTreeState(newTreeState);
                console.log(JSON.stringify({ method: 'dbchange', address, networkSymbol, metadata, counter: newEntryCounter, treeState: newTreeState }, null, 2));
                console.log('Authenticity verified:', authentic);
            }
        }
    } finally {
        db.close();
    }

    // Return true only if every requested method was a DB method
    return methods.every(m => DB_METHODS.has(m));
};

const cliStatePath = path.join(__dirname, 'thp-state.dat');
const readCliState = (): { credentials: NonNullable<Device['thp']>['credentials'] } => {
    try {
        return JSON.parse(fs.readFileSync(cliStatePath, 'utf8'));
    } catch {
        return { credentials: [] };
    }
};

const writeCliState = (data: any) => {
    fs.writeFileSync(cliStatePath, JSON.stringify(data, null, 2), 'utf8');
};

const getThpCredentials = () => {
    const data = readCliState();
    if (args.credentials) {
        return data.credentials.filter(c => !c.autoconnect);
    }
    if (args.autoconnect) {
        return data.credentials;
    }

    return [];
};

const getFeatures = (device: Device) =>
    TrezorConnect.getFeatures({
        device,
    });

const fwUpdate = (device: Device) =>
    TrezorConnect.firmwareUpdate({
        device,
        baseUrl: path.resolve(__dirname, '../connect-data/files'),
    });

const runTestCase = async (device: Device) => {
    const { method } = args;
    if (method === 'none') {
        console.log('Missing method. Exiting');
        process.exit(1);
    }

    const params = args.params ? JSON.parse(args.params) : {};

    let result;
    switch (method) {
        case 'fw-update':
            result = await fwUpdate(device);
            break;
        case 'get-credentials':
            result = await TrezorConnect.thpGetCredentials({ device });
            break;
        case 'get-account-info':
            result = await TrezorConnect.getAccountInfo({
                device,
                coin: 'btc',
                path: "m/84'/0'/0'",
                ...params,
            });
            break;
        case 'get-features':
            result = await TrezorConnect.getFeatures({ device, ...params });
            break;
        case 'apply-settings':
            result = await TrezorConnect.applySettings({ device, ...params });
            break;
        case 'ping-device':
            // NOTE:
            // firmware _PROTOBUF_BUFFER_SIZE = const(8704)
            // T1B1 firmware Ping.message max_size:256
            result = await TrezorConnect.pingDevice({
                device,
                message: 'a'.repeat(8000),
                // button_protection: true,
            });
            break;
        case 'authenticate-device':
            result = await TrezorConnect.authenticateDevice({
                device,
                allowDebugKeys: true,
            });
            break;
        default:
            result = await TrezorConnect.getAddress({ device, path: "m/44'/0'/0'/0/0", ...params });
    }

    console.warn(result);
    process.exit(1);
};

const run = async () => {
    if (args.help || args.h) {
        console.log(HELP);

        return;
    }

    if (await runDbMethods()) {
        return;
    }

    let testIsRunning = false;

    console.log('Running @trezor/connect CLI with args', args);

    TrezorConnect.on('DEVICE_EVENT', async event => {
        console.info('DEVICE_EVENT', event);
        if (event.type === 'device-connect_unacquired' || event.type === 'device-connect') {
            if (testIsRunning) {
                return;
            }

            const device = event.payload;
            if (device.features && device.mode === 'initialize') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await TrezorConnect.loadDevice({
                    device,
                    pin: '',
                    label: 'THP device',
                    passphrase_protection: true,
                    mnemonics: ['all all all all all all all all all all all all'],
                    skip_checksum: true,
                });
            }

            if (!device.features && device.thp?.properties) {
                // start pairing
                const result = await getFeatures(device);
                if (!result.success) {
                    process.exit(1);
                }
            } else {
                testIsRunning = true;
                runDbMethods(device).then(dbOnly => {
                    if (!dbOnly) runTestCase(device);
                });
            }
        }

        if (event.type === 'device-thp_credentials_changed') {
            const { credentials } = event.payload;
            console.log('THP credentials', event.payload.credentials);
            const state = readCliState();
            if (!state.credentials.find(c => c.credential === credentials.credential)) {
                state.credentials.push(credentials);
                writeCliState(state);
            }
        }

        if (event.type === 'device-thp_pairing_status_changed') {
            if (event.payload.status === 'failed') {
                console.warn('THP phase error', event.payload.message);
            } else {
                console.warn('THP phase changed', event.payload.status);
            }
        }
    });

    TrezorConnect.on('UI_EVENT', async event => {
        console.info('UI_EVENT', event);

        if (event.type === 'ui-request_confirmation') {
            return TrezorConnect.uiResponse({
                type: 'ui-receive_confirmation',
                payload: true,
                requestId: event.requestId,
            });
        }

        if (event.type === 'ui-request_passphrase') {
            if (args['cancel-passphrase']) {
                return TrezorConnect.cancel();
            }
            if (args['cancel-passphrase-ui']) {
                // respond with no passphrase
                // @ts-expect-error
                return TrezorConnect.uiResponse({
                    type: 'ui-receive_passphrase',
                    requestId: event.requestId,
                });
            }

            const value = args.passphrase || '';
            TrezorConnect.uiResponse({
                type: 'ui-receive_passphrase',
                payload: { value, passphraseOnDevice: args['passphrase-on-device'] },
                requestId: event.requestId,
            });
        }

        if (event.type === 'ui-request_thp_pairing') {
            const tag = await waitForPairingTag(event);
            if (tag) {
                TrezorConnect.uiResponse({
                    type: 'ui-receive_thp_pairing_tag',
                    payload: { tag },
                    requestId: event.requestId,
                });
            } else {
                return TrezorConnect.cancel();
            }
        }

        if (event.type === 'ui-button') {
            if (!isDebugLinkInteraction('button')) {
                const resp = await waitForStdio(
                    `Confirm ${event.payload.code} (${event.payload.name}) on device or type [c] for Cancel:`,
                ).promise;
                if (resp === 'c') {
                    TrezorConnect.cancel();
                }
            } else {
                await debugLinkDecision();
            }
        }
    });

    let pairingMethods: any[] = ['CodeEntry', 'QrCode', 'NFC', 'SkipPairing'];
    if (args.pairing === 'none') {
        pairingMethods = ['SkipPairing'].concat(pairingMethods.filter(m => m === 'SkipPairing'));
    }
    if (args.pairing === 'qr') {
        pairingMethods = ['QrCode'].concat(pairingMethods.filter(m => m === 'QrCode'));
    }
    if (args.pairing === 'nfc') {
        pairingMethods = ['NFC'].concat(pairingMethods.filter(m => m === 'NFC'));
    }

    await initDebugLink();
    const transport = await getTransport();

    await TrezorConnect.init({
        manifest: { appUrl: 'a', appName: 'TrezorConnect Cli', email: 'b' },
        transports: [transport],
        pendingTransportEvent: false,
        debug: args.debug,
        thp: {
            appName: 'TrezorConnect Cli',
            hostName: 'localhost',
            knownCredentials: getThpCredentials(),
            pairingMethods,
        },
    });

    // Register the blockchain notification handler so every Bitcoin address notification
    // is looked up (or auto-labeled) in the local DB and logged.
    createBitcoinAddressNotificationHandler({
        trezorConnect: TrezorConnect,
        provider: new BitcoinAddressDb(getDbPath()),
        onAddressAnnotated: (descriptor, metadata) => {
            console.log('Address annotation:', { descriptor, metadata });
        },
    });
};

run();
