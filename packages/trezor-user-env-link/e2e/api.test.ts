/* eslint-disable no-console */

import { typedObjectKeys } from '@trezor/utils';

import { TrezorUserEnvLink } from '../src';

(async () => {
    await TrezorUserEnvLink.connect();

    if (!TrezorUserEnvLink.firmwares) {
        throw new Error('firmwares not loaded');
    }
    for (const model of typedObjectKeys(TrezorUserEnvLink.firmwares)) {
        console.log('testing firmwares for model', model);

        for (const version of TrezorUserEnvLink.firmwares[model]) {
            console.log('starting emulator', model, version);
            await TrezorUserEnvLink.startEmu({
                model,
                version,
                wipe: true,
            });

            console.log('setting up emulator');
            await TrezorUserEnvLink.setupEmu();

            await TrezorUserEnvLink.allowUnsafePaths();
            // todo: run more complex commands, typically those that require interaction with multiple screens (dry run..)

            console.log('wiping emulator');
            await TrezorUserEnvLink.wipeEmu();

            console.log('stopping emulator');
            await TrezorUserEnvLink.stopEmu();
        }
    }

    await TrezorUserEnvLink.disconnect();

    console.log('ALL TESTS DONE');
})().catch(error => {
    console.error(error);
    process.exit(1);
});
