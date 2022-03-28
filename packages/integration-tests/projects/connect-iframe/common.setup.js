/* eslint-disable camelcase, no-bitwise */

import TrezorConnect from 'trezor-connect';
import { versionUtils } from '@trezor/utils';
import releases2 from '@trezor/connect-common/files/firmware/2/releases.json';
import releases1 from '@trezor/connect-common/files/firmware/1/releases.json';

import { Controller } from '../../websocket-client';

const UI = {
    REQUEST_CONFIRMATION: 'ui-request_confirmation',
    RECEIVE_CONFIRMATION: 'ui-receive_confirmation',
    REQUEST_BUTTON: 'ui-button',
};

const MNEMONICS = {
    mnemonic_all: 'all all all all all all all all all all all all',
    mnemonic_12: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
    mnemonic_abandon:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
};

let firmware = process.env.TESTS_FIRMWARE;

if (firmware === '1-latest') {
    firmware = releases1[0].version.join('.');
}
if (firmware === '2-latest') {
    firmware = releases2[0].version.join('.');
}

if (!firmware) {
    // fallback to the latest officially release model T firmware
    firmware = releases2[0].version.join('.');
}

const wait = ms =>
    new Promise(resolve => {
        setTimeout(resolve, ms);
    });

const getController = name => {
    const controller = new Controller({
        url: 'ws://localhost:9001/',
        name: name || 'unnamed controller',
    });
    controller.on('error', error => {
        console.error('Controller WS error', error);
    });
    controller.on('disconnect', () => {
        console.error('Controller WS disconnected');
    });
    controller.state = {};
    return controller;
};

const setup = async (controller, options) => {
    const { state } = controller;
    if (
        state.mnemonic === options.mnemonic &&
        JSON.stringify(state.settings) === JSON.stringify(options.settings)
    )
        return true;

    if (!options.mnemonic) return true; // skip setup if test is not using the device (composeTransaction)

    try {
        await controller.connect();
        // after bridge is stopped, trezor-user-env automatically resolves to use udp transport.
        // this is actually good as we avoid possible race conditions when setting up emulator for
        // the test using the same transport
        await controller.send({ type: 'bridge-stop' });

        const emulatorStartOpts = { type: 'emulator-start', wipe: true };
        if (firmware) {
            Object.assign(emulatorStartOpts, { version: firmware });
        }
        if (options.firmware) {
            Object.assign(emulatorStartOpts, { version: options.firmware });
        }

        await controller.send(emulatorStartOpts);

        const mnemonic =
            typeof options.mnemonic === 'string' && options.mnemonic.indexOf(' ') > 0
                ? options.mnemonic
                : MNEMONICS[options.mnemonic];
        await controller.send({
            type: 'emulator-setup',
            mnemonic,
            pin: options.pin || '',
            passphrase_protection: false,
            label: options.label || 'TrezorT',
            needs_backup: false,
            options,
        });

        if (options.settings) {
            // allow apply-settings to fail, older FW may not know some flags yet
            try {
                await controller.send({ type: 'emulator-apply-settings', ...options.settings });
            } catch (e) {
                console.warn('Setup apply settings failed', options.settings, e.message);
            }
        }

        controller.state = options;

        // after all is done, start bridge again
        await controller.send({ type: 'bridge-start' });
        // Wait to prevent Transport is missing error from TrezorConnect
        await wait(2000);
    } catch (err) {
        // this means that something in trezor-user-env got wrong.
        console.log(err);
        // process.exit(1)
    }
};

const initTrezorConnect = async (controller, options) => {
    TrezorConnect.removeAllListeners();

    TrezorConnect.on('device-connect', device => {
        const { major_version, minor_version, patch_version, revision } = device.features;
        console.log('Device connected: ', {
            major_version,
            minor_version,
            patch_version,
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
        setTimeout(() => controller.send({ type: 'emulator-press-yes' }), 1);
    });

    await TrezorConnect.init({
        manifest: {
            appUrl: 'tests.connect.trezor.io',
            email: 'tests@connect.trezor.io',
        },
        webusb: false,
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
const skipTest = rules => {
    if (!rules || !Array.isArray(rules)) return;
    const fwModel = firmware.substr(0, 1);
    const fwMaster = firmware.includes('-master');
    const rule = rules
        .filter(skip => skip.substr(0, 1) === fwModel || skip.substr(1, 1) === fwModel) // filter rules only for current model
        .find(skip => {
            if (!skip.search('.') && skip === fwModel) {
                // global model
                return true;
            }

            // is within range
            const [from, to] = skip.split('-');
            if (
                !fwMaster &&
                from &&
                to &&
                versionUtils.isNewerOrEqual(firmware, from) &&
                !versionUtils.isNewer(firmware, to)
            ) {
                return true;
            }

            if (
                !fwMaster &&
                skip.startsWith('<') &&
                !versionUtils.isNewerOrEqual(firmware, skip.substr(1))
            ) {
                // lower
                return true;
            }
            if (
                (fwMaster && skip.startsWith('>')) ||
                (!fwMaster &&
                    skip.startsWith('>') &&
                    versionUtils.isNewer(firmware, skip.substr(1)))
            ) {
                // greater
                return true;
            }
            if (!fwMaster && versionUtils.isEqual(firmware, skip)) {
                // exact
                return true;
            }
            return false;
        });
    return rule;
};

const conditionalTest = (rules, ...args) => {
    const skipMethod = typeof jest !== 'undefined' ? it.skip : xit;
    const testMethod = skipTest(rules) ? skipMethod : it;
    return testMethod(...args);
};

global.Trezor = {
    firmware,
    getController,
    setup,
    skipTest,
    conditionalTest,
    initTrezorConnect,
};

// picked from utils/pathUtils
const HD_HARDENED = 0x80000000;
const toHardened = n => (n | HD_HARDENED) >>> 0;

const ADDRESS_N = path => {
    const parts = path.toLowerCase().split('/');
    if (parts[0] !== 'm') throw new Error(`PATH_NOT_VALID: ${path}`);
    return parts
        .filter(p => p !== 'm' && p !== '')
        .map(p => {
            let hardened = false;
            if (p.endsWith("'")) {
                hardened = true;
                p = p.substr(0, p.length - 1);
            }
            let n = parseInt(p, 10);
            if (Number.isNaN(n)) {
                throw new Error(`PATH_NOT_VALID: ${path}`);
            } else if (n < 0) {
                throw new Error(`PATH_NEGATIVE_VALUES: ${path}`);
            }
            if (hardened) {
                // hardened index
                n = toHardened(n);
            }
            return n;
        });
};

global.TestUtils = {
    ...global.TestUtils,
    ADDRESS_N,
};
