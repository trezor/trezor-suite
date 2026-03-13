// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect from '@trezor/connect';
import { ApplySettings } from '@trezor/protobuf/src/messages-schema';
import {
    EmuStartOptsType,
    MNEMONICS,
    TrezorUserEnvLink,
    type TrezorUserEnvLinkClass,
} from '@trezor/trezor-user-env-link';
import { versionUtils } from '@trezor/utils';

// import TrezorConnect from '../src';
import { UI_REQUEST, UI_RESPONSE } from '../src/events';

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

type InitParams = Partial<Parameters<typeof TrezorConnect.init>[0]> & { autoConfirm?: boolean };

export const initTrezorConnect = async (
    // eslint-disable-next-line @typescript-eslint/no-shadow
    TrezorUserEnvLink: TrezorUserEnvLinkClass,
    { autoConfirm = true, ...options }: InitParams = {},
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

    TrezorConnect.on(UI_REQUEST.REQUEST_CONFIRMATION, () => {
        TrezorConnect.uiResponse({
            type: UI_RESPONSE.RECEIVE_CONFIRMATION,
            payload: true,
        });
    });

    if (autoConfirm) {
        TrezorConnect.on(UI_REQUEST.REQUEST_BUTTON, e => {
            if (e.code === 'ButtonRequest_PinEntry') return;
            setTimeout(() => TrezorUserEnvLink.send({ type: 'emulator-press-yes' }), 1);
        });
    }

    await TrezorConnect.init({
        manifest: {
            appName: 'Trezor Connect Tests',
            appUrl: 'tests.connect.trezor.io',
            email: 'tests@connect.trezor.io',
        },
        transports: ['BridgeTransport'],
        debug: true,
        pendingTransportEvent: true,
        transportReconnect: false,
        coreMode: 'auto', // for connect-web
        thp: {
            appName: 'TrezorConnect',
            hostName: 'tests:e2e',
            knownCredentials: [
                // all all seed credential generated from thpPairing.test
                {
                    host_static_key:
                        '0007070707070707070707070707070707070707070707070707070707070747',
                    trezor_static_public_key:
                        '566f6976fd42cafadf1b843ce4e6275c930d52efac878217df0ea2a23933b07d',
                    credential:
                        '0a1c0a0974657374733a65326510011a0d5472657a6f72436f6e6e65637412203fa725f325ba34cce19e39e6c87f573a9db1a532c28f67a363f0ea8317f64af9',
                    autoconnect: true,
                },
                // credential for newer TENV image
                {
                    host_static_key:
                        '0007070707070707070707070707070707070707070707070707070707070747',
                    trezor_static_public_key:
                        'ca9a6e4682ac461c59d75a8625c05bf3a4af01e084abc5a7fe8ad126c2d6f772',
                    credential:
                        '0a1c0a0974657374733a65326510011a0d5472657a6f72436f6e6e65637412204cd0d3ccab3d615430d218e96d78cd5b89a06783581e5948d8cc532e423bd145',
                    autoconnect: true,
                },
            ],
            pairingMethods: ['CodeEntry'],
        },
        ...options,
    });
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

export const conditionalDescribe = (rules: string[], ...args: any) => {
    const testMethod = skipTest(rules) ? describe.skip : describe;

    // @ts-expect-error
    return testMethod(...args);
};
