import http from 'node:http';

import { MNEMONICS, Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

// HTTP -> WebSocket shim so Maestro flows can drive trezor-user-env.
// Maestro's evalScript sandbox can do http.post but cannot open a WebSocket,
// which is why this exists. It mirrors the TrezorUserEnvLink calls that the
// Detox harness makes in suite-native/app/e2e/support/setup.ts.

const PORT = Number(process.env.USER_ENV_REST_PORT) || 9011;
const BRIDGE_URL = 'http://127.0.0.1:21328';

const waitForBridgeReady = async ({ retries = 20, intervalMs = 500 } = {}) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(`${BRIDGE_URL}/`, { method: 'POST' });
            if (response.ok) return;
        } catch {
            // bridge not ready yet
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    throw new Error('Trezor bridge did not become ready in time');
};

const waitForDeviceEnumerated = async ({ retries = 60, intervalMs = 1000 } = {}) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(`${BRIDGE_URL}/enumerate`, { method: 'POST' });
            const devices = await response.json();
            if (Array.isArray(devices) && devices.length > 0) return;
        } catch {
            // bridge not ready yet
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    throw new Error('No device visible to Trezor bridge after enumerate polling');
};

type Handler = (body: any) => Promise<unknown>;

const routes: Record<string, Handler> = {
    '/connect': () => TrezorUserEnvLink.connect(),
    '/log': body => TrezorUserEnvLink.logTestDetails(body.text ?? ''),
    '/start-emu': body =>
        TrezorUserEnvLink.startEmu({
            model: (body.model as Model) ?? Model.T3T1,
            version: body.version,
            wipe: body.wipe ?? true,
        }),
    '/setup-emu': body =>
        TrezorUserEnvLink.setupEmu({
            // label must be set — user-env throws KeyError('label') without it.
            label: body.label ?? 'Safe 5 - Tester',
            // accepts a raw mnemonic or a MNEMONICS key; setupEmu resolves keys itself
            mnemonic: body.mnemonic ?? MNEMONICS.mnemonic_immune,
            passphrase_protection: body.passphrase_protection ?? false,
        }),
    '/start-bridge': async body => {
        // Guarantee a single clean bridge: boot-time auto-starts and extra dashboard/noVNC
        // WS clients can leave duplicate node-bridge processes fighting over 21328, which
        // makes /enumerate hang or return []. Stop any existing bridge, then start one.
        await TrezorUserEnvLink.stopBridge();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await TrezorUserEnvLink.startBridge(body.version ?? 'node-bridge');
        await waitForBridgeReady();
        await waitForDeviceEnumerated();

        return null;
    },
    '/stop-emu': () => TrezorUserEnvLink.stopEmu(),
    '/stop-bridge': () => TrezorUserEnvLink.stopBridge(),
    '/disconnect': () => TrezorUserEnvLink.disconnect(),
    // Device interactions (used by passphrase / confirmation flows).
    '/press-yes': () => TrezorUserEnvLink.pressYes(),
    '/press-no': () => TrezorUserEnvLink.pressNo(),
    '/swipe': body => TrezorUserEnvLink.swipeEmu(body.direction ?? 'up'),
    '/input': body => TrezorUserEnvLink.inputEmu(body.value ?? ''),
    // Read the current device screen text (debuglink) — for logging/diagnostics.
    '/screen': () => TrezorUserEnvLink.getScreenContent(),
    // Confirm the passphrase on the device, handling repeated prompts. The app
    // can request the passphrase more than once (entry, then a verification /
    // derivation pass) while its own UI stays on the loading screen, so we poll
    // the device screen and confirm every passphrase prompt until it clears.
    '/confirm-passphrase': async () => {
        const screens: string[] = [];
        let confirms = 0;
        for (let i = 0; i < 30; i++) {
            const content: any = await TrezorUserEnvLink.getScreenContent();
            const screen = String(content?.body ?? '');
            screens.push(screen.replace(/\s+/g, ' ').trim().slice(0, 80));

            if (/passphrase/i.test(screen)) {
                // Safe 5: scroll to reveal the value, then confirm.
                await TrezorUserEnvLink.swipeEmu('up');
                await TrezorUserEnvLink.swipeEmu('up');
                await TrezorUserEnvLink.pressYes();
                confirms += 1;
            } else if (confirms > 0) {
                // Device left the passphrase prompt after at least one confirm.
                return { confirms, screens };
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return { confirms, screens };
    },
    // Escape hatch for flows that need WS messages not yet wrapped above
    // (e.g. press-yes, input, swipe). Body: { type: 'emulator-press-yes', ... }.
    '/raw': body => TrezorUserEnvLink.send(body),
};

const readBody = (req: http.IncomingMessage): Promise<any> =>
    new Promise(resolve => {
        const chunks: Buffer[] = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            if (!raw) {
                resolve({});

                return;
            }
            try {
                resolve(JSON.parse(raw));
            } catch {
                resolve({});
            }
        });
    });

const server = http.createServer(async (req, res) => {
    const path = (req.url ?? '').split('?')[0];
    const handler = routes[path];

    if (req.method !== 'POST' || !handler) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `No route for ${req.method} ${path}` }));

        return;
    }

    try {
        const body = await readBody(req);
        const result = await handler(body);
        // Narrate each call so the shim terminal shows the device flow. /screen
        // includes the rendered device text so we can see which prompt is up.
        const detail = path === '/screen' ? `: ${JSON.stringify(result)}` : '';
        console.log(`[user-env-rest] ${path}${detail}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, result: result ?? null }));
    } catch (error) {
        console.error(`[user-env-rest] ${path} failed`, error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(error) }));
    }
});

server.listen(PORT, '127.0.0.1', () => {
    // eslint-disable-next-line no-console
    console.log(`[user-env-rest] listening on http://127.0.0.1:${PORT}`);
});
