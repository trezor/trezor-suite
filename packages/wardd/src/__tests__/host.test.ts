/**
 * Every wardd conversation against the fake device: genesis, flush (single and batched), catch-up
 * along the chain, a fork that needs the user's rejoin, a lost compare-and-swap, and the replica
 * refusing a corrupt row.
 */
import { type DevWm, serveEntry, toBytes, toHex } from '@trezor/ward-core';

import { InMemoryWardBackend, type StoredLink } from '../backend';
import { WardHost } from '../host';
import { materialize } from '../replica';
import { Wardd } from '../service';
import { FakeDevice, newWallet } from './fakeDevice';

const setup = async () => {
    const wardd = await Wardd.create({ dataDir: null, memory: true });
    const keys = newWallet();
    const a = new FakeDevice(keys);
    const host = await wardd.openStore({ wardId: toHex(a.wardId) });

    return { wardd, keys, a, host, wm: wardd.wm as DevWm };
};

const headOf = async (host: WardHost) => {
    const s = await host.status();

    return { counter: s.counter, root: s.root };
};

describe('wardd conversations', () => {
    it('enrols the wallet at genesis and brings the device online', async () => {
        const { a, host, wm } = await setup();
        await expect(host.sync(a.call)).resolves.toMatchObject({ counter: 0, how: 'reconcile' });
        expect(a.online).toBe(true);
        expect(await wm.head(a.wardId)).toEqual({ counter: 0, root: null });
    });

    it('flushes one change per transition, and the device ends where the replica does', async () => {
        const { a, host, wm } = await setup();
        a.enqueue('alice', 'bc1q-alice');
        a.enqueue('bob', 'bc1q-bob');
        const r = await host.flush(a.call);
        expect(r).toMatchObject({ counter: 2, published: 2, remaining: 0 });
        expect(a.queue).toHaveLength(0);
        expect(a.head.counter).toBe(2);
        expect(r.root).toBe(toHex(a.head.root));
        expect((await wm.head(a.wardId))!.counter).toBe(2);
        expect((await host.replica()).trie.size).toBe(2);
    });

    it('reconciles a device already at the head above genesis, whose root it is not told', async () => {
        // the firmware names its root only at counter 0; a host that read the absent root as the
        // empty tree mistook the head for another branch and walked the chain instead
        const { a, host } = await setup();
        a.enqueue('alice', 'v1');
        a.enqueue('bob', 'v1');
        await host.flush(a.call);
        await expect(host.sync(a.call)).resolves.toMatchObject({ counter: 2, how: 'reconcile' });
    });

    it('updates and deletes through the same path', async () => {
        const { a, host } = await setup();
        a.enqueue('alice', 'v1');
        a.enqueue('bob', 'v1');
        await host.flush(a.call);
        a.enqueue('alice', 'v2');
        a.enqueue('bob', null);
        const r = await host.flush(a.call);
        expect(r).toMatchObject({ counter: 4, published: 2 });
        expect((await host.replica()).trie.size).toBe(1);
        expect(r.root).toBe(toHex(a.head.root));
    });

    it('folds a batch into ONE transition, stored as one link', async () => {
        const { a, host } = await setup();
        for (const name of ['a', 'b', 'c']) a.enqueue(name, `addr-${name}`);
        const r = await host.flush(a.call, { maxBatch: 8 });
        expect(r).toMatchObject({ counter: 3, published: 1, remaining: 0 });
        const { trie } = await host.replica();
        expect(trie.size).toBe(3);
        expect(trie.links).toHaveLength(1);
        expect(trie.links[0]).toMatchObject({ fromCounter: 0, toCounter: 3 });
    });

    it('brings a second device several steps behind up along the chain', async () => {
        const { keys, a, host } = await setup();
        for (const name of ['a', 'b', 'c']) a.enqueue(name, name);
        await host.flush(a.call);
        const b = new FakeDevice(keys);
        await expect(host.sync(b.call)).resolves.toMatchObject({ counter: 3, how: 'verifyChain' });
        expect(b.head).toEqual(a.head);
    });

    it('refuses to rejoin a forked device unless asked, then discards its branch', async () => {
        const { keys, a, host, wm } = await setup();
        const b = new FakeDevice(keys);
        a.enqueue('shared', '1');
        await host.flush(a.call);
        await host.sync(b.call);
        const atOne = wm.snapshot();
        // b writes counter 2 -- and then the WM's register is restored below it...
        b.enqueue('b-only', 'x');
        await host.flush(b.call);
        wm.restore(atOne);
        // ...and a writes a different counter 2 on top of the restored register
        a.enqueue('a-only', 'y');
        await host.flush(a.call);

        await expect(host.sync(b.call)).rejects.toMatchObject({ code: 'needs_rejoin' });
        await expect(host.sync(b.call, { rejoin: true })).resolves.toMatchObject({
            how: 'rejoin',
            counter: 2,
            discarded: 1,
        });
        expect(b.head).toEqual(a.head);
    });

    it('refuses a result minted on a head that has since moved, and stores nothing of it', async () => {
        const { keys, a, host } = await setup();
        const b = new FakeDevice(keys);
        await host.sync(a.call);
        await host.sync(b.call);
        // b mints a change against counter 0 but has not published it...
        b.enqueue('loser', 'b');
        let reply = await b.call({ name: 'WardFlushQueue', message: {} });
        while (reply.name === 'WardEntryRequest') {
            reply = await b.call({
                name: 'WardEntryAck',
                message: (await host.serveEntry(reply.message as never)) as never,
            });
        }
        // ...while a publishes first
        a.enqueue('winner', 'a');
        await host.flush(a.call);
        await expect(host.applyResult(reply.message as never)).rejects.toMatchObject({
            code: 'wm_conflict',
        });
        expect(await headOf(host)).toEqual({ counter: 1, root: toHex(a.head.root) });
        expect((await host.replica()).trie.links).toHaveLength(1);
        // b catches up onto the winner, and its change is still queued to be re-derived
        await expect(host.flush(b.call)).resolves.toMatchObject({ counter: 2, published: 1 });
    });

    it('refuses a result at the right counter but minted over a different root', async () => {
        const { keys, a, host, wm } = await setup();
        const b = new FakeDevice(keys);
        a.enqueue('base', '1');
        await host.flush(a.call);
        await host.sync(b.call);
        const atOne = wm.snapshot();
        b.enqueue('b-two', 'b');
        await host.flush(b.call); // b's branch: counter 2, root 2b
        wm.restore(atOne);
        a.enqueue('a-two', 'a');
        await host.flush(a.call); // the head is now a's 2a
        // b mints 2b -> 3, served from ITS branch, as a host still holding it would
        const { backend } = host as unknown as { backend: InMemoryWardBackend };
        const branch = materialize(await backend.load(), { counter: 2, root: b.head.root }).trie;
        b.enqueue('b-three', 'b');
        let reply = await b.call({ name: 'WardFlushQueue', message: {} });
        while (reply.name === 'WardEntryRequest') {
            reply = await b.call({
                name: 'WardEntryAck',
                message: serveEntry(branch, reply.message as never) as never,
            });
        }
        const before = (await backend.load()).length;
        // counter 3 follows on from the head's 2 -- but not from the head b built it on
        await expect(host.applyResult(reply.message as never)).rejects.toMatchObject({
            code: 'wm_conflict',
        });
        expect(await backend.load()).toHaveLength(before);
    });

    it('refuses a sync from a device on another wallet', async () => {
        const { host } = await setup();
        const stranger = new FakeDevice();
        await expect(host.sync(stranger.call)).rejects.toMatchObject({ code: 'bad_request' });
    });

    it('turns a device refusal into device_failure', async () => {
        const { a, host } = await setup();
        await host.sync(a.call);
        const refusing = (m: { name: string }) =>
            m.name === 'WardReconcile'
                ? Promise.resolve({ name: 'Failure', message: { message: 'no' } })
                : a.call(m as never);
        await expect(host.sync(refusing)).rejects.toMatchObject({ code: 'device_failure' });
    });
});

