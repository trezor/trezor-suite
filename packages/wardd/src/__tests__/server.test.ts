/**
 * The relay over a real socket: the two gates (origin, token), and a whole conversation relayed by
 * a client loop shaped like the one every binding implements.
 */
import { WebSocket } from 'ws';

import { RELAY_PROTOCOL_VERSION, type WarddFrame, toHex } from '@trezor/ward-core';

import { startServer } from '../server';
import { Wardd } from '../service';
import { FakeDevice } from './fakeDevice';

const TOKEN = 'test-token';

const open = async (port: number, origin?: string) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`, origin ? { origin } : {});
    await new Promise((resolve, reject) => {
        ws.once('open', resolve);
        ws.once('error', reject);
    });

    return ws;
};

/** A binding's conversation loop: answer every deviceCall from `device`, return the outcome. */
const call = (
    ws: WebSocket,
    id: number,
    method: string,
    params: object = {},
    device?: Pick<FakeDevice, 'call'>,
): Promise<WarddFrame> =>
    new Promise(resolve => {
        const onMessage = async (data: unknown) => {
            const frame = JSON.parse(String(data)) as WarddFrame;
            if (frame.id !== id) return;
            if ('deviceCall' in frame) {
                ws.send(JSON.stringify({ id, deviceReply: await device!.call(frame.deviceCall) }));

                return;
            }
            ws.off('message', onMessage);
            resolve(frame);
        };
        ws.on('message', onMessage);
        ws.send(JSON.stringify({ id, method, params }));
    });

describe('the wardd socket', () => {
    let server: Awaited<ReturnType<typeof startServer>>;

    beforeAll(async () => {
        const wardd = await Wardd.create({ dataDir: null, memory: true });
        server = await startServer({
            wardd,
            token: TOKEN,
            port: 0,
            allowedOrigins: ['https://suite.trezor.io'],
        });
    });
    afterAll(() => server.close());

    it('refuses a page from an origin not on the allow-list', async () => {
        await expect(open(server.port, 'https://evil.example')).rejects.toThrow('401');
    });

    it('admits an allowed origin, and a client that sends none', async () => {
        (await open(server.port, 'https://suite.trezor.io')).close();
        (await open(server.port)).close();
    });

    it('refuses everything before hello, and closes on a wrong token', async () => {
        const ws = await open(server.port);
        expect(await call(ws, 1, 'status')).toMatchObject({ error: { code: 'unauthorised' } });
        const closed = new Promise(resolve => ws.once('close', resolve));
        expect(
            await call(ws, 2, 'hello', { version: RELAY_PROTOCOL_VERSION, token: 'nope' }),
        ).toMatchObject({ error: { code: 'unauthorised' } });
        await closed;
    });

    it('refuses another major version', async () => {
        const ws = await open(server.port);
        expect(await call(ws, 1, 'hello', { version: '1.0', token: TOKEN })).toMatchObject({
            error: { code: 'version_mismatch' },
        });
        ws.close();
    });

    it('wants a store before a wallet call', async () => {
        const ws = await open(server.port);
        await call(ws, 1, 'hello', { version: RELAY_PROTOCOL_VERSION, token: TOKEN });
        expect(await call(ws, 2, 'status')).toMatchObject({ error: { code: 'no_store' } });
        ws.close();
    });

    it('accepts a WARD owner credential and rejects the legacy parent field', async () => {
        const ws = await open(server.port);
        const wardId = toHex(new FakeDevice().wardId);
        await call(ws, 1, 'hello', { version: RELAY_PROTOCOL_VERSION, token: TOKEN });
        expect(
            await call(ws, 2, 'openStore', { wardId, evoluNode: '00'.repeat(64) }),
        ).toMatchObject({
            error: { code: 'bad_request' },
        });
        expect(
            await call(ws, 3, 'openStore', { wardId, wardOwnerSecret: '00'.repeat(32) }),
        ).toMatchObject({
            result: { counter: 0 },
        });
        ws.close();
    });

    it('relays a whole flush, pulls included, through the client', async () => {
        const device = new FakeDevice();
        const ws = await open(server.port);
        expect(
            await call(ws, 1, 'hello', { version: RELAY_PROTOCOL_VERSION, token: TOKEN }),
        ).toMatchObject({ result: { version: RELAY_PROTOCOL_VERSION } });
        await call(ws, 2, 'openStore', { wardId: toHex(device.wardId) });
        device.enqueue('alice', 'bc1q-alice');
        device.enqueue('bob', 'bc1q-bob');
        expect(await call(ws, 3, 'flush', { maxBatch: 8 }, device)).toMatchObject({
            result: { counter: 2, published: 1, remaining: 0, root: toHex(device.head.root) },
        });
        expect(await call(ws, 4, 'status')).toMatchObject({
            result: { counter: 2, wmCounter: 2 },
        });
        ws.close();
    });

    it('refuses the ADVERSARIAL TEST methods unless started with --adversarial-tests', async () => {
        const device = new FakeDevice();
        const ws = await open(server.port);
        await call(ws, 1, 'hello', { version: RELAY_PROTOCOL_VERSION, token: TOKEN });
        await call(ws, 2, 'openStore', { wardId: toHex(device.wardId) });
        for (const method of ['adversarialCatchUpToOlderHead', 'adversarialServeEntry']) {
            expect(await call(ws, 3, method, { counter: 0 }, device)).toMatchObject({
                error: {
                    code: 'bad_request',
                    message: expect.stringContaining('--adversarial-tests'),
                },
            });
        }
        ws.close();
    });
});

describe('a wardd with --adversarial-tests', () => {
    it('serves an older state on request, and the device refuses it', async () => {
        const wardd = await Wardd.create({ dataDir: null, memory: true });
        const server = await startServer({ wardd, token: TOKEN, port: 0, adversarialTests: true });
        try {
            const device = new FakeDevice();
            const ws = await open(server.port);
            await call(ws, 1, 'hello', { version: RELAY_PROTOCOL_VERSION, token: TOKEN });
            await call(ws, 2, 'openStore', { wardId: toHex(device.wardId) });
            device.enqueue('alice', 'v1');
            device.enqueue('bob', 'v2');
            await call(ws, 3, 'flush', {}, device);
            const head = toHex(device.head.root);

            // a pull answered from the tree at #1: a proof against another root than the head's
            const current = await call(ws, 4, 'serveEntry', {
                request: { entry_key: toHex(device.queue[0]?.entryKey ?? new Uint8Array(32)) },
            });
            const older = await call(ws, 5, 'adversarialServeEntry', {
                request: { entry_key: toHex(new Uint8Array(32)) },
                counter: 1,
            });
            expect('result' in older).toBe(true);
            expect(older).not.toEqual(current);

            // an older head offered to catch up to: the device refuses
            expect(
                await call(ws, 6, 'adversarialCatchUpToOlderHead', { counter: 1 }, device),
            ).toMatchObject({ error: { code: 'device_failure' } });
            expect(toHex(device.head.root)).toBe(head);
            ws.close();
        } finally {
            await server.close();
        }
    });
});

it('releases the wallet after a device reply deadline and lets another client finish', async () => {
    const wardd = await Wardd.create({ dataDir: null, memory: true });
    const server = await startServer({ wardd, token: TOKEN, port: 0, deviceReplyTimeoutMs: 250 });
    try {
        const device = new FakeDevice();
        const stalled = await open(server.port);
        const ready = await open(server.port);
        for (const ws of [stalled, ready]) {
            await call(ws, 1, 'hello', { version: RELAY_PROTOCOL_VERSION, token: TOKEN });
            await call(ws, 2, 'openStore', { wardId: toHex(device.wardId) });
        }

        let called = () => {};
        const started = new Promise<void>(resolve => (called = resolve));
        const closed = new Promise(resolve => stalled.once('close', resolve));
        const interrupted = call(
            stalled,
            3,
            'sync',
            {},
            {
                call: () => {
                    called();

                    return new Promise(() => {});
                },
            },
        );
        await started;
        device.enqueue('alice', 'bc1q-alice');
        const next = call(ready, 3, 'flush', {}, device);
        await expect(interrupted).resolves.toMatchObject({
            error: { code: 'device_failure', message: expect.stringContaining('timed out') },
        });
        await closed;
        await expect(next).resolves.toMatchObject({ result: { counter: 1, published: 1 } });
    } finally {
        await server.close();
    }
});
