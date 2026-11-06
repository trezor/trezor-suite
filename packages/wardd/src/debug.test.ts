import { connect } from 'net';

import { InMemoryWardDb } from '@trezor/ward';

import { startDebugServer } from './debug';
import { Wardd } from './service';
import { MockWm, WmConflict, WmUnavailable } from './wm';
import { WARD_ID, fakeDevice } from '../mocks/mockDevice';

const params = {
    appId: 'btc',
    address: 'bc1qoffline',
    networkSymbol: 'btc',
    metadata: { label: 'offline' },
    debugDeviceId: 'device-1',
};

describe('per-device WM connectivity', () => {
    let debug: Awaited<ReturnType<typeof startDebugServer>>;
    let wardd: Wardd;
    let wm: MockWm;

    const control = (
        command: string,
        deviceId = 'device-1',
        token = 'test-token',
    ): Promise<Record<string, unknown>> =>
        new Promise((resolve, reject) => {
            const socket = connect(debug.port, '127.0.0.1');
            let received = '';
            socket.on('error', reject);
            socket.on('connect', () =>
                socket.write(JSON.stringify({ command, deviceId, token }) + '\n'),
            );
            socket.on('data', data => {
                received += data.toString();
            });
            socket.on('end', () => resolve(JSON.parse(received)));
        });

    beforeEach(async () => {
        wm = new MockWm();
        wardd = new Wardd({ storage: new InMemoryWardDb(), wm });
        debug = await startDebugServer({ wardd, token: 'test-token', port: 0 });
    });
    afterEach(async () => {
        await debug.close();
        await wardd.dispose();
    });

    it('authenticates and validates commands without changing connectivity on failure', async () => {
        expect(await control('PAUSE', 'device-1', 'wrong')).toEqual({ error: 'unauthorised' });
        expect(await control('DELETE')).toEqual({ error: 'bad_request' });
        const endpoint = await wardd.connect();
        const device = fakeDevice(() => endpoint);
        await expect(endpoint.call('sync', params, device.device)).resolves.toMatchObject({
            counter: 0,
        });
    });

    it('pauses one device, queues its intent, and leaves the other device online', async () => {
        const offline = await wardd.connect();
        const online = await wardd.connect();
        const first = fakeDevice(() => offline);
        const second = fakeDevice(() => online);
        expect(await control('PAUSE')).toEqual({ deviceId: 'device-1', paused: true });
        const current = jest.spyOn(wm, 'current');
        await expect(offline.call('update', params, first.device)).resolves.toMatchObject({
            queued: true,
            pendingId: 7,
            counter: 0,
        });
        expect(current).not.toHaveBeenCalled();
        expect(first.names()).not.toContain('WARDPerformBatch');
        await expect(
            online.call('sync', { debugDeviceId: 'device-2' }, second.device),
        ).resolves.toMatchObject({ counter: 0 });
        expect(current).toHaveBeenCalledTimes(1);
        expect(await control('CONTINUE')).toEqual({ deviceId: 'device-1', paused: false });
        await expect(offline.call('sync', params, first.device)).resolves.toMatchObject({
            counter: 1,
        });
        expect(await wm.history(WARD_ID)).toHaveLength(1);
        expect(first.names()).not.toContain('WARDDiscardPending');
        await expect(offline.call('sync', params, first.device)).resolves.toMatchObject({
            counter: 1,
        });
        expect(await wm.history(WARD_ID)).toHaveLength(1);
    });

    it('preserves a publication conflict for a later retry instead of discarding user intent', async () => {
        const endpoint = await wardd.connect();
        const first = fakeDevice(() => endpoint);
        const commit = jest.spyOn(wm, 'commit');
        commit.mockRejectedValueOnce(new WmConflict(1));
        await expect(endpoint.call('update', params, first.device)).resolves.toMatchObject({
            conflict: true,
            queued: true,
            pendingId: 7,
        });
        expect(first.names()).not.toContain('WARDDiscardPending');
        await expect(endpoint.call('sync', params, first.device)).resolves.toMatchObject({
            counter: 1,
        });
        expect(await wm.history(WARD_ID)).toHaveLength(1);
    });

    it('allows only one of two independently prepared heads to win publication', async () => {
        const storage = new InMemoryWardDb();
        const endpoints = await Promise.all([
            new Wardd({ storage, wm }).connect(),
            new Wardd({ storage, wm }).connect(),
        ]);
        const devices = endpoints.map(endpoint => fakeDevice(() => endpoint));
        const results = await Promise.all(
            endpoints.map((endpoint, index) =>
                endpoint.call(
                    'update',
                    { ...params, address: `bc1qrace${index}` },
                    devices[index]!.device,
                ),
            ),
        );
        expect(results.filter(result => result.conflict)).toHaveLength(1);
        expect(results.filter(result => result.queued)).toHaveLength(1);
        expect(await wm.history(WARD_ID)).toHaveLength(1);
        const losing = results.findIndex(result => result.conflict);
        expect(devices[losing]!.names()).not.toContain('WARDDiscardPending');
    });
});

it('does not turn a WM validation failure into permission to queue edits', async () => {
    const wm = new MockWm();
    jest.spyOn(wm, 'current').mockRejectedValueOnce(new Error('invalid WM head'));
    const endpoint = await new Wardd({ storage: new InMemoryWardDb(), wm }).connect();
    const device = fakeDevice(() => endpoint);
    await expect(endpoint.call('update', params, device.device)).rejects.toThrow('invalid WM head');
    expect(device.names()).not.toContain('WARDQueueUpdate');
});

it('retains and retries an intent when WM becomes unavailable at publication', async () => {
    const wm = new MockWm();
    const endpoint = await new Wardd({ storage: new InMemoryWardDb(), wm }).connect();
    const device = fakeDevice(() => endpoint);
    jest.spyOn(wm, 'commit').mockRejectedValueOnce(new WmUnavailable());
    await expect(endpoint.call('update', params, device.device)).resolves.toMatchObject({
        queued: true,
        counter: 0,
    });
    expect(await wm.history(WARD_ID)).toHaveLength(0);
    await expect(endpoint.call('sync', params, device.device)).resolves.toMatchObject({
        counter: 1,
    });
    expect(await wm.history(WARD_ID)).toHaveLength(1);
});
