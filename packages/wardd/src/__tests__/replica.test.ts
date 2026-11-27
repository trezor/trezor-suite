/**
 * The replica leaves out a stored row that does not reproduce its own root, and rebuilds without
 * it, rather than failing every operation.
 *
 * FUNCTIONAL: one bad row costs the head built through it, never the host. ADVERSARIAL: a peer
 * holding the wallet's Evolu owner key stores corrupt rows on purpose -- above the head, as a
 * second path into it, or over a genuine row's id. Such a peer can always deny service by deleting
 * or withholding rows; what these pin is that corrupt rows do no MORE than that: the host keeps
 * serving every head that still builds, and a device is never walked backwards by the fallback.
 */
import { randomBytes } from '@noble/hashes/utils.js';

import { DevWm, WardTrie, toHex } from '@trezor/ward-core';

import { InMemoryWardBackend, type StoredLink } from '../backend';
import { WardHost } from '../host';
import { materialize } from '../replica';
import { FakeDevice, newWallet } from './fakeDevice';

const hex = (n: number) => toHex(randomBytes(n));

/** A well-formed sealed part, as a device frames one; its bytes never match anything stored. */
const junkLeaf = () => ({ identity: `01${hex(28)}`, content: `01${hex(28)}` });

/** A row from `from` to `toCounter` whose one change cannot reproduce the root it claims. */
const corruptRow = (
    from: { counter: number; root: string | null },
    toCounter: number,
    toRoot: string | null = hex(32),
): StoredLink => ({
    fromCounter: from.counter,
    fromRoot: from.root,
    toCounter,
    toRoot,
    authCommit: hex(32),
    operation: 'commit',
    wmSig: null,
    changes: [{ entryKey: hex(32), leaf: junkLeaf() }],
});

/** `row` under its own id, with its change moved to another path: what overwriting it leaves. */
const rewritten = (row: StoredLink): StoredLink => ({
    ...row,
    changes: [{ ...row.changes[0]!, entryKey: hex(32) }],
});

/** A wallet, its host over a backend the test can write to directly, and its first device. */
const setup = (opts: { wm: boolean }) => {
    const keys = newWallet();
    const a = new FakeDevice(keys, { wm: opts.wm });
    const backend = new InMemoryWardBackend();
    const host = new WardHost(a.wardId, backend, opts.wm ? new DevWm() : null);

    return { keys, a, backend, host };
};

const rowInto = async (backend: InMemoryWardBackend, counter: number) =>
    (await backend.load()).find(l => l.toCounter === counter)!;

it('characterizes predecessor lookup work during a linear replica rebuild', () => {
    const { linksEndingAt: rebuild } = WardTrie.prototype;
    let inspected = 0;
    const walk = jest.spyOn(WardTrie.prototype, 'linksEndingAt').mockImplementation(function (
        this: WardTrie,
        ...args
    ) {
        const { links } = this;
        this.links = new Proxy(links, {
            get(target, key, receiver) {
                if (typeof key === 'string' && /^\d+$/.test(key)) inspected++;

                return Reflect.get(target, key, receiver);
            },
        });
        try {
            return rebuild.apply(this, args);
        } finally {
            this.links = links;
        }
    });
    try {
        for (const count of [128, 256]) {
            inspected = 0;
            const links: StoredLink[] = Array.from({ length: count }, (_, i) => ({
                fromCounter: i,
                fromRoot: null,
                toCounter: i + 1,
                toRoot: null,
                operation: 'commit',
                authCommit: '00'.repeat(32),
                wmSig: null,
                changes: [],
            }));
            expect(materialize(links, { counter: count, root: null }).head.counter).toBe(count);
            // Rebuild indexes the incoming transitions before following the tree dependencies.
            expect(inspected).toBeLessThanOrEqual(count);
        }
    } finally {
        walk.mockRestore();
    }
});

it('rebuilds the reverted tree with or without the discarded records', async () => {
    const { a, backend, host } = setup({ wm: false });
    a.enqueue('alice', 'kept');
    await host.flush(a.call);
    const target = await rowInto(backend, 1);
    a.enqueue('bob', 'later');
    await host.flush(a.call);
    const late = await rowInto(backend, 2);
    const revert: StoredLink = {
        operation: 'revert',
        recoveredCounter: 1,
        fromCounter: 2,
        fromRoot: late.toRoot,
        toCounter: 3,
        toRoot: target.toRoot,
        changes: [],
        authCommit: hex(32),
        wmSig: null,
    };
    const want = { counter: 3, root: Uint8Array.from(Buffer.from(target.toRoot!, 'hex')) };
    for (const rows of [
        [revert, target],
        [late, revert, target],
    ]) {
        const rebuilt = materialize(rows, want);
        expect(rebuilt.behind).toBe(false);
        expect(rebuilt.trie.root()).toEqual(want.root);
        expect(rebuilt.trie.size).toBe(1);
        expect(rebuilt.trie.linksEndingAt(3, want.root, 1)[0]?.fromCounter).toBe(2);
    }
    expect(materialize([revert, late], want).behind).toBe(true);
    expect(materialize([target, { ...revert, recoveredCounter: 3 }], want).behind).toBe(true);
});

