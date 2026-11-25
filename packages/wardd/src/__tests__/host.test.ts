/**
 * Every wardd conversation against the fake device: genesis, flush (single and batched), catch-up
 * along the chain, a fork that needs the user's rejoin, a lost predecessor check, and the replica
 * refusing a corrupt row.
 */
import { ed25519 } from '@noble/curves/ed25519.js';

import {
    DevWm,
    EMPTY_ROOT,
    attestationPreimage,
    serveEntry,
    toBytes,
    toHex,
} from '@trezor/ward-core';

import { InMemoryWardBackend, type StoredLink } from '../backend';
import { type Device, WardHost } from '../host';
import { materialize } from '../replica';
import { Wardd } from '../service';
import { FakeDevice, newWallet } from './fakeDevice';

/** `rollForward: false` models a host that does not hold the history a restored WM lost. */
const setup = async ({ rollForward = true }: { rollForward?: boolean } = {}) => {
    const wardd = await Wardd.create({ dataDir: null, memory: true, rollForward });
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
    it('characterizes replica work for queued catch-up after its caller disconnects', async () => {
        const device = new FakeDevice();
        const backend = new InMemoryWardBackend();
        const load = jest.spyOn(backend, 'load');
        const host = new WardHost(device.wardId, backend, null);
        let releaseWallet = () => {};
        const hold = new Promise<void>(resolve => (releaseWallet = resolve));
        const running = host.exclusive(() => hold);
        const disconnected = new Error('the caller disconnected while queued');
        const queued = host.catchUp(() => Promise.reject(disconnected));
        expect(load).not.toHaveBeenCalled();

        releaseWallet();
        await Promise.all([running, expect(queued).rejects.toBe(disconnected)]);
        // Until queue cancellation is wired up, catch-up rebuilds before asking
        // for a device reply and discovering that its caller is gone.
        expect(load).toHaveBeenCalledTimes(1);
        await expect(host.status()).resolves.toMatchObject({ counter: 0 });
    });

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

    it("serves each link's kept WM attestation when the device asks (WardRollback)", async () => {
        const { a, host, wm } = await setup();
        a.enqueue('alice', 'bc1q-alice');
        a.enqueue('bob', 'bc1q-bob');
        await host.flush(a.call);
        await host.sync(a.call);
        const { trie } = await host.replica();
        const ask = (withAcceptance: boolean) => {
            const acks: any[] = [];
            const device: Device = m => {
                acks.push(m.message);

                return Promise.resolve({ name: 'Success', message: {} });
            };

            return host
                .answerChain(device, trie, {
                    name: 'WardChainRequest',
                    message: {
                        to_counter: a.head.counter,
                        to_root: toHex(a.head.root),
                        ...(withAcceptance ? { with_acceptance: true } : {}),
                    },
                })
                .then(() => acks[0].links as any[]);
        };

        const plain = await ask(false);
        expect(plain.every(l => !l.acceptance)).toBe(true);
        const links = await ask(true);
        expect(links.map(l => l.to_counter)).toEqual([2, 1]);
        for (const l of links) {
            expect(l.acceptance).toBeDefined();
            const body = {
                fromCounter: l.from_counter,
                fromRoot: l.from_root ? toBytes(l.from_root) : EMPTY_ROOT,
                toCounter: l.to_counter,
                toRoot: toBytes(l.to_root),
                timestamp: l.acceptance.timestamp,
            };
            const preimage = attestationPreimage(toBytes(l.acceptance.nonce), a.wardId, body);
            expect(ed25519.verify(toBytes(l.acceptance.wm_signature), preimage, wm.pubkey)).toBe(
                true,
            );
        }
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

    it('adding and then deleting an entry leaves the root from before the add', async () => {
        const { a, host } = await setup();
        a.enqueue('alice', 'v1');
        a.enqueue('bob', 'v1');
        await host.flush(a.call);
        const before = (await host.status()).root;

        a.enqueue('temp', 'short-lived');
        await host.flush(a.call);
        expect((await host.status()).root).not.toBe(before);
        a.enqueue('temp', null);
        const r = await host.flush(a.call);

        expect(r).toMatchObject({ counter: 4, root: before });
        expect(toHex(a.head.root)).toBe(before);
        // and the replica rebuilt from every stored row, the add and the delete included
        const links = await (host as unknown as { backend: InMemoryWardBackend }).backend.load();
        expect(links).toHaveLength(4);
        expect(toHex(materialize(links).trie.root()!)).toBe(before);
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
        const { keys, a, host, wm } = await setup({ rollForward: false });
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

    it('decides reconcile, chain walk or rejoin correctly across a batched transition', async () => {
        // ONE LINK, SEVERAL COUNTERS: the WM's branch is a single batch 2 -> 5, so a backward walk
        // steps from 5 straight to 2. Each sync must still pick the step the device can take.
        const { keys, a, host, wm } = await setup({ rollForward: false });
        const b = new FakeDevice(keys);
        const c = new FakeDevice(keys);
        a.enqueue('x1', '1');
        a.enqueue('x2', '2');
        await host.flush(a.call); // 0 -> 1 -> 2
        await host.sync(b.call);
        await host.sync(c.call);
        const atTwo = wm.snapshot();
        // b's branch: 2 -> 3 -> 4, single steps
        b.enqueue('b3', '3');
        b.enqueue('b4', '4');
        await expect(host.flush(b.call)).resolves.toMatchObject({ counter: 4, published: 2 });
        // the WM is restored to 2, and a writes ONE batch 2 -> 5 on top
        wm.restore(atTwo);
        for (const k of ['a3', 'a4', 'a5']) a.enqueue(k, k);
        await expect(host.flush(a.call, { maxBatch: 8 })).resolves.toMatchObject({
            counter: 5,
            published: 1,
        });

        // at the batch's START: the one batched step is reconciled outright
        await expect(host.sync(c.call)).resolves.toMatchObject({ counter: 5, how: 'reconcile' });
        // from genesis: the walk crosses the batch link in one step, 5 -> 2, and on to 0
        const d = new FakeDevice(keys);
        await expect(host.sync(d.call)).resolves.toMatchObject({ counter: 5, how: 'verifyChain' });
        // at 4, a counter INSIDE the batch's span on the WM's branch: no walk can land there, so
        // it is a fork -- at 2, the last state both branches stood at
        await expect(host.sync(b.call)).rejects.toMatchObject({ code: 'needs_rejoin' });
        await expect(host.sync(b.call, { rejoin: true })).resolves.toMatchObject({
            how: 'rejoin',
            counter: 5,
            discarded: 2,
        });
        expect(b.head).toEqual(a.head);
        expect(c.head).toEqual(a.head);
        expect(d.head).toEqual(a.head);
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
        const { keys, a, host, wm } = await setup({ rollForward: false });
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

describe('ADVERSARIAL: a transition is invalidated by a new sync', () => {
    /**
     * A change the device authorises and the host holds back, minted against `host`'s replica:
     * the device's result and the root it builds.
     */
    const mintHeld = async (host: WardHost, device: FakeDevice, key: string, value: string) => {
        device.enqueue(key, value);
        let reply = await device.call({ name: 'WardFlushQueue', message: {} });
        while (reply.name === 'WardEntryRequest') {
            reply = await device.call({
                name: 'WardEntryAck',
                message: (await host.serveEntry(reply.message as never)) as never,
            });
        }
        expect(reply.name).toBe('WardFlushQueueAck');
        const { inflight } = device as unknown as { inflight: { to: { root: Uint8Array } } };

        return { result: reply.message as Record<string, any>, toRoot: inflight.to.root };
    };

    it('refuses a result minted before the same device synced again', async () => {
        const { a, host, wm } = await setup();
        a.enqueue('one', '1');
        await host.flush(a.call);
        await host.sync(a.call);
        const before = wm.record(a.wardId);
        const { result } = await mintHeld(host, a, 'two', '2');

        await host.sync(a.call); // a new round: a new session nonce at the WM
        await expect(host.applyResult(result as never)).rejects.toMatchObject({
            code: 'wm_conflict',
        });
        expect(wm.record(a.wardId)).toEqual(before);
        expect((await host.replica()).trie.links).toHaveLength(1);
    });

    it('refuses a result once another device of the wallet has synced', async () => {
        const { keys, a, host, wm } = await setup();
        const b = new FakeDevice(keys);
        a.enqueue('one', '1');
        await host.flush(a.call);
        await host.sync(a.call);
        const { result } = await mintHeld(host, a, 'two', '2');

        await host.sync(b.call); // the wallet's latest sync is now b's
        await expect(host.applyResult(result as never)).rejects.toMatchObject({
            code: 'wm_conflict',
        });
        expect(wm.record(a.wardId)?.counter).toBe(1);
        // a syncs, the change is derived again in the current session, and lands
        await expect(host.flush(a.call)).resolves.toMatchObject({ counter: 2, published: 1 });
    });

    it('is refused by the WM itself when a host skips its own check', async () => {
        const { a, host, wm } = await setup();
        a.enqueue('one', '1');
        await host.flush(a.call);
        await host.sync(a.call);
        const head = (await wm.head(a.wardId))!;
        const { result, toRoot } = await mintHeld(host, a, 'two', '2');
        const step = {
            wardId: a.wardId,
            fromCounter: head.counter,
            fromRoot: head.root,
            toCounter: result.counter as number,
            toRoot,
            wmSig: toBytes(result.wm_sig as string),
        };

        await host.sync(a.call);
        await expect(wm.advance(step)).rejects.toThrow('not authorised');
        expect((await wm.head(a.wardId))?.counter).toBe(1);
    });
});

describe('a WM whose register went back', () => {
    it('is rolled forward through the device, which signs the accepted transitions again', async () => {
        const { keys, a, host, wm } = await setup();
        a.enqueue('one', '1');
        await host.flush(a.call);
        const atOne = wm.snapshot();
        a.enqueue('two', '2');
        a.enqueue('three', '3');
        await host.flush(a.call);
        const before = await headOf(host);
        const { backend } = host as unknown as { backend: InMemoryWardBackend };
        const lastAccepted = Math.max(
            ...(await backend.loadAttestations())
                .filter(r => r.fromCounter === 2 && r.toCounter === 3)
                .map(r => r.timestamp),
        );
        wm.restore(atOne);
        expect(wm.record(a.wardId)?.counter).toBe(1);

        // the device is AHEAD of the restored WM: its ingest reports it, and it signs 1 -> 2 -> 3
        // again; the sync says what was rolled forward and when the last change was accepted
        await expect(host.sync(a.call)).resolves.toMatchObject({
            counter: 3,
            how: 'reconcile',
            rolledForward: { steps: 2, toCounter: 3, lastTimestamp: lastAccepted },
        });
        expect(wm.record(a.wardId)?.counter).toBe(3);
        expect(await headOf(host)).toEqual(before);
        // and a device that never saw it follows the whole chain
        const b = new FakeDevice(keys);
        await expect(host.sync(b.call)).resolves.toMatchObject({ counter: 3 });
        expect(b.head).toEqual(a.head);
    });

    it('is not rolled forward by a device that is not ahead of the restored WM', async () => {
        const { keys, a, host, wm } = await setup();
        a.enqueue('one', '1');
        await host.flush(a.call);
        const atOne = wm.snapshot();
        a.enqueue('two', '2');
        await host.flush(a.call);
        wm.restore(atOne);

        // a fresh device of the wallet detects nothing: the restored head is above its own
        const fresh = new FakeDevice(keys);
        const r = await host.sync(fresh.call);
        expect(r).toMatchObject({ counter: 1 });
        expect(r.rolledForward).toBeUndefined();
        expect(wm.record(a.wardId)?.counter).toBe(1);
    });

    it('fails a device ahead of the WM with wm_behind when roll-forward is off', async () => {
        const { a, host, wm } = await setup({ rollForward: false });
        a.enqueue('one', '1');
        await host.flush(a.call);
        const atOne = wm.snapshot();
        a.enqueue('two', '2');
        await host.flush(a.call);
        wm.restore(atOne);

        await expect(host.sync(a.call)).rejects.toMatchObject({ code: 'wm_behind' });
        expect(wm.record(a.wardId)?.counter).toBe(1);
    });

    it('is not rolled forward on the deprecated service path', async () => {
        const { a, host, wm } = await setup();
        a.enqueue('one', '1');
        await host.flush(a.call);
        const atOne = wm.snapshot();
        a.enqueue('two', '2');
        await host.flush(a.call);
        wm.restore(atOne);

        const round = await host.serviceSync(
            a.serviceSyncRequest(toHex(await wm.challenge(a.wardId))).message,
        );
        expect(round.response.message).toMatchObject({ to_counter: 1 });
        expect(wm.record(a.wardId)?.counter).toBe(1);
    });

    it('is not rolled forward onto a branch it is not on', async () => {
        const { keys, a, host, wm } = await setup({ rollForward: false });
        const b = new FakeDevice(keys);
        a.enqueue('shared', '1');
        await host.flush(a.call);
        await host.sync(b.call);
        const atOne = wm.snapshot();
        // b's branch: 1 -> 2b -> 3b, attested
        b.enqueue('b2', 'x');
        b.enqueue('b3', 'y');
        await host.flush(b.call);
        // restored to 1, and a writes 2a on top: the WM is now on another branch
        wm.restore(atOne);
        a.enqueue('a2', 'z');
        await host.flush(a.call);
        const fork = wm.record(a.wardId);

        // a host that DOES hold b's branch syncs: 3b is newer, but the WM's 2a is not under it
        const { backend } = host as unknown as { backend: InMemoryWardBackend };
        const rolling = new WardHost(a.wardId, backend, wm);
        await expect(rolling.sync(a.call)).resolves.toMatchObject({ counter: 2 });
        expect(wm.record(a.wardId)).toEqual(fork);
    });

    it('stops at the first step without a kept WM record', async () => {
        const { a, host, wm } = await setup();
        a.enqueue('one', '1');
        a.enqueue('two', '2');
        a.enqueue('three', '3');
        await host.flush(a.call);
        const { backend } = host as unknown as { backend: InMemoryWardBackend };
        const rows = await backend.load();
        wm.restore({
            heads: {
                [toHex(a.wardId)]: {
                    fromCounter: rows[0]!.fromCounter,
                    fromRoot: rows[0]!.fromRoot ?? toHex(EMPTY_ROOT),
                    counter: rows[0]!.toCounter,
                    root: rows[0]!.toRoot ?? toHex(EMPTY_ROOT),
                },
            },
        });
        // a copy of the log that lost the WM's record of 2 -> 3, but kept the newer head's
        const stripped = new InMemoryWardBackend();
        for (const row of rows) await stripped.append(row);
        for (const att of await backend.loadAttestations()) {
            if (!(att.fromCounter === 2 && att.toCounter === 3)) {
                await stripped.appendAttestation(att);
            }
        }
        const partial = new WardHost(a.wardId, stripped, wm);
        await expect(partial.sync(a.call)).rejects.toMatchObject({ code: 'wm_behind' });
        expect(wm.record(a.wardId)?.counter).toBe(2);
    });

    it('is not signed again by a device whose own head is off the replayed chain', async () => {
        const { keys, a, host, wm } = await setup({ rollForward: false });
        const b = new FakeDevice(keys);
        a.enqueue('shared', '1');
        await host.flush(a.call);
        await host.sync(b.call);
        const atOne = wm.snapshot();
        // b's branch 1 -> 2b, then the WM goes back and a's branch 1 -> 2a -> 3a is newer
        b.enqueue('b2', 'x');
        await host.flush(b.call);
        wm.restore(atOne);
        a.enqueue('a2', 'y');
        a.enqueue('a3', 'z');
        await host.flush(a.call);
        wm.restore(atOne);

        const { backend } = host as unknown as { backend: InMemoryWardBackend };
        const rolling = new WardHost(a.wardId, backend, wm);
        // b stands on 2b: it refuses to sign 1 -> 2a, nothing advances, and b is still ahead
        await expect(rolling.sync(b.call)).rejects.toMatchObject({ code: 'wm_behind' });
        expect(wm.record(a.wardId)?.counter).toBe(1);
        // a stands on 3a: it signs the chain again, and the WM is back
        await expect(rolling.sync(a.call)).resolves.toMatchObject({ counter: 3 });
        expect(wm.record(a.wardId)?.counter).toBe(3);
    });

    it('the device refuses a forged or misplaced WM record, and signs nothing', async () => {
        const { a, host, wm } = await setup();
        a.enqueue('one', '1');
        a.enqueue('two', '2');
        await host.flush(a.call);
        const { backend } = host as unknown as { backend: InMemoryWardBackend };
        const rows = await backend.load();
        const kept = await backend.loadAttestations();
        const recordOf = (fromCounter: number) =>
            kept.find(r => r.fromCounter === fromCounter && r.toCounter === fromCounter + 1)!;
        wm.restore({
            heads: {
                [toHex(a.wardId)]: {
                    fromCounter: 0,
                    fromRoot: toHex(EMPTY_ROOT),
                    counter: 1,
                    root: rows[0]!.toRoot!,
                },
            },
        });
        const sync = await a.call({ name: 'WardSync', message: {} });
        const nonce = toBytes((sync.message as { nonce: string }).nonce);
        const att = await wm.attest(a.wardId, nonce);
        // the device detects the restored WM first: no roll-forward without it
        await expect(
            a.call({
                name: 'WardIngestAttestation',
                message: {
                    from_counter: att.fromCounter,
                    from_root: toHex(att.fromRoot),
                    to_counter: att.toCounter,
                    to_root: toHex(att.toRoot),
                    timestamp: att.timestamp,
                    wm_signature: toHex(att.signature),
                },
            }),
        ).resolves.toMatchObject({
            name: 'WardIngestAttestationAck',
            message: { wm_behind: true, stored_counter: 2 },
        });
        const step = rows.find(r => r.fromCounter === 1)!;
        const rollForward = (acceptance: Record<string, unknown>) =>
            a.call({
                name: 'WardRollForward',
                message: {
                    from_counter: att.fromCounter,
                    from_root: toHex(att.fromRoot),
                    to_counter: att.toCounter,
                    to_root: toHex(att.toRoot),
                    timestamp: att.timestamp,
                    wm_signature: toHex(att.signature),
                    links: [
                        {
                            from_counter: 1,
                            from_root: step.fromRoot,
                            to_counter: 2,
                            to_root: step.toRoot,
                            auth_commit: step.authCommit,
                            acceptance,
                        },
                    ],
                },
            });
        const genuine = recordOf(1);
        const flipped = genuine.signature.startsWith('0') ? '1' : '0';
        const forged = { ...genuine, signature: flipped + genuine.signature.slice(1) };
        const misplaced = recordOf(0); // a real WM record, of another step
        for (const r of [forged, misplaced]) {
            await expect(
                rollForward({ nonce: r.nonce, timestamp: r.timestamp, wm_signature: r.signature }),
            ).resolves.toMatchObject({
                name: 'Failure',
                message: { message: 'WARD: no WM record that this transition was accepted' },
            });
        }
        // the genuine record is signed again, under this round's nonce
        await expect(
            rollForward({
                nonce: genuine.nonce,
                timestamp: genuine.timestamp,
                wm_signature: genuine.signature,
            }),
        ).resolves.toMatchObject({ name: 'WardRollForwardAck' });
    });

    it('never replays a device signature: a restore ends the session', async () => {
        const { keys, a, host, wm } = await setup();
        const b = new FakeDevice(keys);
        a.enqueue('one', '1');
        await host.flush(a.call);
        await host.sync(b.call);
        const atOne = wm.snapshot();
        // b mints 1 -> 2 in its session and the WM accepts it...
        b.enqueue('two', '2');
        await host.flush(b.call);
        // ...then the register goes back to 1, and the host has no WM record to replay
        const { backend } = host as unknown as { backend: InMemoryWardBackend };
        const rows = await backend.load();
        wm.restore(atOne);
        const two = rows.find(r => r.toCounter === 2)!;
        await expect(
            wm.advance({
                wardId: a.wardId,
                fromCounter: 1,
                fromRoot: toBytes(two.fromRoot!),
                toCounter: 2,
                toRoot: toBytes(two.toRoot!),
                wmSig: toBytes(two.wmSig!),
            }),
        ).rejects.toThrow('no session');
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
        expect(await wardd.wm?.head(a.wardId)).toEqual({ counter: 0, root: null });
        // AND THE LOCK IS FREE: the next call runs rather than waiting on the failed one
        await expect(host.status()).resolves.toMatchObject({ counter: 0, wmCounter: 0 });
        // once writes work again, the change -- still queued on the device -- goes through
        fail = false;
        await expect(host.flush(a.call)).resolves.toMatchObject({ counter: 1, published: 1 });
    });
});

describe('the replica', () => {
    /** `link` with its one change moved to another path: the same root claimed, not reproduced */
    const corrupted = (link: StoredLink): StoredLink => ({
        ...link,
        changes: [{ ...link.changes[0]!, entryKey: toHex(new Uint8Array(32).fill(9)) }],
    });

    it('leaves out a stored link that does not reproduce its own root, and says so', async () => {
        const { a, host } = await setup();
        a.enqueue('x', '1');
        await host.flush(a.call);
        const links = await (host as unknown as { backend: InMemoryWardBackend }).backend.load();
        const forged = corrupted(links[0]!);
        const lines: string[] = [];

        const r = materialize([forged], { counter: 1, root: toBytes(forged.toRoot!) }, line =>
            lines.push(line),
        );
        // the head asked for cannot be built without it: genesis, and the replica says why
        expect(r).toMatchObject({ behind: true, corrupt: 1, head: { counter: 0, root: null } });
        expect(r.trie.links).toHaveLength(0);
        expect(lines.some(l => l.includes('LEAVING OUT the stored link into #1'))).toBe(true);
    });

    it('falls back to the highest head that still builds, past a corrupt row', async () => {
        const { a, host } = await setup();
        a.enqueue('x', '1');
        a.enqueue('y', '2');
        await host.flush(a.call);
        const links = await (host as unknown as { backend: InMemoryWardBackend }).backend.load();
        const top = links.find(l => l.toCounter === 2)!;
        const rest = links.filter(l => l !== top);

        const r = materialize([...rest, corrupted(top)]);
        expect(r).toMatchObject({ behind: false, corrupt: 1, head: { counter: 1 } });
        expect(r.trie.size).toBe(1);
    });

    it("narrates a rebuild: the walk back to genesis, each step's entries, each root", async () => {
        const { a, host } = await setup();
        a.enqueue('x', '1');
        a.enqueue('y', '2');
        await host.flush(a.call);
        const links = await (host as unknown as { backend: InMemoryWardBackend }).backend.load();
        const { head } = await host.replica();
        const lines: string[] = [];
        materialize(links, head, line => lines.push(line));
        const text = lines.join('\n');
        // newest first on the way back, oldest first on the way forward
        expect(text.indexOf('retrieved transition #1 -> #2')).toBeLessThan(
            text.indexOf('retrieved transition #0 -> #1'),
        );
        expect(text).toContain('reached genesis');
        expect(text.indexOf('applying #0 -> #1')).toBeLessThan(text.indexOf('applying #1 -> #2'));
        expect(lines.filter(l => l.includes('entry=')).length).toBe(2);
        expect(lines.filter(l => l.includes('matches the stored transition')).length).toBe(2);
        expect(lines[lines.length - 1]).toBe(
            `rebuild: trie at #2, root=${toHex(head.root!).slice(0, 12)}…, 2 leaves`,
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
        const head = await first.wm?.head(a.wardId);
        expect(head).toBeTruthy();
        const second = await Wardd.create({ dataDir: dir, memory: true });
        expect(await second.wm?.head(a.wardId)).toEqual(head);
    });
});

describe('wardd without a WM (--without-wm, the MVP)', () => {
    const mvp = async () => {
        const wardd = await Wardd.create({ dataDir: null, memory: true, withoutWm: true });
        const keys = newWallet();
        const a = new FakeDevice(keys, { wm: false });
        const host = await wardd.openStore({ wardId: toHex(a.wardId) });

        return { wardd, keys, a, host };
    };

    it('flushes by storing each change and catching the device up to it, persisted', async () => {
        const { a, host } = await mvp();
        a.enqueue('alice', 'v1');
        a.enqueue('bob', 'v2');

        await expect(host.flush(a.call)).resolves.toMatchObject({
            counter: 2,
            published: 2,
            remaining: 0,
        });
        // the device's STORED head moved, and its queue settled, with no WM ever involved
        expect(a.head.counter).toBe(2);
        expect(a.queue).toHaveLength(0);
        expect(a.online).toBe(false);
        expect(await host.status()).toMatchObject({
            counter: 2,
            withoutWm: true,
            wmAvailable: false,
            attestedCounter: null,
        });
    });

    it('syncs another device of the wallet by a catch-up it persists', async () => {
        const { keys, a, host } = await mvp();
        a.enqueue('alice', 'v1');
        await host.flush(a.call);

        const b = new FakeDevice(keys, { wm: false });
        await expect(host.sync(b.call)).resolves.toMatchObject({ counter: 1, how: 'catchUp' });
        expect(b.head.counter).toBe(1);
        expect(b.provisional).toBeNull();
    });

    it("refuses to store a step this wallet's device did not sign", async () => {
        const { a, host } = await mvp();
        a.enqueue('alice', 'v1');
        // a caller holding the token, handing wardd a step under a signature of its own
        const forging: Device = async m => {
            const reply = await a.call(m);
            if (reply.name !== 'WardFlushQueueAck') return reply;

            return { ...reply, message: { ...reply.message, wm_sig: '00'.repeat(64) } };
        };

        await expect(host.flush(forging)).rejects.toEqual(
            expect.objectContaining({ code: 'bad_request' }),
        );
        expect(await host.storedLinks()).toHaveLength(0);
    });

    it('refuses the service channel, which needs a WM', async () => {
        const { a, host } = await mvp();
        await expect(
            host.serviceSync({ ward_id: toHex(a.wardId), nonce: toHex(new Uint8Array(32)) }),
        ).rejects.toEqual(expect.objectContaining({ code: 'bad_request' }));
    });

    it('cannot be given a WM as well', async () => {
        await expect(
            Wardd.create({ dataDir: null, memory: true, withoutWm: true, wm: new DevWm() }),
        ).rejects.toThrow('cannot also be given one');
    });
});
