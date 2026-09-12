import http from 'node:http';

import { MNEMONICS, Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const PORT = Number(process.env.USER_ENV_REST_PORT) || 9011;
const HOST = '127.0.0.1';
const BRIDGE_URL = 'http://127.0.0.1:21328';

type JsonObject = Record<string, unknown>;
type Handler = () => Promise<unknown>;

const waitForBridgeReady = async ({ retries = 20, intervalMs = 500 } = {}) => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await fetch(`${BRIDGE_URL}/`, { method: 'POST' });

            if (response.ok) {
                return;
            }
        } catch {
            // The bridge may still be starting.
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Trezor Bridge did not become ready in time.');
};

const waitForDeviceEnumerated = async ({ retries = 60, intervalMs = 1000 } = {}) => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await fetch(`${BRIDGE_URL}/enumerate`, { method: 'POST' });
            const devices: unknown = await response.json();

            if (Array.isArray(devices) && devices.length > 0) {
                return;
            }
        } catch {
            // The emulator may not be visible to the bridge yet.
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('No device became visible to Trezor Bridge.');
};

const cleanupDevice = async () => {
    const errors: unknown[] = [];

    for (const cleanup of [
        () => TrezorUserEnvLink.stopEmu(),
        () => TrezorUserEnvLink.stopBridge(),
        () => TrezorUserEnvLink.disconnect(),
    ]) {
        try {
            await cleanup();
        } catch (error) {
            errors.push(error);
        }
    }

    return { errors: errors.map(String) };
};

const routes: Record<string, Handler> = {
    '/setup-emulator': async () => {
        await TrezorUserEnvLink.connect();
        await TrezorUserEnvLink.logTestDetails('Maestro onboard and connect');
        await TrezorUserEnvLink.startEmu({
            model: Model.T3T1,
            version: '2-latest',
            wipe: true,
        });
        await TrezorUserEnvLink.setupEmu({
            label: 'Safe 5 - Maestro',
            // The "all all all ..." seed has populated accounts, so discovery has
            // balances and history to find once the app connects to the device.
            mnemonic: MNEMONICS.mnemonic_all,
            passphrase_protection: false,
        });
    },
    '/start-bridge': async () => {
        await TrezorUserEnvLink.stopBridge();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await TrezorUserEnvLink.startBridge('node-bridge');
        await waitForBridgeReady();
        await waitForDeviceEnumerated();
    },
    '/cleanup': cleanupDevice,
};

const sendJson = ({
    response,
    statusCode,
    body,
}: {
    response: http.ServerResponse;
    statusCode: number;
    body: JsonObject;
}) => {
    response.writeHead(statusCode, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(body));
};

const server = http.createServer(async (request, response) => {
    const path = (request.url ?? '').split('?')[0];

    if (request.method === 'GET' && path === '/health') {
        sendJson({ response, statusCode: 200, body: { ok: true } });

        return;
    }

    const handler = routes[path];

    if (request.method !== 'POST' || !handler) {
        sendJson({
            response,
            statusCode: 404,
            body: { ok: false, error: `No route for ${request.method} ${path}.` },
        });

        return;
    }

    try {
        const result = await handler();

        // eslint-disable-next-line no-console
        console.log(`[user-env-rest] ${path}`);
        sendJson({ response, statusCode: 200, body: { ok: true, result: result ?? null } });
    } catch (error) {
        console.error(`[user-env-rest] ${path} failed.`, error);
        sendJson({ response, statusCode: 500, body: { ok: false, error: String(error) } });
    }
});

server.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`[user-env-rest] Listening on http://${HOST}:${PORT}.`);
});
