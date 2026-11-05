import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

import TrezorConnect, {
    type Device,
    ThpPairingMethod,
    UI_EVENT,
    UI_EVENTS,
    UI_REQUEST,
    UI_REQUESTS,
    UI_RESPONSE,
    type UiRequestThpPairing,
    initLog,
} from '@trezor/connect';
import type { WardLabel } from '@trezor/ward';
import { WardDb } from '@trezor/ward/src/storage/sqlite';
import { Wardd } from '@trezor/wardd/src/service';
import { MockWm } from '@trezor/wardd/src/wm';

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

const DB_METHODS = new Set([
    'dbinit',
    'dblookup',
    'dbdisplay',
    'dbchange',
    'dbdelete',
    'dbsetroot',
    'dblistroots',
]);
const DB_METHODS_REQUIRING_PARAMS = new Set([
    'dbinit',
    'dblookup',
    'dbdisplay',
    'dbchange',
    'dbdelete',
]);
// Methods that must send a command to firmware (need a connected device even when --db-path is set)
const DB_METHODS_NEEDING_DEVICE = new Set([
    'dbinit',
    'dblookup',
    'dbdisplay',
    'dbchange',
    'dbdelete',
    'dbsetroot',
]);

// wardd runs in-process over the sqlite store, with the debug WM (debug firmware only); Connect's
// WARD methods only relay the device to it. When --db-path is explicit, the store is known upfront
// and wardd is given at TrezorConnect.init(). When the path must be derived from the device's
// pubkey (no --db-path), it isn't known until after a device round-trip -- runDbMethods() then
// gives it post-init via TrezorConnect.updateConnectSettings().
const warddFor = (db: WardDb) => new Wardd({ storage: db, wm: new MockWm() });
const hasExplicitDbPath = typeof args['db-path'] === 'string';
const explicitDb = hasExplicitDbPath ? new WardDb(args['db-path'] as string) : null;

const getDbPath = (identifierHex: string) => {
    if (typeof args['db-path'] === 'string') return args['db-path'];
    const profileDir = path.join(os.homedir(), '.trezor');

    return path.join(profileDir, `auth_database_${identifierHex}.db`);
};

const getMethods = (): string[] => {
    const methods =
        args.method && args.method !== 'none'
            ? String(args.method)
                  .split(',')
                  .map((m: string) => m.trim())
            : [args.method ?? 'none'];
    if (args.dblistroots && !methods.includes('dblistroots')) methods.push('dblistroots');

    return methods;
};

