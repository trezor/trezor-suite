import path from 'path';

import type { EmuStartOptsType, Firmwares } from '@trezor/trezor-user-env-link';
import { Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { typedObjectKeys } from '@trezor/utils';

const firmwareArg = process.env.TESTS_FIRMWARE;
const firmwareUrl = process.env.TESTS_FIRMWARE_URL;
const firmwareModel = process.env.TESTS_FIRMWARE_MODEL as Model;
const firmwareBranch = process.env.TESTS_FIRMWARE_BRANCH;
const firmwareBtcOnly = process.env.TESTS_FIRMWARE_BTC_ONLY === 'true';

/**
 * Translate test command arguments into trezor-user-env options.
 * TODO: this code might be refactored and moved into TrezorUserEnvLink class later
 */
const getEmulatorOptions = (availableFirmwares: Firmwares) => {
    const getLatestFirmware = (model: keyof Firmwares) =>
        availableFirmwares[model].find(fw => {
            const withoutArm = fw.replace('-arm', '');
            const semverVersion = !withoutArm.includes('-'); // there are only 2-main-arm or 2.9.0-arm
            const mainVersion = withoutArm.endsWith('-main');

            return semverVersion || mainVersion; // return named (semver) version, or 'main' version fallback - this happens when new model is created but it has no stable firmware release yet.
        });

    const model =
        firmwareModel && typedObjectKeys(availableFirmwares).includes(firmwareModel)
            ? firmwareModel
            : Model.T2T1;
    const latest = getLatestFirmware(model);

    if (firmwareArg?.endsWith('-latest') && !latest) {
        // should never happen
        throw new Error('could not translate n-latest into specific firmware version');
    }

    let emulatorStartOpts: EmuStartOptsType;

    if (firmwareUrl) {
        emulatorStartOpts = {
            type: 'emulator-start-from-url',
            url: firmwareUrl,
            wipe: true,
            model,
        };
    } else if (firmwareBranch) {
        emulatorStartOpts = {
            type: 'emulator-start-from-branch',
            branch: firmwareBranch,
            btcOnly: firmwareBtcOnly,
            wipe: true,
            model,
        };
    } else {
        let version;
        if (firmwareArg) {
            version = firmwareArg.endsWith('-latest') ? latest : firmwareArg;
        } else {
            version = latest;
        }
        emulatorStartOpts = {
            type: 'emulator-start',
            wipe: true,
            version,
            model,
        };
    }

    if (
        'version' in emulatorStartOpts &&
        emulatorStartOpts.version?.startsWith('1') &&
        emulatorStartOpts.model !== 'T1B1'
    ) {
        throw new Error('firmware version 1.x is only supported for T1B1 model');
    }

    return emulatorStartOpts;
};

(async () => {
    const mode = process.argv[2];
    if (mode !== 'node' && mode !== 'web') {
        throw new Error('no env specified (web or node)');
    }

    // Before actual tests start, establish connection with trezor-user-env
    await TrezorUserEnvLink.connect();

    // Trezor-user-env loads available firmwares upon start allowing us to translate process.env variables
    // into specific firmware versions
    if (!TrezorUserEnvLink.firmwares) {
        throw new Error('firmwares not loaded');
    }
    const emulatorStartOpts = getEmulatorOptions(TrezorUserEnvLink.firmwares);

    // Pass emulator options to tests via environment variable (read by vitest.config.ts define)
    process.env.EMULATOR_START_OPTS = JSON.stringify(emulatorStartOpts);

    // Set the project type for vitest.config.ts to determine browser vs node mode
    process.env.VITEST_PROJECT = mode === 'web' ? 'browser' : 'node';

    // eslint-disable-next-line no-console
    console.log(`Running @trezor/connect e2e tests in ${mode} mode...`);
    // eslint-disable-next-line no-console
    console.log('FW:', process.env.TESTS_FIRMWARE);
    // eslint-disable-next-line no-console
    console.log('Methods:', process.env.TESTS_INCLUDED_METHODS || 'All');
    // eslint-disable-next-line no-console
    console.log('Pattern:', process.env.TESTS_PATTERN || '*');

    const { startVitest } = await import('vitest/node');

    const vitest = await startVitest('test', [], {
        config: path.resolve(__dirname, './vitest.config.ts'),
        watch: false,
        sequence: {
            shuffle: process.env.TESTS_RANDOM === 'true',
        },
    });

    if (!vitest) {
        console.error('Failed to start vitest');
        process.exit(1);
    }

    await vitest.close();

    const files = vitest.state.getFiles();
    const hasFailedTests = files.some(f => f.result?.state === 'fail');
    const hasUnhandledErrors = vitest.state.getUnhandledErrors().length > 0;
    const noTestsRan = files.length === 0 || files.every(f => !f.result);

    if (hasUnhandledErrors) {
        console.error('Vitest encountered unhandled errors');
    }
    if (noTestsRan) {
        console.error('No tests were executed');
    }

    process.exit(hasFailedTests || hasUnhandledErrors || noTestsRan ? 1 : 0);
})();
