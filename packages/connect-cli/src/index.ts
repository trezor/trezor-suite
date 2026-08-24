import fs from 'fs';
import path from 'path';

import TrezorConnect, {
    type Device,
    ThpPairingMethod,
    type UiRequestThpPairing,
    initLog,
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
import { getWardCommand, missingWardParams } from './wardCommands';
import { runWardCommand } from './wardRunners';

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

    // WARD commands come from their own registry rather than this switch: the registry is what
    // declares them and what `--help` describes, so a name that exists there must not need a
    // second entry here to be runnable.
    const wardCommand = getWardCommand(method);
    if (wardCommand) {
        // One place decides what a WARD command's inputs are: `--params` JSON overlaid with the
        // dedicated flags. That is why the registry can name `appid` and `scope` in the same list
        // without knowing which spelling the caller used -- and why a flag wins, being the more
        // specific thing to type.
        const wardParams = {
            ...params,
            ...(args.appid !== undefined ? { appid: args.appid } : {}),
            ...(args.ident !== undefined ? { ident: args.ident } : {}),
            ...(args.value !== undefined ? { value: args.value } : {}),
            ...(args.entry !== undefined ? { entry: args.entry } : {}),
            ...(args.target !== undefined ? { target: args.target } : {}),
            ...(args.compact !== undefined ? { compact: args.compact } : {}),
            ...(args.service !== undefined ? { service: args.service } : {}),
        };
        // `scope` was the JSON name for what the flags call `ident`. Aliasing it here means one
        // vocabulary reaches the registry and the runners, so neither has to know both spellings.
        if (wardParams.ident === undefined && wardParams.scope !== undefined) {
            wardParams.ident = wardParams.scope;
        }
        if (wardParams.appid === undefined && wardParams.app_id !== undefined) {
            wardParams.appid = wardParams.app_id;
        }

        // The registry says whether `--queue` means anything for a command, and now that is
        // enforced rather than merely declared: `ward_flush` PUBLISHES, which is the opposite of
        // operating on the device's own store, and a silently ignored flag there would look like a
        // queue operation and behave like a write to the tree.
        if (args.queue && !wardCommand.supportsQueue) {
            console.error(`${wardCommand.name} has no --queue form`);
            process.exit(1);
        }

        const missing = missingWardParams(wardCommand, wardParams);
        if (missing.length) {
            console.error(`${wardCommand.name} needs: ${missing.join(', ')}`);
            process.exit(1);
        }

        const wardResult = await runWardCommand(
            wardCommand.name,
            { queue: !!args.queue, params: wardParams },
            device,
        );

        console.warn(wardResult);

        // `--then`: A SECOND WARD COMMAND IN THE SAME PROCESS, once the first has finished. What it
        // buys is a write and the read of what that write produced against ONE connection, one
        // channel and one daemon -- which is how a real app uses this and is awkward to arrange from
        // a shell, since each invocation otherwise costs a channel.
        //
        // IT DOES NOT SHARE THE DEVICE'S WARD SYNC LATCH, and it was written believing it would.
        // That latch is SESSION state (`APP_WARD_ONLINE`, in the THP session cache), and connect
        // opens a NEW device session per method call -- `ThpCreateNewSession` goes out before each
        // one -- so the second operation starts offline and syncs again. The firmware's own
        // `test_a_write_is_published_and_adopted` is where the in-session property is pinned; it
        // cannot be observed through this host. See `e2e/ward-queue.sh` step 26.
        //
        // The same inputs are reused deliberately: the pair worth running this way is a write and
        // then a read of the entry just written, and re-typing the key would be one more thing that
        // could differ between them.
        const thenCommand = getWardCommand(args.then);
        if (args.then !== undefined && !thenCommand) {
            console.error(`--then names no WARD command: ${args.then}`);
            process.exit(1);
        }

        if (thenCommand) {
            const thenMissing = missingWardParams(thenCommand, wardParams);
            if (thenMissing.length) {
                console.error(`--then=${thenCommand.name} needs: ${thenMissing.join(', ')}`);
                process.exit(1);
            }

            const thenResult = await runWardCommand(
                thenCommand.name,
                // NOT `args.queue`: the flag belongs to the first command. A chained read of a
                // change that was just published is an ONLINE read, and inheriting --queue would
                // have it answer from the device's own store instead -- the exact confusion the
                // two request types exist to prevent.
                { queue: false, params: wardParams },
                device,
            );

            console.warn(thenResult);
        }

        process.exit(1);
    }

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
                runTestCase(device);
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
        // connect runs in-process here, so supply the core logger factory directly.
        // TODO(logger-unification): build from a unified app-wide logger instead of initLog.
        createLogger: (prefix: string) => initLog(prefix, !!args.debug),
        thp: {
            appName: 'TrezorConnect Cli',
            hostName: 'localhost',
            knownCredentials: getThpCredentials(),
            pairingMethods,
        },
    });
};

run();
