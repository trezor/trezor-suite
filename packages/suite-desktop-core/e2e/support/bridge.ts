import { APIRequestContext, expect } from '@playwright/test';

export const BRIDGE_URL = 'http://127.0.0.1:21325/';
const BRIDGE_STATUS_URL = `${BRIDGE_URL}/status/`;

export const expectBridgeToBeRunning = async (request: APIRequestContext) => {
    const bridgeResponse = await request.get(BRIDGE_STATUS_URL);
    await expect(bridgeResponse).toBeOK();
};

export const expectBridgeToBeStopped = async (request: APIRequestContext) => {
    await expect(async () => {
        await request.get(BRIDGE_STATUS_URL);
    }).rejects.toThrow('ECONNREFUSED');
};

// We wait for `@welcome/title` or `@dashboard/graph` since
// one or the other will be display depending on the state of the app
// due to previously run tests. And both means the same for the porpoise of this test.
// Bridge should be ready to check `/status` endpoint.
export const waitForAppToBeInitialized = async (suite: any) =>
    await Promise.race([
        expect(suite.window.getByTestId('@welcome/title')).toBeVisible(),
        expect(suite.window.getByTestId('@dashboard/graph')).toBeVisible(),
    ]);
