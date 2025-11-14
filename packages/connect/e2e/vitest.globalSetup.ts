/* eslint-disable no-console */
import type { TestProject } from 'vitest/node';

import {
    EmuStartOptsType,
    Firmwares,
    Model,
    TrezorUserEnvLink,
} from '@trezor/trezor-user-env-link';
import { typedObjectKeys } from '@trezor/utils';

import { CACHE } from './__txcache__';
import { createServer } from './__wscache__';

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

    if (
        'version' in emulatorStartOpts &&
        emulatorStartOpts.version?.startsWith('1') &&
        emulatorStartOpts.model !== 'T1B1'
    ) {
        throw new Error('firmware version 1.x is only supported for T1B1 model');
    }

    return emulatorStartOpts;
};

export async function setup({ provide }: TestProject) {
    const testEnv = process.env.TEST_ENV;
    if (!testEnv || !['node', 'web'].includes(testEnv)) {
        throw new Error('no env specified (web or node)');
    }
    console.log(`Running tests in ${testEnv} environment`);
    console.log('FW:', process.env.TESTS_FIRMWARE ?? 'latest');
    console.log('Methods:', process.env.TESTS_INCLUDED_METHODS ?? 'All');
    console.log('Pattern:', process.env.TESTS_PATTERN ?? '*');

    // Before actual tests start, establish connection with trezor-user-env
    await TrezorUserEnvLink.connect();

    // Trezor-user-env loads available firmwares upon start allowing us to translate process.env variables
    // into specific firmware versions
    if (!TrezorUserEnvLink.firmwares) {
        throw new Error('firmwares not loaded');
    }
    const emulatorStartOpts = getEmulatorOptions(TrezorUserEnvLink.firmwares);
    provide('emulatorStartOpts', emulatorStartOpts);

    provide('txCache', CACHE);

    // Always mock blockchain-link server unless it's explicitly required not to.
    if (process.env.TESTS_USE_WS_CACHE === 'true') {
        const WsCacheServer = await createServer();

        return () => {
            WsCacheServer.close();
        };
    }
}

declare module 'vitest' {
    export interface ProvidedContext {
        emulatorStartOpts: EmuStartOptsType;
        txCache: Record<string, any>;
    }
}
