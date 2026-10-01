import { type AddressInfo } from 'net';
import { WebSocket, WebSocketServer } from 'ws';

import { createWarddProvider } from './createWarddProvider';
import { WarddClient, WarddError, stripNulls } from './warddClient';

// A SCRIPTED wardd: enough of the relay contract to see what the client sends, and to run a
// conversation whose every deviceCall must be answered before the result arrives.
const startWardd = async () => {
    const received: any[] = [];
    const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    await new Promise(resolve => wss.once('listening', resolve));
    wss.on('connection', socket => {
        const send = (frame: object) => socket.send(JSON.stringify(frame));
        let awaiting: ((reply: any) => void) | undefined;
        const device = (id: number, deviceCall: object) =>
            new Promise<any>(resolve => {
                awaiting = resolve;
                send({ id, deviceCall });
            });
        socket.on('message', async data => {
            const frame = JSON.parse(String(data));
            received.push(frame);
            if (frame.deviceReply) return awaiting?.(frame.deviceReply);
            const { id, method, params } = frame;
            if (method === 'hello') {
                return params.token === 'good'
                    ? send({ id, result: { version: '1.0' } })
                    : send({ id, error: { code: 'unauthorised', message: 'wrong pairing token' } });
            }
            if (method === 'sync') {
                const ack = await device(id, { name: 'WardSync', message: {} });
                const done = await device(id, {
                    name: 'WardReconcile',
                    message: { n: ack.message.n },
                });

                return send({ id, result: { counter: done.message.counter, how: 'reconcile' } });
            }
            if (method === 'refused') {
                return send({ id, error: { code: 'wm_conflict', message: 'moved' } });
            }
            send({ id, result: { method, params } });
        });
    });

    return {
        url: `ws://127.0.0.1:${(wss.address() as AddressInfo).port}`,
        received,
        close: () =>
            new Promise(resolve => {
                for (const client of wss.clients) client.terminate();
                wss.close(resolve);
            }),
    };
};

const ws = WebSocket as unknown as typeof globalThis.WebSocket;

describe('WarddClient', () => {
    let wardd: Awaited<ReturnType<typeof startWardd>>;
    beforeEach(async () => {
        wardd = await startWardd();
    });
    afterEach(() => wardd.close());

    it('says hello with the token, and refuses to proceed on a wrong one', async () => {
        const client = await WarddClient.connect({ url: wardd.url, token: 'good', WebSocket: ws });
        expect(wardd.received[0]).toEqual({
            id: 1,
            method: 'hello',
            params: { version: '1.0', token: 'good' },
        });
        client.close();
        await expect(
            WarddClient.connect({ url: wardd.url, token: 'bad', WebSocket: ws }),
        ).rejects.toThrow('unauthorised');
    });

    it('says plainly when wardd is not running', async () => {
        await expect(
            WarddClient.connect({ url: 'ws://127.0.0.1:1', token: 'good', WebSocket: ws }),
        ).rejects.toThrow('not reachable');
    });

    it('runs a conversation: each deviceCall answered once, in order, then the result', async () => {
        const client = await WarddClient.connect({ url: wardd.url, token: 'good', WebSocket: ws });
        const seen: string[] = [];
        const result = await client.call('sync', {}, ({ name }) => {
            seen.push(name);

            return Promise.resolve(
                name === 'WardSync'
                    ? { name: 'WardSyncAck', message: { n: 7 } }
                    : { name: 'WardReconcileAck', message: { counter: 3 } },
            );
        });
        expect(seen).toEqual(['WardSync', 'WardReconcile']);
        expect(result).toEqual({ counter: 3, how: 'reconcile' });
        client.close();
    });

    it('answers a deviceCall the device could not take with a Failure, never with silence', async () => {
        const client = await WarddClient.connect({ url: wardd.url, token: 'good', WebSocket: ws });
        // wardd decides what a Failure means; the client's part is that every call gets a reply
        await expect(
            client.call('sync', {}, () => Promise.reject(new Error('device gone'))),
        ).resolves.toMatchObject({ how: 'reconcile' });
        expect(wardd.received.filter(f => f.deviceReply)).toEqual([
            { id: 2, deviceReply: { name: 'Failure', message: { message: 'device gone' } } },
            { id: 2, deviceReply: { name: 'Failure', message: { message: 'device gone' } } },
        ]);
        client.close();
    });

    it('fails a pending call when wardd goes away mid-conversation', async () => {
        const client = await WarddClient.connect({ url: wardd.url, token: 'good', WebSocket: ws });
        const pending = client.call('sync', {}, () => new Promise(() => {}));
        await new Promise(resolve => setTimeout(resolve, 50));
        await wardd.close();
        await expect(pending).rejects.toThrow('closed');
    });

    it("keeps wardd's error code", async () => {
        const client = await WarddClient.connect({ url: wardd.url, token: 'good', WebSocket: ws });
        const error = await client.call('refused').catch(e => e);
        expect(error).toBeInstanceOf(WarddError);
        expect(error.code).toBe('wm_conflict');
        client.close();
    });
});

describe('createWarddProvider', () => {
    let wardd: Awaited<ReturnType<typeof startWardd>>;
    beforeEach(async () => {
        wardd = await startWardd();
    });
    afterEach(() => wardd.close());

    it('rebuilds the cumulative staged set a batched flush needs from one pull at a time', async () => {
        const provider = createWarddProvider({ url: wardd.url, token: 'good', WebSocket: ws });
        await provider.serveEntry({ entry_key: 'a1' });
        await provider.serveEntry({ entry_key: 'b2', staged: { entry_key: 'a1', commit: 'c1' } });
        await provider.serveEntry({ entry_key: 'c3', staged: { entry_key: 'b2', commit: 'c2' } });
        // a pull without `staged` is the start of the next conversation
        await provider.serveEntry({ entry_key: 'd4' });
        const staged = wardd.received
            .filter(f => f.method === 'serveEntry')
            .map(f => f.params.staged);
        expect(staged).toEqual([
            [],
            [['a1', 'c1']],
            [
                ['a1', 'c1'],
                ['b2', 'c2'],
            ],
            [],
        ]);
        await provider.dispose?.();
    });

    it('applies a result through wardd, nulls stripped', async () => {
        const provider = createWarddProvider({ url: wardd.url, token: 'good', WebSocket: ws });
        const out = await provider.applyResult({ counter: 1, content: null, auth_commit: 'aa' });
        expect(out).toEqual({ method: 'applyResult', params: { counter: 1, auth_commit: 'aa' } });
        await provider.dispose?.();
    });
});

describe('stripNulls', () => {
    it('drops absent fields at every depth, keeping arrays and falsy values', () => {
        expect(
            stripNulls({ a: null, b: 0, c: { d: undefined, e: '' }, f: [{ g: null, h: false }] }),
        ).toEqual({ b: 0, c: { e: '' }, f: [{ h: false }] });
    });
});
