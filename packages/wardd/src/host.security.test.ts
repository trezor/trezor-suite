import { InMemoryWardDb } from '@trezor/ward';

import { fakeDevice, WARD_ID } from '../mocks/mockDevice';
import { mockTransition } from '../mocks/mockTransition';
import { Wardd } from './service';
import { MockWm } from './wm';

it('never publishes or finalizes a candidate whose durable transition write failed', async () => {
    const storage = new InMemoryWardDb();
    const wm = new MockWm();
    const publish = jest.spyOn(wm, 'commit');
    storage.appendTransition = () => {
        throw new Error('disk full');
    };
    const endpoint = await new Wardd({ storage, wm }).connect();
    const device = fakeDevice(() => endpoint);

    await expect(
        endpoint.call(
            'update',
            {
                appId: 'btc',
                address: 'bc1qfirst',
                networkSymbol: 'btc',
                metadata: { label: 'first' },
            },
            device.device,
        ),
    ).rejects.toThrow('disk full');
    expect(publish).not.toHaveBeenCalled();
    expect(device.names()).not.toContain('WARDConfirmBatchByWM');
    expect((await wm.current(WARD_ID, 'ab'.repeat(32))).counter).toBe(0);
});

it('does not rewrite stored transitions or expose mutable stored objects', () => {
    const storage = new InMemoryWardDb();
    const signed = mockTransition();
    const transition = { counter: 1, prevRoot: '', targetRoot: signed.root, leaves: [] };
    storage.appendTransition(WARD_ID, transition);
    storage.appendTransition(WARD_ID, transition);
    expect(storage.getTransitions(WARD_ID)).toHaveLength(1);
    expect(() =>
        storage.appendTransition(WARD_ID, { ...transition, prevRoot: 'ff'.repeat(32) }),
    ).toThrow('cannot rewrite');
    storage.getTransitions(WARD_ID)[0]!.prevRoot = 'tampered';
    transition.prevRoot = 'tampered';
    expect(storage.getTransitions(WARD_ID)[0]!.prevRoot).toBe('');
});

it('reads the authoritative head instead of asking the manager to sign a stale local head', async () => {
    const storage = new InMemoryWardDb();
    storage.setTreeState(WARD_ID, { counter: 9, root: 'ff'.repeat(32) });
    const wm = new MockWm();
    const endpoint = await new Wardd({ storage, wm }).connect();
    const device = fakeDevice(() => endpoint);

    await expect(endpoint.call('sync', {}, device.device)).resolves.toMatchObject({
        counter: 0,
        root: '',
    });
    expect(storage.getTreeState(WARD_ID)).toEqual({ counter: 0, root: '' });
});
