import path from 'path';
import { runCLI, getVersion as getJestVersion } from 'jest';
import webpack from 'webpack';
import karma from 'karma';

import {
    TrezorUserEnvLink,
    Firmwares,
    Model,
    EmuStartOptsType,
} from '@trezor/trezor-user-env-link';

import argv from './jest.config';

const firmwareArg = process.env.TESTS_FIRMWARE;
const firmwareUrl = process.env.TESTS_FIRMWARE_URL;
const firmwareModel = process.env.TESTS_FIRMWARE_MODEL;
const firmwareBranch = process.env.TESTS_FIRMWARE_BRANCH;
const firmwareBtcOnly = process.env.TESTS_FIRMWARE_BTC_ONLY === 'true';

/**
 * Translate test command arguments into trezor-user-env options.
 * TODO: this code might be refactored and moved into TrezorUserEnvLink class later
 */
const getEmulatorOptions = (availableFirmwares: Firmwares) => {
    const getLatestFirmware = (model: keyof Firmwares) =>
        availableFirmwares[model].find(fw => !fw.replace('-arm', '').includes('-'));

    const model =
        firmwareModel && Object.keys(availableFirmwares).includes(firmwareModel)
            ? (firmwareModel as Model)
            : 'T2T1';
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

    return emulatorStartOpts;
};

(async () => {
    // Before actual tests start, establish connection with trezor-user-env
    await TrezorUserEnvLink.connect();

    // Trezor-user-env loads available firmwares upon start allowing us to translate process.env variables
    // into specific firmware versions
    if (!TrezorUserEnvLink.firmwares) {
        throw new Error('firmwares not loaded');
    }
    const emulatorStartOpts = getEmulatorOptions(TrezorUserEnvLink.firmwares);

    argv.globals = {
        emulatorStartOpts,
    };

    // @ts-expect-error there is some mismatch between jest implementation and definitely typed package.
    argv.runInBand = true;

    if (process.env.TESTS_PATTERN) {
        // @ts-expect-error
        argv.testMatch = process.env.TESTS_PATTERN.split(' ').map(p => `**/${p}*`);
    }

    if (process.argv[2] === 'node') {
        // eslint-disable-next-line no-console
        console.log('jest version: ', getJestVersion());

        if (process.env.TESTS_RANDOM === 'true') {
            // @ts-expect-error
            argv.showSeed = true;
            // @ts-expect-error
            argv.randomize = true;
        }

        // @ts-expect-error
        const { results } = await runCLI(argv, [__dirname]).catch(err => {
            console.error(err);
            process.exit(1);
        });

        process.exit(results.numFailedTestSuites);
    } else if (process.argv[2] === 'web') {
        const { parseConfig } = karma.config;
        const { Server } = karma;

        parseConfig(
            path.join(__dirname, 'karma.config.js'),
            { port: 8099 },
            { promiseConfig: true, throwErrors: true },
        ).then(
            karmaConfig => {
                // @ts-expect-error
                karmaConfig.webpack.plugins.push(
                    new webpack.DefinePlugin({
                        'process.env.emulatorStartOpts': JSON.stringify(
                            // @ts-expect-error
                            argv.globals.emulatorStartOpts,
                        ),
                    }),
                );
                const server = new Server(karmaConfig, exitCode => {
                    process.exit(exitCode);
                });
                server.start();
            },
            rejectReason => {
                // eslint-disable-next-line no-console
                console.log('reject reason', rejectReason);
                process.exit(1);
            },
        );
    } else {
        throw new Error('no env specified (web or node)');
    }
})();
