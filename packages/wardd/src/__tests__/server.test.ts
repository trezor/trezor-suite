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
    device?: FakeDevice,
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
        expect(await call(ws, 1, 'hello', { version: '2.0', token: TOKEN })).toMatchObject({
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
});
