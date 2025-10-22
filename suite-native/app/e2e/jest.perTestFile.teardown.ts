import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const TEARDOWN_TIMEOUT = 5_000;

const teardownPromises = async () => {
    try {
        await device.terminateApp();
        if (device.getPlatform() === 'android') {
            await TrezorUserEnvLink.stopEmu();
            await TrezorUserEnvLink.stopBridge();
            await TrezorUserEnvLink.disconnect();
        }
    } catch (error) {
        console.error('Error during Detox global teardown:', error);
    }
};

afterAll(async () => {
    // We don't want timed out global teardown to fail test run.
    await Promise.race([
        teardownPromises(),
        new Promise<void>(resolve => setTimeout(resolve, TEARDOWN_TIMEOUT)),
    ]);
});
