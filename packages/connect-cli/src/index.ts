import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { BitcoinAddressDb } from './bitcoin-address-db';
import { computeMerkleRoot, entryToValueBytes, generateMerkleProof, generateNonMembershipProof } from './merkle-tree';
import { verifyAndUpdateEntry, verifyEntry, verifyNonMembership } from './verify-authenticity';
import TrezorConnect, {
    type AddressMetadata,
    type Device,
    type MerkleProof,
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

const DB_METHODS = new Set(['dblookup', 'dbchange', 'dbapprove', 'dbclear']);

const getDbPath = (identifierHex: string) => {
    if (typeof args['db-path'] === 'string') return args['db-path'];
    const profileDir = path.join(os.homedir(), '.trezor');
    return path.join(profileDir, `auth_database_${identifierHex}.db`);
};

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
    if (!device) {
        console.error('A connected device is required to derive the database path.');
        process.exit(1);
    }
    // Derive identifier: SHA-256 of compressed public key at m/44'/0'/0'/0/0,
    // matching the firmware's own identifier derivation.
    const pubKeyResult = await TrezorConnect.getPublicKey({ device, path: "m/44'/0'/0'/0/0", coin: 'btc' });
    if (!pubKeyResult.success) {
        console.error('Failed to get public key from device:', pubKeyResult);
        process.exit(1);
    }
    const identifierHex = createHash('sha256')
        .update(Buffer.from(pubKeyResult.payload.publicKey, 'hex'))
        .digest('hex');
    console.log('Using database identifier:', identifierHex);
    const db = new BitcoinAddressDb(getDbPath(identifierHex));

    try {
        for (const method of dbMethods) {
            if (method === 'dblookup') {
                const { address, networkSymbol } = params;
                if (!address || !networkSymbol) {
                    console.error('dblookup requires --params=\'{"address":"...","networkSymbol":"..."}\' ');
                    process.exit(1);
                }
                const entry = db.lookup(address, networkSymbol);
                const treeState = db.getTreeState();
                const allEntries = db.getAllEntries();
                if (entry === null) {
                    const nm = generateNonMembershipProof(allEntries, address, networkSymbol);
                    const absent = await verifyNonMembership(address, nm.proof, nm.witnessAddress, nm.witnessValue, device);
                    console.log(JSON.stringify({ method: 'dblookup', address, networkSymbol, metadata: null, counter: null, proof: nm.proof, treeState }, null, 2));
                    console.log('Authenticity verified (non-membership):', absent);
                } else {
                    const allEntries = db.getAllEntries();
                    const proof = generateMerkleProof(allEntries, address, networkSymbol);
                    const authentic = await verifyEntry(address, networkSymbol, entry, proof, device);
                    console.log(JSON.stringify({ method: 'dblookup', address, networkSymbol, metadata: entry.metadata, counter: entry.counter, proof, treeState }, null, 2));
                    console.log('Authenticity verified:', authentic);
                }
            }

            if (method === 'dbchange') {
                const { address, networkSymbol, metadata: rawMetadata, mac: inputMac, deviceId: inputDeviceId } = params;
                if (!address || !networkSymbol || !rawMetadata) {
                    console.error(
                        'dbchange requires --params=\'{"address":"...","networkSymbol":"...","metadata":{...}}\' ',
                    );
                    process.exit(1);
                }
                const metadata: AddressMetadata = {
                    ...(rawMetadata.label !== undefined && { label: String(rawMetadata.label) }),
                    ...(rawMetadata.data !== undefined && { data: rawMetadata.data }),
                };
                const oldEntry = db.lookup(address, networkSymbol);
                const allEntries = db.getAllEntries();
                const treeState = db.getTreeState();
                const provisionalCounter = (treeState?.counter ?? 0) + 1;

                let currentProof: MerkleProof;
                let witnessAddress: string | null = null;
                let witnessValue: Buffer | null = null;

                if (oldEntry !== null) {
                    currentProof = generateMerkleProof(allEntries, address, networkSymbol);
                } else {
                    const nm = generateNonMembershipProof(allEntries, address, networkSymbol);
                    currentProof = nm.proof;
                    witnessAddress = nm.witnessAddress;
                    witnessValue = nm.witnessValue;
                }

                const result = await verifyAndUpdateEntry(
                    address, networkSymbol, oldEntry, metadata, currentProof, treeState,
                    provisionalCounter, witnessAddress, witnessValue,
                    inputMac, inputDeviceId, device,
                );

                if (!result.authentic) {
                    console.log('Authenticity verified: false — database not updated');
                } else {
                    db.upsert(address, networkSymbol, { metadata, counter: result.newEntryCounter });

                    let newTreeState = treeState;
                    if (result.newRoot !== null) {
                        const mac = result.mac ?? undefined;
                        const deviceId = result.deviceId ?? undefined;
                        newTreeState = { root: result.newRoot, counter: result.newEntryCounter, mac: mac ?? null, deviceId: deviceId ?? null };
                        db.setTreeState({ root: result.newRoot, counter: result.newEntryCounter }, mac, deviceId);
                    } else if (!device) {
                        // Offline: recompute root locally
                        const updatedEntries = db.getAllEntries();
                        const newRoot = computeMerkleRoot(updatedEntries);
                        newTreeState = { root: newRoot, counter: result.newEntryCounter, mac: null, deviceId: null };
                        db.setTreeState({ root: newRoot, counter: result.newEntryCounter });
                    }

                    const updatedEntries = db.getAllEntries();
                    const updatedProof = generateMerkleProof(updatedEntries, address, networkSymbol);
                    console.log(JSON.stringify({ method: 'dbchange', address, networkSymbol, metadata, counter: result.newEntryCounter, proof: updatedProof, treeState: newTreeState, mac: result.mac }, null, 2));
                    console.log('Authenticity verified:', result.authentic);
                }
            }

            if (method === 'dbapprove') {
                const { address, networkSymbol } = params;
                if (!address || !networkSymbol) {
                    console.error('dbapprove requires --params=\'{"address":"...","networkSymbol":"..."}\' ');
                    process.exit(1);
                }
                if (!device) {
                    console.error('dbapprove requires a connected device');
                    process.exit(1);
                }
                const entry = db.lookup(address, networkSymbol);
                if (entry === null) {
                    console.error('dbapprove: address not found in database — run dbchange first');
                    process.exit(1);
                }
                const addressHex = Buffer.from(address, 'utf8').toString('hex');
                const valueHex = entryToValueBytes(networkSymbol, entry).toString('hex');
                const approveResult = await TrezorConnect.authDbApprove({ device, address: addressHex, value: valueHex });
                if (!approveResult.success) {
                    console.error('dbapprove failed:', approveResult);
                    process.exit(1);
                }
                const { mac, identifier: deviceId } = approveResult.payload;
                db.setApproval(address, networkSymbol, mac, deviceId);
                console.log(JSON.stringify({ method: 'dbapprove', address, networkSymbol, mac, deviceId }, null, 2));
            }

            if (method === 'dbclear') {
                if (!device) {
                    console.error('dbclear requires a connected device');
                    process.exit(1);
                }
                const result = await TrezorConnect.authDbClearRoot({ device });
                if (!result.success) {
                    console.error('dbclear failed:', result.payload.error);
                    process.exit(1);
                }
                db.clearAll();
                console.log(JSON.stringify({ method: 'dbclear', identifier: result.payload.identifier }, null, 2));
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

    // Run DB methods without a device only when no device connection is requested.
    // If --autoconnect or --credentials is set, skip early exit so TrezorConnect
    // initializes and the DEVICE_EVENT handler calls runDbMethods(device).
    const wantsDevice = args.autoconnect || args.credentials;
    if (!wantsDevice && (await runDbMethods())) {
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
                    if (dbOnly) process.exit(0);
                    else runTestCase(device);
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

    // Blockchain notification handler requires a seed-derived DB path; it is wired up
    // inside the DEVICE_EVENT handler once the device is known.
};

run();