describe('a failed append', () => {
    it('publishes nothing and releases the wallet', async () => {
        const wardd = await Wardd.create({ dataDir: null, memory: true });
        const a = new FakeDevice();
        const failing = new InMemoryWardBackend();
        let fail = true;
        const append = failing.append.bind(failing);
        failing.append = link =>
            fail ? Promise.reject(new Error('the write failed')) : append(link);
        const host = new WardHost(a.wardId, failing, wardd.wm);
        a.enqueue('alice', '1');
        await expect(host.flush(a.call)).rejects.toThrow('the write failed');
        // THE WM DID NOT MOVE: nothing is published that was not stored
        expect(await wardd.wm.head(a.wardId)).toEqual({ counter: 0, root: null });
        // AND THE LOCK IS FREE: the next call runs rather than waiting on the failed one
        await expect(host.status()).resolves.toMatchObject({ counter: 0, wmCounter: 0 });
        // once writes work again, the change -- still queued on the device -- goes through
        fail = false;
        await expect(host.flush(a.call)).resolves.toMatchObject({ counter: 1, published: 1 });
    });
});

describe('the replica', () => {
    it('refuses a stored link that does not reproduce its own root', async () => {
        const { a, host } = await setup();
        a.enqueue('x', '1');
        await host.flush(a.call);
        const links = await (host as unknown as { backend: InMemoryWardBackend }).backend.load();
        const forged: StoredLink = {
            ...links[0]!,
            changes: [{ ...links[0]!.changes[0]!, entryKey: toHex(new Uint8Array(32).fill(9)) }],
        };
        expect(() => materialize([forged], { counter: 1, root: toBytes(forged.toRoot!) })).toThrow(
            'does not reproduce its root',
        );
    });

    it('says when the head asked for cannot be built', () => {
        const r = materialize([], { counter: 5, root: new Uint8Array(32).fill(1) });
        expect(r).toMatchObject({ behind: true, head: { counter: 0, root: null } });
    });

    it('keeps the dev WM across a restart', async () => {
        const fs = await import('fs');
        const os = await import('os');
        const path = await import('path');
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wardd-'));
        const first = await Wardd.create({ dataDir: dir, memory: true });
        const a = new FakeDevice();
        await (await first.openStore({ wardId: toHex(a.wardId) })).sync(a.call);
        const nonce = await first.wm.headNonce(a.wardId);
        const second = await Wardd.create({ dataDir: dir, memory: true });
        expect(await second.wm.headNonce(a.wardId)).toEqual(nonce);
    });
});
