import { InMemoryWardDb, type RelayDevice } from '@trezor/ward';

import { WardHost, type WardHostDeps } from './host';
import { Wardd } from './service';
import { MockWm } from './wm';
import { fakeDevice } from '../mocks/mockDevice';

it('publishes a device candidate through the independent service endpoint', async () => {
    const storage = new InMemoryWardDb();
    const wm = new MockWm();
    const endpoint = await new Wardd({ storage, wm }).connect();
    const native = fakeDevice(() => endpoint);
    const initial = await native.device({ name: 'WARDSync', message: {} });

    await endpoint.call('serviceSync', { initialAck: initial.message }, native.device);
    const queued = await native.device({
        name: 'WARDQueueUpdate',
        message: {
            address: Buffer.from('service-address').toString('hex'),
            new_value: '76616c7565',
        },
    });
    const candidate = await native.device({
        name: 'WARDPerformBatch',
        message: { pending_ids: [queued.message.pending_id] },
    });
    const result = await endpoint.call(
        'servicePublish',
        { candidate: candidate.message, kind: 'commit' },
        native.device,
    );

    expect(result.counter).toBe(1);
    expect((await endpoint.call('status')).counter).toBe(1);
});

it('does not deadlock when a wallet call waits for the same daemon over the service interface', async () => {
    const wardd = new Wardd({ storage: new InMemoryWardDb(), wm: new MockWm() });
    const backend = await wardd.connect();
    const wallet = await wardd.connect();
    const native = fakeDevice(() => backend);
    const walletDevice: RelayDevice = async request => {
        if (request.name === 'WARDSync') {
            const reply = await native.device(request);

            return { ...reply, message: { ...reply.message, service_bound: true } };
        }
        if (request.name === 'WARDServiceSync') {
            const initial = await native.device({ name: 'WARDSync', message: {} });
            const head = await backend.call(
                'serviceSync',
                { initialAck: initial.message },
                native.device,
            );

            return {
                name: 'WARDServiceSyncAck',
                message: {
                    used_service: true,
                    ward_id: head.wardId,
                    counter: head.counter,
                    root: head.root,
                },
            };
        }
        const reply = await native.device(request);
        if (request.name === 'WARDPerformBatch') {
            await backend.call(
                'servicePublish',
                { candidate: reply.message, kind: 'commit' },
                native.device,
            );

            return { ...reply, message: { ...reply.message, leaves: [], service_applied: true } };
        }

        return reply;
    };

    const result = await wallet.call(
        'update',
        {
            appId: 'btc',
            address: 'service-address',
            networkSymbol: 'btc',
            metadata: { label: 'value' },
        },
        walletDevice,
    );

    expect(result.counter).toBe(1);
    expect(result.queued).not.toBe(true);
});

it('reports the device service head without requiring a wallet-side replica', async () => {
    const deps: WardHostDeps = {
        storage: new InMemoryWardDb(),
        wm: new MockWm(),
        log: () => {},
    };
    const host = new WardHost(deps);
    const wardId = 'ab'.repeat(32);
    const device: RelayDevice = request =>
        Promise.resolve(
            request.name === 'WARDSync'
                ? { name: 'WARDSyncAck', message: { ward_id: wardId, service_bound: true } }
                : {
                      name: 'WARDServiceSyncAck',
                      message: {
                          used_service: true,
                          ward_id: wardId,
                          counter: 7,
                          root: 'cd'.repeat(32),
                      },
                  },
        );

    await host.sync(device);

    expect((await host.status()).counter).toBe(7);
});
