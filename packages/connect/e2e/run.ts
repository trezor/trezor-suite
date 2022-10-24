import path from 'path';
import { runCLI } from 'jest';
import webpack from 'webpack';
import karma from 'karma';

import { TrezorUserEnvLink, Firmwares } from '@trezor/trezor-user-env-link';

import argv from './jest.config';

const firmwareArg = process.env.TESTS_FIRMWARE;
const firmwareUrl = process.env.TESTS_FIRMWARE_URL;
const firmwareModel = process.env.TESTS_FIRMWARE_MODEL;

/**
 * Translate test command arguments into trezor-user-env options.
 * TODO: this code might be refactored and moved into TrezorUserEnvLink class later
 */
const getEmulatorOptions = (availableFirmwares: Firmwares) => {
    const latest2 = availableFirmwares['2'].find(fw => !fw.includes('-'));
    const latest1 = availableFirmwares['1'].find(fw => !fw.includes('-'));

    if (!latest2 || !latest1) {
        // should never happen
        throw new Error('could not translate n-latest into specific firmware version');
    }

    const emulatorStartOpts = {
        type: 'emulator-start',
        wipe: true,
        version: firmwareArg,
    };

    if (firmwareArg === '2-latest') {
        Object.assign(emulatorStartOpts, { version: latest2 });
    }
    if (firmwareArg === '1-latest') {
        Object.assign(emulatorStartOpts, { version: latest1 });
    }
    // no firmwareArg and not loading from url at the same time - provide fallback
    if (!firmwareArg && !firmwareUrl) {
        Object.assign(emulatorStartOpts, { version: latest2 });
    }
    if (firmwareUrl) {
        Object.assign(emulatorStartOpts, {
            type: 'emulator-start-from-url',
            url: firmwareUrl,
        });
    }

    if (firmwareModel) {
        Object.assign(emulatorStartOpts, { model: firmwareModel });
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
        firmware: emulatorStartOpts.version,
    };

    // @ts-expect-error there is some mismatch between jest implementation and definitely typed package.
    argv.runInBand = true;

    if (process.env.TESTS_PATTERN) {
        // @ts-expect-error
        argv.testMatch = process.env.TESTS_PATTERN.split(' ').map(p => `**/${p}*`);
    }

    if (process.argv[2] === 'node') {
        // @ts-expect-error
        runCLI(argv, [__dirname]);
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
                        // @ts-expect-error
                        'process.env.firmware': JSON.stringify(argv.globals.firmware),
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
                console.log('reject reason', rejectReason);
                process.exit(1);
            },
        );
    } else {
        throw new Error('no env specified (web or node)');
    }
})();