describe('the replica with a corrupt row', () => {
    it('keeps serving the valid head, and taking writes, after a corrupt row lands above it', async () => {
        const { keys, a, backend, host } = setup({ wm: false });
        a.enqueue('alice', 'v1');
        await host.flush(a.call);
        const head = await host.status();

        await backend.append(corruptRow({ counter: 1, root: head.root }, 2));

        expect(await host.status()).toMatchObject({ counter: 1, root: head.root, corrupt: 1 });
        // another device of the wallet still catches up to the valid head...
        const b = new FakeDevice(keys, { wm: false });
        await expect(host.sync(b.call)).resolves.toMatchObject({ counter: 1, how: 'catchUp' });
        // ...and the first can write on top of it, at the very counter the corrupt row claims
        a.enqueue('bob', 'v2');
        await expect(host.flush(a.call)).resolves.toMatchObject({ counter: 2, published: 1 });
        expect(a.head.counter).toBe(2);
        expect(await host.status()).toMatchObject({ counter: 2, corrupt: 1 });
    });

    it('never replays, or counts, a corrupt row that no head is built through', async () => {
        const { a, backend, host } = setup({ wm: true });
        a.enqueue('alice', 'v1');
        await host.flush(a.call);

        // a dead sibling at counter 1, beside the WM's head
        await backend.append(corruptRow({ counter: 0, root: null }, 1));

        expect(await host.status()).toMatchObject({
            counter: 1,
            wmCounter: 1,
            behind: false,
            corrupt: 0,
        });
    });

    it("says it is behind when the WM's head builds only through a corrupt row, and recovers once the row is restored", async () => {
        const { keys, a, backend, host } = setup({ wm: true });
        a.enqueue('alice', 'v1');
        await host.flush(a.call);
        const genuine = await rowInto(backend, 1);

        await backend.append(rewritten(genuine));

        expect(await host.status()).toMatchObject({
            counter: 0,
            wmCounter: 1,
            behind: true,
            corrupt: 1,
        });
        // a sync is refused for what it is -- the replica lacks the link -- not by a crash
        const b = new FakeDevice(keys, { wm: true });
        await expect(host.sync(b.call)).rejects.toEqual(
            expect.objectContaining({ code: 'internal' }),
        );

        // a peer re-stores the genuine row under the same id
        await backend.append(genuine);

        expect(await host.status()).toMatchObject({ counter: 1, behind: false, corrupt: 0 });
        await expect(host.sync(b.call)).resolves.toMatchObject({ counter: 1 });
    });
});

describe('ADVERSARIAL: a peer holding the owner key stores corrupt rows', () => {
    it('rewriting a stored row under its id costs that head, and never walks a device back', async () => {
        const { a, backend, host } = setup({ wm: false });
        a.enqueue('alice', 'v1');
        a.enqueue('bob', 'v2');
        await host.flush(a.call);
        expect(a.head.counter).toBe(2);

        await backend.append(rewritten(await rowInto(backend, 2)));

        expect(await host.status()).toMatchObject({ counter: 1, corrupt: 1 });
        // the fallback head is OLDER than this device's: offered, and refused
        await expect(host.catchUp(a.call)).rejects.toEqual(
            expect.objectContaining({ code: 'device_failure' }),
        );
        expect(a.head.counter).toBe(2);
    });

    it('a tower of corrupt rows stacked above the head does not hide it', async () => {
        const { keys, a, backend, host } = setup({ wm: false });
        a.enqueue('alice', 'v1');
        await host.flush(a.call);
        let top = { counter: 1, root: (await host.status()).root };
        for (let i = 0; i < 30; i++) {
            const row = corruptRow(top, top.counter + 1);
            await backend.append(row);
            top = { counter: row.toCounter, root: row.toRoot };
        }

        // only the first of them is ever replayed: without it, nothing above reaches genesis
        expect(await host.status()).toMatchObject({ counter: 1, corrupt: 1 });
        const b = new FakeDevice(keys, { wm: false });
        await expect(host.sync(b.call)).resolves.toMatchObject({ counter: 1 });
    });

    it('a corrupt second path into the real head is passed over for the genuine one', async () => {
        const { keys, a, backend, host } = setup({ wm: false });
        a.enqueue('alice', 'v1');
        a.enqueue('bob', 'v2');
        await host.flush(a.call);
        const head = await host.status();

        // newer than the genuine rows, so it is the one a walk back from the head tries first
        await backend.append(corruptRow({ counter: 0, root: null }, 2, head.root));

        expect(await host.status()).toMatchObject({
            counter: 2,
            root: head.root,
            corrupt: 1,
        });
        // the chain a device walks is the genuine one: every auth_commit on it verifies
        const b = new FakeDevice(keys, { wm: false });
        await expect(host.sync(b.call)).resolves.toMatchObject({ counter: 2 });
        expect(b.head.counter).toBe(2);
    });

    it('with a WM, corrupt rows above its head do not move the head the replica serves', async () => {
        const { a, backend, host } = setup({ wm: true });
        a.enqueue('alice', 'v1');
        await host.flush(a.call);
        let top = { counter: 1, root: (await host.status()).root };
        for (let i = 0; i < 5; i++) {
            const row = corruptRow(top, top.counter + 1);
            await backend.append(row);
            top = { counter: row.toCounter, root: row.toRoot };
        }

        // built at the WM's head, which none of them is on: none is even replayed
        expect(await host.status()).toMatchObject({ counter: 1, wmCounter: 1, corrupt: 0 });
    });
});
