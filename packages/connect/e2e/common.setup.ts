import TrezorConnect from '../src';
import { versionUtils } from '@trezor/utils';
import { UI } from '../src/events';
import {
    TrezorUserEnvLink,
    type TrezorUserEnvLinkClass,
    StartEmu,
} from '@trezor/trezor-user-env-link';
import { ApplySettings } from '@trezor/protobuf/src/messages-schema';

const MNEMONICS = {
    mnemonic_all: 'all all all all all all all all all all all all',
    mnemonic_12: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
    mnemonic_abandon:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
};

const emulatorStartOpts =
    (process.env.emulatorStartOpts as StartEmu) || global.emulatorStartOpts || {};

const firmware = emulatorStartOpts.version;
const deviceModel = emulatorStartOpts.model;

if (!firmware || !deviceModel) {
    throw new Error('Firmware and device model must be provided');
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
};
export const setup = async (
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

    if (!options?.mnemonic) return true; // skip setup if test is not using the device (composeTransaction)

    await TrezorUserEnvLink.startEmu(emulatorStartOpts);

    const mnemonic =
        typeof options.mnemonic === 'string' && options.mnemonic.indexOf(' ') > 0
            ? options.mnemonic
            : //   @ts-expect-error
              MNEMONICS[options.mnemonic] || MNEMONICS.mnemonic_all;

    await TrezorUserEnvLink.setupEmu({
        ...options,
        mnemonic,
        pin: options.pin || '',
        passphrase_protection: !!options.passphrase_protection,
        label: options.label || 'TrezorT',
        needs_backup: false,
    });

    if (options.settings) {
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
    await TrezorUserEnvLink.startBridge();
};

export const initTrezorConnect = async (
    TrezorUserEnvLink: TrezorUserEnvLinkClass,
    options?: Partial<Parameters<typeof TrezorConnect.init>[0]>,
) => {
    TrezorConnect.removeAllListeners();

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

    TrezorConnect.on(UI.REQUEST_CONFIRMATION, () => {
        TrezorConnect.uiResponse({
            type: UI.RECEIVE_CONFIRMATION,
            payload: true,
        });
    });

    TrezorConnect.on(UI.REQUEST_BUTTON, () => {
        setTimeout(() => TrezorUserEnvLink.send({ type: 'emulator-press-yes' }), 1);
    });

    await TrezorConnect.init({
        manifest: {
            appUrl: 'tests.connect.trezor.io',
            email: 'tests@connect.trezor.io',
        },
        transports: ['BridgeTransport'],
        debug: false,
        popup: false,
        pendingTransportEvent: true,
        connectSrc: process.env.TREZOR_CONNECT_SRC, // custom source for karma tests
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
export const skipTest = (rules: string[]) => {
    if (!rules || !Array.isArray(rules)) return;
    const fwModel = firmware.substring(0, 1);
    const fwMaster = firmware.includes('-main');
    const deviceRule = rules.find(skip => skip === '!' + deviceModel);
    if (deviceRule) return deviceRule;

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
    const skipMethod = typeof jest !== 'undefined' ? it.skip : xit;
    const testMethod = skipTest(rules) ? skipMethod : it;

    // @ts-expect-error
    return testMethod(...args);
};
