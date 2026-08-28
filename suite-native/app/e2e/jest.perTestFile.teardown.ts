import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const TERMINATE_APP_TIMEOUT = 15_000;
const TREZOR_USER_ENV_TIMEOUT = 15_000;

/**
 * Rejections are swallowed on purpose - a request abandoned here gets rejected later by
 * `TrezorUserEnvLink.terminate()` and an unhandled rejection would kill the Jest process.
 */
const withTimeout = async (label: string, promise: Promise<unknown>, timeoutMs: number) => {
    const guarded = promise.catch(error => {
        console.error(`Error during Detox teardown: ${label} failed.`, error);
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<void>(resolve => {
        timer = setTimeout(() => {
            console.error(`Error during Detox teardown: ${label} timed out after ${timeoutMs} ms.`);
            resolve();
        }, timeoutMs);
        timer.unref?.();
    });

    await Promise.race([guarded, timeout]);
    clearTimeout(timer);
};

// We want to stop trezor at two places:
// 1) afterAll - to cover normal test run teardowns
// 2) beforeEach - to cover cases where previous tests hang and afterAll is not called
const teardown = async () => {
    try {
        await withTimeout('device.terminateApp()', device.terminateApp(), TERMINATE_APP_TIMEOUT);

        if (device.getPlatform() === 'android') {
            await withTimeout('stopEmu()', TrezorUserEnvLink.stopEmu(), TREZOR_USER_ENV_TIMEOUT);
            await withTimeout(
                'stopBridge()',
                TrezorUserEnvLink.stopBridge(),
                TREZOR_USER_ENV_TIMEOUT,
            );
        }
    } finally {
        // Has to run even when the steps above time out. Otherwise the trezor-user-env websocket
        // stays open and its TCP handle keeps Jest from exiting after the last test file.
        TrezorUserEnvLink.terminate();
    }
};

afterAll(teardown);

beforeEach(teardown);