// Run DB methods, optionally with a device for authenticity verification.
// Returns true if all requested methods were DB methods (caller can skip TrezorConnect init).
const runDbMethods = async (device?: Device): Promise<boolean> => {
    const methods = getMethods();
    const dbMethods = methods.filter(m => DB_METHODS.has(m));
    if (dbMethods.length === 0) return false;

    const needsParams = dbMethods.some(m => DB_METHODS_REQUIRING_PARAMS.has(m));
    let params: any = {};
    if (needsParams) {
        if (!args['db-params']) {
            console.error(
                'This DB method requires --db-params (note the double dash). Example:\n' +
                    '  --db-params=\'{"address":"...","networkSymbol":"btc"}\'',
            );
            process.exit(1);
        }
        try {
            params = JSON.parse(args['db-params']);
        } catch (e) {
            console.error('Invalid JSON in --db-params:', (e as Error).message);
            console.error('Received:', args['db-params']);
            process.exit(1);
        }
    }
    const needsDevice = dbMethods.some(m => DB_METHODS_NEEDING_DEVICE.has(m));
    // The high-level Ward methods key everything by the device's SLIP21-derived
    // wardId (the WM-facing anchor). It scopes the local provider AND the device
    // echoes its own ward_id, which the methods reject on mismatch. It can't be
    // derived host-side, so unless the caller pins it with --ward-id we fetch it
    // from the device below, once the provider is set.
    const wardIdExplicit = typeof args['ward-id'] === 'string';
    let wardId = wardIdExplicit ? (args['ward-id'] as string) : 'default';

    let identifierHex: string;
    let db: WardDb;

    if (explicitDb) {
        if (needsDevice && !device) {
            console.error('A connected device is required for this DB method.');
            process.exit(1);
        }
        identifierHex = '(explicit-path)';
        db = explicitDb;
    } else {
        if (!device) {
            console.error('A connected device is required to derive the database path.');
            process.exit(1);
        }
        // Derive identifier: SHA-256 of compressed public key at m/44'/0'/0'/0/0,
        // matching the firmware's own identifier derivation.
        const pubKeyResult = await TrezorConnect.getPublicKey({
            device,
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
        });
        if (!pubKeyResult.success) {
            console.error('Failed to get public key from device:', pubKeyResult);
            process.exit(1);
        }
        identifierHex = createHash('sha256')
            .update(Buffer.from(pubKeyResult.payload.publicKey, 'hex'))
            .digest('hex');
        console.log('Using database identifier:', identifierHex);
        db = new WardDb(getDbPath(identifierHex));

        // The store wasn't known at TrezorConnect.init() time — the path depends on the
        // device's pubkey — so give wardd now, before the WARD methods below relay to it.
        await TrezorConnect.updateConnectSettings({ wardd: warddFor(db) });
    }

    // Resolve wardId to the device's real SLIP21 ward_id. WARDListPendingEdits is
    // input-free and always echoes ward_id regardless of tree state, so it's a safe
    // throwaway probe. (WARDLookup can't be used for this: once the tree is non-empty
    // it rejects a proofless query before echoing anything.) Without this, every
    // high-level method rejects the device's echoed ward_id as a mismatch and the
    // provider is keyed under the wrong id. Skipped when the caller pinned --ward-id,
    // or when there's no device.
    if (!wardIdExplicit && device) {
        try {
            const probe = await TrezorConnect.wardListPending({ device });
            console.log('[wardId] wardListPending probe raw result:', JSON.stringify(probe));
            if (probe.success && probe.payload.ward_id) {
                wardId = probe.payload.ward_id;
                console.log('Using device ward_id:', wardId);
            } else {
                // Loud, not silent: if we can't resolve the device's real ward_id here, the
                // high-level methods will reject every call ('default' != device ward_id).
                console.warn(
                    '[wardId] could NOT resolve device ward_id; falling back to',
                    JSON.stringify(wardId),
                );
            }
        } catch (err) {
            console.warn(
                '[wardId] wardListPending probe THREW:',
                err instanceof Error ? `${err.name}: ${err.message}` : String(err),
            );
        }
    }

    // Pin the wallet only once it is known: wardd refuses a device whose ward_id differs.
    const pinned = wardId === 'default' ? {} : { wardId };

    try {
        for (const method of dbMethods) {
            if (method === 'dbinit') {
                // WARD sync round, run by wardd: the WM attests the head wardd stores and the
                // device adopts it (WARDSync -> IngestAttestation -> Reconcile).
                if (!device) {
                    console.error('dbinit requires a connected device');
                    process.exit(1);
                }
                const initResult = await TrezorConnect.wardInit({ device, ...pinned });
                if (!initResult.success) {
                    console.error('dbinit failed:', initResult);
                    process.exit(1);
                }
                console.log(JSON.stringify({ method: 'dbinit', ...initResult.payload }, null, 2));
            }

            if (method === 'dblookup') {
                const { address, networkSymbol } = params;
                if (!address || !networkSymbol) {
                    console.error(
                        'dblookup requires --db-params=\'{"address":"...","networkSymbol":"..."}\' ',
                    );
                    process.exit(1);
                }

                // Domain the entry lives in; defaults to the network symbol (each
                // network its own domain) unless --db-params names an explicit appId.
                const appId = params.appId ?? networkSymbol;
                const result = await TrezorConnect.wardVerify({
                    device: device!,
                    appId,
                    address,
                    networkSymbol,
                    ...pinned,
                });
                if (!result.success) {
                    console.error('wardVerify failed:', result);
                    process.exit(1);
                }
                console.log(
                    JSON.stringify(
                        {
                            method: 'dblookup',
                            address,
                            networkSymbol,
                            isMember: result.payload.isMember,
                            counter: result.payload.counter,
                        },
                        null,
                        2,
                    ),
                );
                console.log('Authenticity verified:', result.payload.valid);
            }

            if (method === 'dbdisplay') {
                const { address, networkSymbol } = params;
                if (!address || !networkSymbol) {
                    console.error(
                        'dbdisplay requires --db-params=\'{"address":"...","networkSymbol":"..."}\' ',
                    );
                    process.exit(1);
                }

                // Unlike dblookup (a screenless verification query), dbdisplay drives the
                // DisplayAddress flow so the device renders the verified label on-screen.
                // Domain defaults to the network symbol (matching dbchange/dblookup) unless
                // --db-params names an explicit appId.
                const appId = params.appId ?? networkSymbol;
                const result = await TrezorConnect.wardDisplayAddress({
                    device: device!,
                    appId,
                    address,
                    networkSymbol,
                    ...pinned,
                });
                if (!result.success) {
                    console.error('wardDisplayAddress failed:', result);
                    process.exit(1);
                }
                console.log(
                    JSON.stringify(
                        {
                            method: 'dbdisplay',
                            address,
                            networkSymbol,
                            wardId: result.payload.wardId,
                            shown: result.payload.shown,
                        },
                        null,
                        2,
                    ),
                );
            }

            if (method === 'dbchange') {
                const { address, networkSymbol, metadata: rawMetadata } = params;
                // Explicit delete. `metadata:{}` is NOT a delete -- it updates the leaf to
                // the literal value "<networkSymbol>:{}" and the entry survives as a
                // tombstone. A delete needs no metadata.
                const removing = params.delete === true;
                if (!address || !networkSymbol || (!rawMetadata && !removing)) {
                    console.error(
                        'dbchange requires --db-params=\'{"address":"...","networkSymbol":"...","metadata":{...}}\'\n' +
                            '  or, to delete: --db-params=\'{"address":"...","networkSymbol":"...","delete":true}\'',
                    );
                    process.exit(1);
                }
                const metadata: WardLabel = {
                    ...(rawMetadata?.label !== undefined && { label: String(rawMetadata.label) }),
                    ...(rawMetadata?.data !== undefined && { data: rawMetadata.data }),
                };

                // Domain the entry is written to; defaults to the network symbol
                // unless --db-params names an explicit appId.
                const appId = params.appId ?? networkSymbol;
                const result = await TrezorConnect.wardUpdate({
                    device: device!,
                    appId,
                    address,
                    networkSymbol,
                    metadata,
                    ...pinned,
                    ...(removing && { delete: true }),
                });
                if (!result.success) {
                    console.error('wardUpdate failed:', result);
                    console.log('Authenticity verified: false — database not updated');
                } else {
                    console.log(
                        JSON.stringify(
                            {
                                method: 'dbchange',
                                address,
                                networkSymbol,
                                metadata,
                                counter: result.payload.counter,
                                root: result.payload.root,
                            },
                            null,
                            2,
                        ),
                    );
                    console.log('Authenticity verified: true');
                }
            }

            if (method === 'dbdelete') {
                // Dedicated FULL delete: the device shows its own "Delete WARD entry"
                // screen (br_name "ward_delete"), removes the leaf from the trie, and the
                // host drops the record. This is NOT `dbchange` with empty metadata --
                // that serializes to "<networkSymbol>:{}" and would leave a tombstone.
                const { address, networkSymbol } = params;
                if (!address || !networkSymbol) {
                    console.error(
                        'dbdelete requires --db-params=\'{"address":"...","networkSymbol":"..."}\'',
                    );
                    process.exit(1);
                }
                const appId = params.appId ?? networkSymbol;
                const result = await TrezorConnect.wardUpdate({
                    device: device!,
                    appId,
                    address,
                    networkSymbol,
                    metadata: {},
                    ...pinned,
                    delete: true,
                });
                if (!result.success) {
                    console.error('wardUpdate(delete) failed:', result);
                    console.log('Authenticity verified: false — entry not deleted');
                } else {
                    // Prove the deletion: after a FULL delete the path must be provably
                    // ABSENT, so re-verify on-device. A tombstone would come back
                    // isMember:true; a broken delete would come back valid:false.
                    const check = await TrezorConnect.wardVerify({
                        device: device!,
                        appId,
                        address,
                        networkSymbol,
                        ...pinned,
                    });
                    const proven = check.success && check.payload.valid && !check.payload.isMember;
                    console.log(
                        JSON.stringify(
                            {
                                method: 'dbdelete',
                                address,
                                networkSymbol,
                                counter: result.payload.counter,
                                root: result.payload.root,
                                nonMembershipProven: proven,
                                ...(check.success && {
                                    verify: {
                                        valid: check.payload.valid,
                                        isMember: check.payload.isMember,
                                    },
                                }),
                            },
                            null,
                            2,
                        ),
                    );
                    if (proven) {
                        console.log('Authenticity verified: true — entry absent (proven)');
                    } else {
                        console.log(
                            'Authenticity verified: false — delete committed but absence NOT proven',
                        );
                    }
                }
            }

            if (method === 'dbsetroot') {
                if (!device) {
                    console.error('dbsetroot requires a connected device');
                    process.exit(1);
                }
                const treeState = db.getTreeState(wardId);
                if (!treeState?.root) {
                    console.error(
                        'dbsetroot: no root stored in local database — run dbchange first',
                    );
                    process.exit(1);
                }
                // wardSetRoot now maps to the DEBUG-ONLY WARDDebugSetRoot (unauthenticated
                // single-call root injection; rejected on production firmware). It takes only
                // the root — the device stamps a fresh counter/mac itself.
                const setRootParams: Parameters<typeof TrezorConnect.wardSetRoot>[0] = {
                    device,
                    root: treeState.root,
                };
                const setRootResult = await TrezorConnect.wardSetRoot(setRootParams);
                if (!setRootResult.success) {
                    console.error('dbsetroot failed:', setRootResult);
                    process.exit(1);
                }
                console.log(
                    JSON.stringify(
                        {
                            method: 'dbsetroot',
                            root: treeState.root,
                            counter: setRootResult.payload.counter,
                            walletId: setRootResult.payload.wallet_id,
                            mac: treeState.mac,
                        },
                        null,
                        2,
                    ),
                );
            }

            if (method === 'dblistroots') {
                const treeState = db.getTreeState(wardId);
                if (!treeState?.root) {
                    console.log(
                        JSON.stringify({ method: 'dblistroots', treeState: null }, null, 2),
                    );
                    console.log('No root stored — run dbchange first.');
                } else {
                    const dbPath = getDbPath(identifierHex);
                    const setrootCmd = [
                        `yarn workspace @trezor/connect-cli usb --method=dbsetroot`,
                        `--db-path=${dbPath}`,
                    ].join(' \\\n  ');
                    console.log(JSON.stringify({ method: 'dblistroots', treeState }, null, 2));
                    console.log('To sync this root to another device:');
                    console.log(`  ${setrootCmd}`);
                }
            }
        }
    } finally {
        // db.dispose() is idempotent, so this is safe even though connect may also dispose
        // the same instance (via TrezorConnect.dispose() or a provider swap) — whichever
        // fires first wins, the sqlite handle only ever closes once.
        db.dispose();
    }

    // Return true only if every requested method was a DB method
    return methods.every(m => DB_METHODS.has(m));
};

