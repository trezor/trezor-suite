import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { AuthLabelDb } from '@trezor/authdb/src/storage/sqlite';
import TrezorConnect, {
    type AuthLabelMetadata,
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

const DB_METHODS = new Set(['dbinit', 'dblookup', 'dbchange', 'dbsetroot', 'dblistroots']);
const DB_METHODS_REQUIRING_PARAMS = new Set(['dbinit', 'dblookup', 'dbchange']);
// Methods that must send a command to firmware (need a connected device even when --db-path is set)
const DB_METHODS_NEEDING_DEVICE = new Set(['dbinit', 'dblookup', 'dbchange', 'dbsetroot']);

// When --db-path is explicit, the DB path is known upfront (independent of the
// device), so it can be constructed before TrezorConnect.init() and injected as
// `authLabelLookupProvider`. When the path must be derived from the device's pubkey
// (no --db-path), the provider isn't known until after a device round-trip — in that
// case runDbMethods() injects it post-init via TrezorConnect.updateConnectSettings().
// Either way, dbchange/dblookup always call the high-level authDbUpdateAddress/
// authDbVerifyAddress methods, which compute Merkle proofs internally.
const hasExplicitDbPath = typeof args['db-path'] === 'string';
const explicitDb = hasExplicitDbPath ? new AuthLabelDb(args['db-path'] as string) : null;

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
    // The high-level AuthDb methods require walletId to equal the device's own
    // SLIP-21-derived wallet_id (they reject a mismatch AFTER the device commits, which
    // also strands the local cache). It can't be derived host-side, so unless the caller
    // pins it with --wallet-id we fetch it from the device below, once the provider is set.
    const walletIdExplicit = typeof args['wallet-id'] === 'string';
    let walletId = walletIdExplicit ? (args['wallet-id'] as string) : 'default';

    let identifierHex: string;
    let db: AuthLabelDb;

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
        db = new AuthLabelDb(getDbPath(identifierHex));

        // The provider wasn't known at TrezorConnect.init() time — the path depends on the
        // device's pubkey — so inject it now via updateConnectSettings before dbchange/
        // dblookup below call the high-level methods that read it.
        await TrezorConnect.updateConnectSettings({ authLabelLookupProvider: db });
    }

    // Resolve walletId to the device's real wallet_id (SLIP-21 "AUTHDB DEVICE ID").
    // The low-level AuthDbLookup echoes it and — unlike the high-level methods — does NOT
    // reject a wallet_id mismatch, so a throwaway probe works even while walletId is still
    // 'default'. Without this, every high-level method rejects the device's echoed wallet_id
    // as a mismatch. Skipped when the caller pinned --wallet-id, or when there's no device.
    if (!walletIdExplicit && device) {
        try {
            const probe = await TrezorConnect.authDbLookup({
                device,
                address: Buffer.from('__walletid_probe__').toString('hex'),
                proof: [],
            });
            console.log('[walletId] authDbLookup probe raw result:', JSON.stringify(probe));
            if (probe.success && probe.payload.wallet_id) {
                walletId = probe.payload.wallet_id;
                console.log('Using device wallet_id:', walletId);
            } else {
                // Loud, not silent: if we can't resolve the device's real wallet_id here, the
                // high-level methods will reject every call ('default' != device wallet_id).
                console.warn(
                    '[walletId] could NOT resolve device wallet_id; falling back to',
                    JSON.stringify(walletId),
                );
            }
        } catch (err) {
            console.warn(
                '[walletId] authDbLookup probe THREW:',
                err instanceof Error ? `${err.name}: ${err.message}` : String(err),
            );
        }
    }

    try {
        for (const method of dbMethods) {
            if (method === 'dbinit') {
                // qmCounter/qmSignature come from the Quota Manager (relayed here via
                // --db-params for testing); the root + its attesting counter/mac come from
                // the local tree_state (Evolu's role). The device verifies the QM signature,
                // then (if a root is supplied) that counter == qm_last_counter and that the
                // root_mac is one it produced itself.
                const { qmCounter, qmSignature } = params;
                if (qmCounter === undefined || !qmSignature) {
                    console.error(
                        'dbinit requires --db-params=\'{"qmCounter":<n>,"qmSignature":"<hex>"}\' ',
                    );
                    process.exit(1);
                }
                if (!device) {
                    console.error('dbinit requires a connected device');
                    process.exit(1);
                }
                const treeState = db.getTreeState(walletId);
                const initParams: Parameters<typeof TrezorConnect.authDbInit>[0] = {
                    device,
                    qm_counter: qmCounter,
                    qm_signature: qmSignature,
                    ...(treeState?.root &&
                        treeState.mac && {
                            root: treeState.root,
                            counter: treeState.counter,
                            root_mac: treeState.mac,
                        }),
                };
                const initResult = await TrezorConnect.authDbInit(initParams);
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

                const result = await TrezorConnect.authDbVerifyAddress({
                    device: device!,
                    address,
                    networkSymbol,
                    walletId,
                });
                if (!result.success) {
                    console.error('authDbVerifyAddress failed:', result);
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

            if (method === 'dbchange') {
                const { address, networkSymbol, metadata: rawMetadata } = params;
                if (!address || !networkSymbol || !rawMetadata) {
                    console.error(
                        'dbchange requires --db-params=\'{"address":"...","networkSymbol":"...","metadata":{...}}\' ',
                    );
                    process.exit(1);
                }
                const metadata: AuthLabelMetadata = {
                    ...(rawMetadata.label !== undefined && { label: String(rawMetadata.label) }),
                    ...(rawMetadata.data !== undefined && { data: rawMetadata.data }),
                };

                const result = await TrezorConnect.authDbUpdateAddress({
                    device: device!,
                    address,
                    networkSymbol,
                    metadata,
                    walletId,
                });
                if (!result.success) {
                    console.error('authDbUpdateAddress failed:', result);
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

            if (method === 'dbsetroot') {
                if (!device) {
                    console.error('dbsetroot requires a connected device');
                    process.exit(1);
                }
                const treeState = db.getTreeState(walletId);
                if (!treeState?.root) {
                    console.error(
                        'dbsetroot: no root stored in local database — run dbchange first',
                    );
                    process.exit(1);
                }
                const setRootParams: Parameters<typeof TrezorConnect.authDbSetRoot>[0] = {
                    device,
                    root: treeState.root,
                    // mac is required by the wire protocol; all-zero is accepted only on
                    // debug builds (plain unauthenticated root injection).
                    mac: treeState.mac ?? '0'.repeat(64),
                    ...(treeState.mac !== undefined && {
                        wallet_id: walletId,
                        counter: treeState.counter,
                    }),
                };
                const setRootResult = await TrezorConnect.authDbSetRoot(setRootParams);
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
                const treeState = db.getTreeState(walletId);
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
        ...(explicitDb && { authLabelLookupProvider: explicitDb }),
    });

    // Blockchain notification handler requires a seed-derived DB path; it is wired up
    // inside the DEVICE_EVENT handler once the device is known.
};

run();
