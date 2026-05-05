import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const TEARDOWN_TIMEOUT = 30_000;

// We want to stop trezor at two places:
// 1) afterAll - to cover normal test run teardowns
// 2) beforeEach - to cover cases where previous tests hang and afterAll is not called
const stopTrezorUserEnv = async () => {
    if (device.getPlatform() === 'android') {
        await TrezorUserEnvLink.stopEmu();
        await TrezorUserEnvLink.stopBridge();
        await TrezorUserEnvLink.disconnect();
    }
};

const teardownPromises = async () => {
    try {
        await device.terminateApp();
        await stopTrezorUserEnv();
    } catch (error) {
        console.error('Error during Detox global teardown:', error);
    }
};

afterAll(async () => {
    // We don't want timed out global teardown to fail test run.
    let timer: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<void>(resolve => {
        timer = setTimeout(resolve, TEARDOWN_TIMEOUT);
        (timer as any).unref?.();
    });
    await Promise.race([teardownPromises(), timeoutPromise]);
});

beforeEach(async () => {
    await device.terminateApp();
    await stopTrezorUserEnv();
});
