import { APIRequestContext, expect } from '@playwright/test';

export const BRIDGE_VERSION = 'node-bridge';

export const BRIDGE_URL = 'http://127.0.0.1:21328';
const BRIDGE_STATUS_URL = `${BRIDGE_URL}/status/`;
const HEADERS = {
    Origin: 'https://wallet.trezor.io',
};
export const expectBridgeToBeRunning = async (request: APIRequestContext) => {
    const bridgeResponse = await request.get(BRIDGE_STATUS_URL, {
        headers: HEADERS,
    });
    await expect(bridgeResponse, 'expect bridge GET response to be OK = is running').toBeOK();
};

export const expectBridgeToBeStopped = async (request: APIRequestContext) => {
    await expect(async () => {
        await request.get(BRIDGE_STATUS_URL, {
            headers: HEADERS,
        });
    }, 'expect bridge GET request to be rejected = is stopped').rejects.toThrow();
};

// We wait for `@welcome-layout/body` or `@dashboard/graph` since
// one or the other will be display depending on the state of the app
// due to previously run tests. And both means the same for the porpoise of this test.
// Bridge should be ready to check `/status` endpoint.
export const waitForAppToBeInitialized = async (suite: any) =>
    await Promise.race([
        // eslint-disable-next-line playwright/missing-playwright-await
        expect(suite.window.getByTestId('@welcome-layout/body')).toBeVisible({ timeout: 30_000 }),
        // eslint-disable-next-line playwright/missing-playwright-await
        expect(suite.window.getByTestId('@dashboard/graph')).toBeVisible({ timeout: 30_000 }),
    ]);
