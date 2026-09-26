import { UI_EVENTS, UI_REQUESTS, UI_RESPONSE, getLog, initLog } from '@trezor/connect-common';
import type { ApplySettings } from '@trezor/protobuf/src/definitions';
import { BridgeTransport } from '@trezor/transport-common';
import type { EmuStartOptsType, TrezorUserEnvLinkClass } from '@trezor/trezor-user-env-link';
import { MNEMONICS, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { createDeferred, versionUtils } from '@trezor/utils';

import TrezorConnect from '../src';
import { THP_CREDENTIALS_AUTOCONNECT } from './common-thp-credentials';

// Read emulator start options from EMULATOR_START_OPTS env var (JSON string set by run.ts).
// In browser mode, Vite's `define` replaces process.env.EMULATOR_START_OPTS at build time.
const emulatorStartOpts: EmuStartOptsType = process.env.EMULATOR_START_OPTS
    ? JSON.parse(process.env.EMULATOR_START_OPTS)
    : {};

const emuStartType = emulatorStartOpts.type;
const firmware: string | null =
    'version' in emulatorStartOpts ? emulatorStartOpts.version || null : null;
const deviceModel = emulatorStartOpts.model;

if (!deviceModel) {
    throw new Error('Device model must be provided');
}

switch (emuStartType) {
    case 'emulator-start':
    case undefined:
        if (!firmware) {
            throw new Error('Firmware version must be provided');
        }
        break;
    case 'emulator-start-from-url':
        if (!emulatorStartOpts.url) {
            throw new Error('URL must be provided');
        }
        break;
    case 'emulator-start-from-branch':
        if (!emulatorStartOpts.branch) {
            throw new Error('Branch must be provided');
        }
        break;
    default:
        throw new Error('Unknown emulator start type');
}

export const getController = () => {
    TrezorUserEnvLink.on('disconnected', () => {
        console.error('TrezorUserEnvLink WS disconnected');
    });

    return TrezorUserEnvLink;
};

// Captures device screen content at every ButtonRequest the autoConfirm handler
// processes — but only when explicitly enabled per-test via
// setScreenCaptureEnabled(true). getScreenContent() is a round-trip to
// trezor-user-env (~500ms) so we don't pay it for tests that don't assert on
// it. Stored as JSON strings so structural fields (e.g. {lines, title})
// survive substring assertions. Reset per-test by methods.test.ts.
const capturedScreens: string[] = [];
let screenCaptureEnabled = false;
export const resetCapturedScreens = () => {
    capturedScreens.length = 0;
};
export const getCapturedScreens = () => [...capturedScreens];
export const setScreenCaptureEnabled = (enabled: boolean) => {
    screenCaptureEnabled = enabled;
};

type Options = {
    mnemonic: string;
    passphrase_protection?: boolean;
    pin?: string;
    label?: string;
    settings?: ApplySettings;
    wiped?: boolean;
};
export const setup = async (
    // eslint-disable-next-line @typescript-eslint/no-shadow
    TrezorUserEnvLink: TrezorUserEnvLinkClass,
    options?: Partial<Options>,
) => {
    await TrezorUserEnvLink.connect();

    if (!options) {
        return true;
    }

    await TrezorUserEnvLink.stopEmu();
    // after bridge is stopped, trezor-user-env automatically resolves to use udp transport.
    // this is actually good as we avoid possible race conditions when setting up emulator for
    // the test using the same transport
    await TrezorUserEnvLink.stopBridge();

    if (!options?.mnemonic && !options.wiped) return true; // skip setup if test is not using the device (composeTransaction)

    switch (emuStartType) {
        case 'emulator-start':
        case undefined:
            await TrezorUserEnvLink.startEmu(emulatorStartOpts);
            break;
        case 'emulator-start-from-url':
            await TrezorUserEnvLink.startEmuFromUrl(emulatorStartOpts);
            break;
        case 'emulator-start-from-branch':
            await TrezorUserEnvLink.startEmuFromBranch(emulatorStartOpts);
            break;
        default:
            throw new Error('Unknown emulator start type');
    }

    const { settings, ...restOptions } = options;

    if (!options.wiped) {
        const mnemonic = options.mnemonic || MNEMONICS.mnemonic_all;

        await TrezorUserEnvLink.setupEmu({
            ...restOptions,
            mnemonic,
            pin: options.pin || '',
            passphrase_protection: !!options.passphrase_protection,
            label: options.label || 'TrezorT',
            needs_backup: false,
        });
    }

    if (settings) {
        // allow apply-settings to fail, older FW may not know some flags yet
        try {
            await TrezorUserEnvLink.send({ type: 'emulator-apply-settings', ...options.settings });
        } catch (e) {
            console.warn('Setup apply settings failed', options.settings, e.message);
        }
    }

    // @ts-expect-error
    TrezorUserEnvLink.state = options;

    // after all is done, start bridge again
    await TrezorUserEnvLink.startBridge(
        // @ts-expect-error
        process.env.TESTS_TRANSPORT,
    );
};

export const restartEmu = async (controller: TrezorUserEnvLinkClass) => {
    await controller.stopEmu();
    await new Promise<void>(resolve => {
        const onDeviceDisconnected = () => {
            TrezorConnect.off('device-disconnect', onDeviceDisconnected);
            resolve();
        };
        TrezorConnect.on('device-disconnect', onDeviceDisconnected);
    });
    await controller.startEmu({ ...emulatorStartOpts, wipe: false });
    await new Promise<void>(resolve => {
        const onDeviceConnected = () => {
            TrezorConnect.off('device-connect', onDeviceConnected);
            resolve();
        };
        TrezorConnect.on('device-connect', onDeviceConnected);
    });
};

const DEVICE_HANDSHAKE_TIMEOUT = 30000;

// Connect drops its internal component logs (Core / Device / DeviceCommands / transport) unless
// init gets a createLogger, which is why the failing nightly left no internal trace. Silent Log
// instances keep the last messages of each component in memory; they are dumped only when the
// handshake times out or finishes after init already gave up on it, so a future flake shows which
// step stalled: a device round-trip, a firmware hash/revision check or a data.trezor.io fetch.
// Emulator-only output: test devices and public test seeds, never real user secrets.
const silentCreateLogger = (prefix: string) => initLog(prefix, false);

const flushConnectLog = (reason: string, since: number) => {
    console.error(`Connect handshake timeline (${reason}):`);
    getLog({ since }).forEach(({ timestamp, prefix, level, message }) => {
        console.error(`  +${timestamp - since}ms [${prefix}] ${level}`, ...message);
    });
};

// Resolves once Connect has finished the initial device handshake, whatever its outcome, with
// whether the device connected only after transport-start. Connect queues the events emitted
// during init and delivers them in order right after init resolves, so this ordering is the exact
// signal that DeviceList.waitForDevices gave up (10 s) before the device made it into the list.
const waitForDeviceHandshake = () => {
    const startedAt = Date.now();
    const { promise, resolve, reject } = createDeferred<boolean>();
    const timeout = setTimeout(() => {
        flushConnectLog(`not finished in ${DEVICE_HANDSHAKE_TIMEOUT} ms`, startedAt);
        reject(new Error(`Device handshake not finished in ${DEVICE_HANDSHAKE_TIMEOUT} ms`));
    }, DEVICE_HANDSHAKE_TIMEOUT);
    let transportStarted = false;
    const onTransportStart = () => {
        transportStarted = true;
    };
    const onDeviceConnected = () => resolve(transportStarted);
    const cleanup = () => {
        clearTimeout(timeout);
        TrezorConnect.off('transport-start', onTransportStart);
        TrezorConnect.off('device-connect', onDeviceConnected);
        TrezorConnect.off('device-connect_unacquired', onDeviceConnected);
    };

    TrezorConnect.on('transport-start', onTransportStart);
    TrezorConnect.on('device-connect', onDeviceConnected);
    TrezorConnect.on('device-connect_unacquired', onDeviceConnected);

    return { startedAt, promise: promise.finally(cleanup), cancel: cleanup };
};

type InitParams = Partial<Parameters<typeof TrezorConnect.init>[0]> & {
    autoConfirm?: boolean;
    waitForDevice?: boolean;
};

export const initTrezorConnect = async (
    // eslint-disable-next-line @typescript-eslint/no-shadow
    TrezorUserEnvLink: TrezorUserEnvLinkClass,
    { autoConfirm = true, waitForDevice = false, ...options }: InitParams = {},
) => {
    TrezorConnect.removeAllListeners();

    // todo: keep revision
    TrezorConnect.on('device-connect', device => {
        if (!device.features) {
            throw new Error('Device features not available');
        }
        const { major_version, minor_version, patch_version, internal_model, revision } =
            device.features;
        // eslint-disable-next-line no-console
        console.log('Device connected: ', {
            major_version,
            minor_version,
            patch_version,
            internal_model,
            revision,
        });
    });

    TrezorConnect.on('transport-start', event => {
        // eslint-disable-next-line no-console
        console.log('Transport started: ', event.version);
    });

    TrezorConnect.on(UI_REQUESTS.REQUEST_CONFIRMATION, () => {
        TrezorConnect.uiResponse({
            type: UI_RESPONSE.RECEIVE_CONFIRMATION,
            payload: true,
        });
    });

    if (autoConfirm) {
        TrezorConnect.on(UI_EVENTS.BUTTON_REQUEST, async e => {
            if (e.code === 'ButtonRequest_PinEntry') return;
            if (screenCaptureEnabled) {
                try {
                    const screen = await TrezorUserEnvLink.getScreenContent();
                    capturedScreens.push(
                        typeof screen === 'string' ? screen : JSON.stringify(screen),
                    );
                } catch (err) {
                    // capture failure shouldn't block the press-yes path
                    capturedScreens.push(`<getScreenContent error: ${(err as Error).message}>`);
                }
            }
            TrezorUserEnvLink.send({ type: 'emulator-press-yes' });
        });
    }

    // With pendingTransportEvent, Connect stops waiting for the initial device handshake after
    // 10 s and resolves init anyway, e.g. when the firmware revision check is slow to reach
    // data.trezor.io. A method called before the handshake finishes fails with Device_NotFound.
    // Subscribe before init, because the handshake can finish on either side of it.
    const handshake = waitForDevice ? waitForDeviceHandshake() : undefined;
    // Keep a failed init from leaving the pending wait as an unhandled rejection.
    handshake?.promise.catch(() => {});

    try {
        await TrezorConnect.init({
            manifest: {
                appName: 'Trezor Connect Tests',
                appUrl: 'tests.connect.trezor.io',
                email: 'tests@connect.trezor.io',
            },
            transports: [new BridgeTransport({ id: 'bridge', port: 21328 })],
            debug: true,
            createLogger: silentCreateLogger,
            pendingTransportEvent: true,
            transportReconnect: false,
            thp: {
                appName: 'TrezorConnect',
                hostName: 'tests:e2e',
                knownCredentials: THP_CREDENTIALS_AUTOCONNECT,
                pairingMethods: ['CodeEntry'],
            },
            ...options,
        });
    } catch (error) {
        // Otherwise the handshake timer would still fire and dump a timeline into a later test.
        handshake?.cancel();
        throw error;
    }

    if (handshake) {
        const connectedAfterTransportStart = await handshake.promise;
        // eslint-disable-next-line no-console
        console.log(`Device handshake finished in ${Date.now() - handshake.startedAt} ms`);
        if (connectedAfterTransportStart) {
            // The exact window behind the Device_NotFound flake: transport-start fired with an
            // empty device list and the device made it into the list only afterwards.
            flushConnectLog('device connected after transport-start', handshake.startedAt);
        }
    }
};

// skipping tests rules:
// "1" | "2" - global skip for model
// ">1.9.3" - skip for FW greater than 1.9.3
// "<1.9.3" - skip for FW lower than 1.9.3
// "1.9.3" - skip for FW exact with 1.9.3
// "1.9.3-1.9.6" - skip for FW gte 1.9.3 && lte 1.9.6
// "!T3T1" - skip for specific device model
// "*T3T1" - run only on specific device models
export const skipTest = (rules: string[]) => {
    if (!rules || !Array.isArray(rules)) return;
    if (!firmware) return;
    const fwModel = firmware.substring(0, 1);
    const fwMaster = firmware.includes('-main');
    const deviceRuleNegative = rules.find(skip => skip === '!' + deviceModel);
    if (deviceRuleNegative) return deviceRuleNegative;

    const anyDeviceRulePositive = rules.find(skip => skip.startsWith('*'));
    const deviceRulePositive = rules.find(skip => skip === '*' + deviceModel);
    if (anyDeviceRulePositive && !deviceRulePositive) return anyDeviceRulePositive;

    const rule = rules
        .filter(skip => skip.substring(0, 1) === fwModel || skip.substring(1, 2) === fwModel) // filter rules only for current model
        .find(skip => {
            // global model
            if (!skip.includes('.')) {
                return skip === fwModel;
            }

            // is within range
            if (skip.includes('-')) {
                const [from, to] = skip.split('-');

                return (
                    !fwMaster &&
                    from &&
                    to &&
                    versionUtils.isNewerOrEqual(firmware, from) &&
                    !versionUtils.isNewer(firmware, to)
                );
            }

            // lower
            if (skip.startsWith('<')) {
                return !fwMaster && !versionUtils.isNewerOrEqual(firmware, skip.substring(1));
            }

            // greater
            if (skip.startsWith('>')) {
                return fwMaster || versionUtils.isNewer(firmware, skip.substring(1));
            }

            // exact
            return !fwMaster && versionUtils.isEqual(firmware, skip);
        });

    return rule;
};

export const conditionalTest = (rules: string[], ...args: any) => {
    const testMethod = skipTest(rules) ? it.skip : it;

    // @ts-expect-error
    return testMethod(...args);
};
