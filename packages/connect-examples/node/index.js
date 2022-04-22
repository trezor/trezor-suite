/* eslint-disable import/extensions */

import TrezorConnect from '../../npm-extended';

import { Controller } from '../../tests/websocket-client';

/**
 * This part of code simulates that:
 * - trezor bridge is running
 * - device is connected
 * In typical application you don't need it. User has bridge installed on his system
 * and trezor device connected
 */
const runSetup = async () => {
    const controller = new Controller({
        url: 'ws://localhost:9001/',
    });

    await controller.connect();
    await controller.send({ type: 'emulator-start' });
    await controller.send({ type: 'bridge-start' });
};

/**
 * Example starts here
 */
const runExample = async () => {
    await TrezorConnect.init({
        manifest: {
            appUrl: 'my app',
            email: 'app@myapp.meow',
        },
    });

    const features = await TrezorConnect.getFeatures();

    console.log(features);

    if (!features.success) {
        process.exit(1);
    }
};

// run it all
const run = async () => {
    await runSetup();
    await runExample();

    process.exit(0);
};

run();