const cliStatePath = path.join(import.meta.dirname, 'thp-state.dat');
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
        baseUrl: path.resolve(import.meta.dirname, '../connect-data/files'),
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
        case 'nostr-get-public-key':
            result = await TrezorConnect.nostrGetPublicKey({
                device,
                __experimental: true,
                path: "m/44'/1237'/0'/0/0",
                ...params,
            });
            break;
        case 'nostr-sign-event':
            result = await TrezorConnect.nostrSignEvent({
                device,
                __experimental: true,
                path: "m/44'/1237'/0'/0/0",
                created_at: Math.floor(Date.now() / 1000),
                kind: 1,
                tags: [],
                content: 'Hello from @trezor/connect-cli',
                ...params,
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

    // Skip device initialization entirely when --db-path is explicit and no requested
    // method needs to contact firmware (e.g. --dblistroots --db-path=...).
    const requestedDbMethods = getMethods().filter(m => DB_METHODS.has(m));
    const dbNeedsDevice = requestedDbMethods.some(m => DB_METHODS_NEEDING_DEVICE.has(m));
    const canSkipDevice = hasExplicitDbPath && !dbNeedsDevice;

    const wantsDevice = args.autoconnect || args.credentials;
    if ((!wantsDevice || canSkipDevice) && (await runDbMethods())) {
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

    TrezorConnect.on(UI_EVENT, async event => {
        console.info('UI_EVENT', event);

        if (event.type === UI_EVENTS.BUTTON_REQUEST) {
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

    TrezorConnect.on(UI_REQUEST, async event => {
        console.info('UI_REQUEST', event);

        if (event.type === UI_REQUESTS.REQUEST_CONFIRMATION) {
            return TrezorConnect.uiResponse({
                type: UI_RESPONSE.RECEIVE_CONFIRMATION,
                payload: true,
                requestId: event.requestId,
            });
        }

        if (event.type === UI_REQUESTS.REQUEST_PASSPHRASE) {
            if (args['cancel-passphrase']) {
                return TrezorConnect.cancel();
            }
            if (args['cancel-passphrase-ui']) {
                // respond with no passphrase
                // @ts-expect-error
                return TrezorConnect.uiResponse({
                    type: UI_RESPONSE.RECEIVE_PASSPHRASE,
                    requestId: event.requestId,
                });
            }

            const value = args.passphrase || '';
            TrezorConnect.uiResponse({
                type: UI_RESPONSE.RECEIVE_PASSPHRASE,
                payload: { value, passphraseOnDevice: args['passphrase-on-device'] },
                requestId: event.requestId,
            });
        }

        if (event.type === UI_REQUESTS.REQUEST_THP_PAIRING_TAG) {
            const tag = await waitForPairingTag(event);
            if (tag) {
                TrezorConnect.uiResponse({
                    type: UI_RESPONSE.RECEIVE_THP_PAIRING_TAG,
                    payload: { tag },
                    requestId: event.requestId,
                });
            } else {
                return TrezorConnect.cancel();
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
        debug: args.debug,
        // connect runs in-process here, so supply the core logger factory directly.
        // TODO(logger-unification): build from a unified app-wide logger instead of initLog.
        createLogger: (prefix: string) => initLog(prefix, !!args.debug),
        thp: {
            appName: 'TrezorConnect Cli',
            hostName: 'localhost',
            knownCredentials: getThpCredentials(),
            pairingMethods,
        },
        ...(explicitDb && { wardd: warddFor(explicitDb) }),
    });

    // Blockchain notification handler requires a seed-derived DB path; it is wired up
    // inside the DEVICE_EVENT handler once the device is known.
};

run();
