import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';

import { InMemoryWardDb, type RelayDevice, type WardRelayEndpoint } from '@trezor/ward';
import { DEBUG_QM_SEED } from '@trezor/ward/src/mocks';

import { NONCE, WARD_ID, fakeDevice } from '../../mocks/mockDevice';
import { Wardd } from '../service';
import { MockWm, type WmClient, WmConflict } from '../wm';

const utf8Hex = (value: string) => bytesToHex(new TextEncoder().encode(value));

const setup = async (wm: WmClient = new MockWm(), labelFreshness = false) => {
    const storage = new InMemoryWardDb();
    const wardd = new Wardd({ storage, wm, labelFreshness });
    const endpoint = await wardd.connect();
    const dev = fakeDevice(() => endpoint);

    return { storage, wardd, endpoint, dev };
};

const update = (endpoint: WardRelayEndpoint, device: RelayDevice, address: string, extra = {}) =>
    endpoint.call(
        'update',
        { appId: 'btc', address, networkSymbol: 'btc', metadata: { label: address }, ...extra },
        device,
    );

describe('wardd flows', () => {
    it('syncs an empty wallet: attests counter 0 and reconciles with no root', async () => {
        const { endpoint, dev } = await setup();

        const result = await endpoint.call('sync', {}, dev.device);

        expect(result).toEqual({
            wardId: WARD_ID,
            counter: 0,
            root: '',
            cache: { checked: 0, unchanged: 0, updated: 0, removed: 0 },
        });
        // the `sync` method validates the offline cache right after adopting the head
        expect(dev.names()).toEqual([
            'WARDSync',
            'WARDIngestAttestation',
            'WARDReconcile',
            'WARDListPendingEdits',
            'WARDValidateCache',
        ]);
        const ingest = dev.sent[1]!.message;
        expect(ingest.mac).toBeUndefined();
        // the debug WM's signature over the device's own nonce and ward_id
        const signed = concatBytes(
            new TextEncoder().encode('WARD ATTEST v2'),
            Uint8Array.of(2),
            hexToBytes(NONCE),
            hexToBytes(WARD_ID),
            new Uint8Array(4),
            new Uint8Array(32),
            (() => {
                const time = new Uint8Array(8);
                new DataView(time.buffer).setBigUint64(0, BigInt(ingest.timestamp as number));

                return time;
            })(),
            hexToBytes(ingest.head_nonce as string),
        );
        expect(
            ed25519.verify(
                hexToBytes(ingest.wm_signature as string),
                signed,
                ed25519.getPublicKey(DEBUG_QM_SEED),
            ),
        ).toBe(true);
        expect(dev.sent[2]!.message).toEqual({});
    });

    it('inserts, serving the pull from the stored leaves, and stores the device leaf', async () => {
        const { storage, endpoint, dev } = await setup();

        const first = await update(endpoint, dev.device, 'bc1qfirst');
        expect(first).toMatchObject({ wardId: WARD_ID, counter: 1 });
        expect(dev.names()).toEqual([
            'WARDSync',
            'WARDIngestAttestation',
            'WARDReconcile',
            'WARDQueueUpdate',
            'WARDPerformBatch',
            'WARDConfirmBatchByWM',
        ]);
        // empty tree: the INIT answer
        expect(dev.pulls).toEqual([{ proof: [] }]);
        expect(dev.sent[3]!.message).toMatchObject({
            address: utf8Hex('bc1qfirst'),
            app_id: 'btc',
        });
        expect(dev.sent[5]!.message).toMatchObject({ counter: 1 });

        const second = await update(endpoint, dev.device, 'bc1qsecond');
        expect(second).toMatchObject({ counter: 2 });
        // non-empty tree, absent key: a non-membership witness
        expect(dev.pulls[1]).toHaveProperty('witness_entry_key');
        expect(dev.pulls[1]).toHaveProperty('witness_commit');

        const tree = storage.getTreeState(WARD_ID)!;
        expect(tree.counter).toBe(2);
        expect(storage.getAllEntries(WARD_ID)).toHaveLength(0);
        expect(storage.getTransitions(WARD_ID).map(t => t.counter)).toEqual([1, 2]);
        // the stored leaves rebuild to the root the device installed
        expect(second.root).toBe(tree.root);
    });

    it('returns the verified verdict without trusting host-cached metadata', async () => {
        const { storage, endpoint, dev } = await setup();
        await update(endpoint, dev.device, 'bc1qfirst');
        storage.upsert(WARD_ID, 'btc', 'bc1qfirst', 'btc', {
            counter: 1,
            metadata: { label: 'forged cache' },
        });

        const found = await endpoint.call(
            'lookup',
            { appId: 'btc', address: 'bc1qfirst', networkSymbol: 'btc' },
            dev.device,
        );
        expect(found).toMatchObject({
            valid: true,
            isMember: true,
        });
        expect(found).not.toHaveProperty('metadata');
        expect(dev.pulls.at(-1)).toHaveProperty('content');

        const absent = await endpoint.call(
            'lookup',
            { appId: 'btc', address: 'bc1qother', networkSymbol: 'btc' },
            dev.device,
        );
        expect(absent).toMatchObject({ valid: true, isMember: false });
        expect(absent.metadata).toBeUndefined();
    });

    it('deletes: empty new_value, the row is removed and the tree empties', async () => {
        const { storage, endpoint, dev } = await setup();
        await update(endpoint, dev.device, 'bc1qfirst');

        const removed = await update(endpoint, dev.device, 'bc1qfirst', { delete: true });

        expect(removed).toMatchObject({ counter: 2, root: '' });
        const queued = dev.sent.filter(m => m.name === 'WARDQueueUpdate').at(-1)!;
        expect(queued.message.new_value).toBe('');
        expect(storage.getAllEntries(WARD_ID)).toHaveLength(0);
        expect(storage.getTreeState(WARD_ID)).toMatchObject({ counter: 2, root: '' });
    });

    it('proves absence and leaves the counter unchanged for idempotent deletion', async () => {
        const { endpoint, dev } = await setup();
        await expect(
            update(endpoint, dev.device, 'bc1qnone', { delete: true }),
        ).resolves.toMatchObject({ counter: 0, root: '' });
        expect(dev.names()).not.toContain('WARDQueueUpdate');
    });

    it('retains the intent when the WM head moved on', async () => {
        const base = new MockWm();
        const wm: WmClient = {
            current: (wardId, nonce) => base.current(wardId, nonce),
            history: wardId => base.history(wardId),
            attest: new MockWm().attest,
            commit: () => Promise.reject(new WmConflict(5)),
        };
        const { storage, endpoint, dev } = await setup(wm);

        const result = await update(endpoint, dev.device, 'bc1qfirst');

        expect(result).toMatchObject({ conflict: true, counter: 5 });
        expect(result).toMatchObject({ queued: true, pendingId: 7 });
        expect(dev.names()).not.toContain('WARDDiscardPending');
        expect(storage.getAllEntries(WARD_ID)).toHaveLength(0);
    });

    it('ends the conversation on a device Failure', async () => {
        const { endpoint } = await setup();
        const failing: RelayDevice = () =>
            Promise.resolve({ name: 'Failure', message: { code: 99, message: 'nope' } });

        await expect(endpoint.call('sync', {}, failing)).rejects.toMatchObject({
            code: 'device_failure',
        });
    });

    it("refuses a device whose ward_id is not the caller's", async () => {
        const { endpoint, dev } = await setup();

        await expect(
            endpoint.call('sync', { wardId: 'ef'.repeat(32) }, dev.device),
        ).rejects.toMatchObject({ code: 'ward_id_mismatch' });
    });

    it('serves no pull before a sync named the wallet', async () => {
        const { endpoint } = await setup();

        await expect(
            endpoint.call('answerProofRequest', { request: { entry_key: '00'.repeat(32) } }),
        ).rejects.toMatchObject({ code: 'no_store' });
    });

    describe('offline cache', () => {
        const entryKeyOf = (address: string) => utf8Hex(address).padEnd(64, '0').slice(0, 64);

        it('syncs, lets the device pull the proof, and reports a replacement', async () => {
            const { endpoint, dev } = await setup();
            await update(endpoint, dev.device, 'alice');
            const entryKey = entryKeyOf('alice');

            const first = await endpoint.call('cacheEntry', { entryKey }, dev.device);
            const again = await endpoint.call('cacheEntry', { entryKey }, dev.device);

            expect(first).toEqual({ wardId: WARD_ID, replaced: false, counter: 1 });
            expect(again).toMatchObject({ replaced: true });
            expect(dev.sent.filter(m => m.name === 'WARDCacheEntry').at(-1)?.message).toEqual({
                entry_key: entryKey,
                sticky: false,
            });
            // the pull was served with alice's leaf: a membership answer
            expect(dev.pulls.at(-1)).toHaveProperty('content');
        });

        it('passes on the device refusing an entry that is not in the trie', async () => {
            const { endpoint, dev } = await setup();
            await update(endpoint, dev.device, 'alice');

            await expect(
                endpoint.call('cacheEntry', { entryKey: entryKeyOf('mallory') }, dev.device),
            ).rejects.toMatchObject({ code: 'device_failure' });
        });

        it('rejects a malformed entry key before touching the device', async () => {
            const { endpoint, dev } = await setup();

            await expect(
                endpoint.call('cacheEntry', { entryKey: 'abc' }, dev.device),
            ).rejects.toMatchObject({ code: 'bad_request' });
            expect(dev.sent).toEqual([]);
        });
    });

    describe('sticky entries and cache validation', () => {
        const entryKeyOf = (address: string) => utf8Hex(address).padEnd(64, '0').slice(0, 64);

        it('sync validates the cache: entries WARD deleted go, sticky ones too', async () => {
            const { endpoint, dev } = await setup();
            for (const address of ['sticky', 'plain', 'kept']) {
                await update(endpoint, dev.device, address);
            }
            await endpoint.call(
                'cacheEntry',
                { entryKey: entryKeyOf('sticky'), sticky: true },
                dev.device,
            );
            await endpoint.call('cacheEntry', { entryKey: entryKeyOf('plain') }, dev.device);
            await endpoint.call('cacheEntry', { entryKey: entryKeyOf('kept') }, dev.device);
            for (const address of ['sticky', 'plain']) {
                await update(endpoint, dev.device, address, { delete: true });
            }
            dev.pulls.length = 0;

            const result: any = await endpoint.call('sync', {}, dev.device);

            expect(result.cache).toEqual({
                checked: 3,
                unchanged: 1,
                updated: 0,
                removed: 2,
            });
            // one proof served per cached entry, absences as witnesses
            expect(dev.pulls).toHaveLength(3);
        });

        it('moves a backup to another device and validates it there', async () => {
            const a = await setup();
            await update(a.endpoint, a.dev.device, 'sticky');
            await a.endpoint.call(
                'cacheEntry',
                { entryKey: entryKeyOf('sticky'), sticky: true },
                a.dev.device,
            );
            const { entries } = (await a.endpoint.call('exportCache', {}, a.dev.device)) as any;
            expect(entries).toHaveLength(1);

            await expect(
                a.endpoint.call('importCache', { entries: ['zz'] }, a.dev.device),
            ).rejects.toMatchObject({ code: 'bad_request' });
            await expect(
                a.endpoint.call('importCache', { entries }, a.dev.device),
            ).resolves.toEqual({ imported: 1, skipped: 0 });
            // a replayed backup of an entry WARD has since deleted is not brought back
            await update(a.endpoint, a.dev.device, 'sticky', { delete: true });
            await expect(
                a.endpoint.call('importCache', { entries }, a.dev.device),
            ).resolves.toEqual({ imported: 0, skipped: 1 });
            const validated: any = await a.endpoint.call('validateCache', {}, a.dev.device);
            expect(validated.cache).toMatchObject({ checked: 1, removed: 1 });
        });

        it('sync still succeeds on firmware without the offline store', async () => {
            const { endpoint, dev } = await setup();
            const device = (message: any) =>
                Promise.resolve(
                    message.name === 'WARDValidateCache'
                        ? {
                              name: 'Failure',
                              message: {
                                  message: 'WARD cache: this firmware has no offline store',
                              },
                          }
                        : dev.device(message),
                );

            const result: any = await endpoint.call('sync', {}, device);

            expect(result).toEqual({ wardId: WARD_ID, counter: 0, root: '' });
        });
    });

    describe('listing', () => {
        it('lets the device walk and verify every stored leaf', async () => {
            const { endpoint, dev } = await setup();
            for (const address of ['alice', 'bob', 'carol']) {
                await update(endpoint, dev.device, address);
            }

            const result = await endpoint.call('listEntries', { appId: 'btc' }, dev.device);

            expect(result).toEqual({
                wardId: WARD_ID,
                shown: 3,
                entries: 3,
                counter: 3,
                complete: true,
            });
            const list = dev.sent.find(m => m.name === 'WARDListEntries');
            expect(list?.message).toMatchObject({ app_id: 'btc' });
        });

        it('lists an empty wallet without pulling a node', async () => {
            const { endpoint, dev } = await setup();

            const result = await endpoint.call('listEntries', {}, dev.device);

            expect(result).toMatchObject({ shown: 0, entries: 0, complete: true });
        });

        it('serves nothing for a hash that is not in the trie', async () => {
            const { endpoint, dev } = await setup();
            await update(endpoint, dev.device, 'alice');

            await expect(
                endpoint.call('answerNodeRequest', { request: { node_hash: '00'.repeat(32) } }),
            ).resolves.toEqual({ nodes: [] });
            await expect(
                endpoint.call('answerNodeRequest', { request: { node_hash: 'zz' } }),
            ).rejects.toMatchObject({ code: 'bad_request' });
        });

        it('needs the device and rejects a malformed filter', async () => {
            const { endpoint, dev } = await setup();

            await expect(endpoint.call('listEntries', {})).rejects.toMatchObject({
                code: 'bad_request',
            });
            await expect(
                endpoint.call('listEntries', { deviceId: 'one' }, dev.device),
            ).rejects.toMatchObject({ code: 'bad_request' });
        });
    });

    describe('optional label freshness', () => {
        const FRESH_NONCE = 'cd'.repeat(32);
        const pull = (endpoint: WardRelayEndpoint, nonce?: string) =>
            endpoint.call('answerProofRequest', {
                request: { entry_key: '00'.repeat(32), freshness_nonce: nonce },
            }) as Promise<Record<string, any>>;

        it('attaches the WM head attested over the device nonce when enabled', async () => {
            const { endpoint, dev } = await setup(new MockWm(), true);
            await endpoint.call('sync', {}, dev.device);

            const { attestation } = await pull(endpoint, FRESH_NONCE);

            expect(attestation).toMatchObject({ counter: 0 });
            expect(attestation.mac).toBeUndefined();
            const time = new Uint8Array(8);
            new DataView(time.buffer).setBigUint64(0, BigInt(attestation.timestamp));
            const signed = concatBytes(
                new TextEncoder().encode('WARD ATTEST v2'),
                Uint8Array.of(2),
                hexToBytes(FRESH_NONCE),
                hexToBytes(WARD_ID),
                new Uint8Array(4),
                new Uint8Array(32),
                time,
                hexToBytes(attestation.head_nonce),
            );
            expect(
                ed25519.verify(
                    hexToBytes(attestation.wm_signature),
                    signed,
                    ed25519.getPublicKey(DEBUG_QM_SEED),
                ),
            ).toBe(true);
        });

        it('does not ask the WM by default, nor without a device nonce', async () => {
            const asked: string[] = [];
            const counting = (enabled: boolean) => {
                const wm = new MockWm();
                const current = wm.current.bind(wm);
                wm.current = (wardId, nonce) => {
                    asked.push(nonce);

                    return current(wardId, nonce);
                };

                return setup(wm, enabled);
            };

            const off = await counting(false);
            await off.endpoint.call('sync', {}, off.dev.device);
            expect((await pull(off.endpoint, FRESH_NONCE)).attestation).toBeUndefined();

            const on = await counting(true);
            await on.endpoint.call('sync', {}, on.dev.device);
            expect((await pull(on.endpoint)).attestation).toBeUndefined();

            // only the two syncs reached the WM
            expect(asked).toEqual([NONCE, NONCE]);
        });

        it('still serves the proof when the WM is unreachable', async () => {
            const wm = new MockWm();
            const { endpoint, dev } = await setup(wm, true);
            await endpoint.call('sync', {}, dev.device);
            wm.current = () => Promise.reject(new Error('WM offline'));

            const ack = await pull(endpoint, FRESH_NONCE);

            expect(ack.attestation).toBeUndefined();
            expect(ack).toEqual({ proof: [] });
        });
    });

    it('runs one conversation at a time across endpoints', async () => {
        const storage = new InMemoryWardDb();
        const wardd = new Wardd({ storage, wm: new MockWm() });
        const order: string[] = [];
        const slow = async (label: string) => {
            const endpoint = await wardd.connect();
            const dev = fakeDevice(() => endpoint);
            const device: RelayDevice = async m => {
                order.push(`${label}:${m.name}`);
                await new Promise(r => setTimeout(r, 1));

                return dev.device(m);
            };

            return endpoint.call('sync', {}, device);
        };

        await Promise.all([slow('a'), slow('b')]);

        // each sync is WARDSync, Ingest, Reconcile and the cache check: never interleaved
        expect(order.slice(0, 5).every(o => o.startsWith('a:'))).toBe(true);
        expect(order.slice(5).every(o => o.startsWith('b:'))).toBe(true);
    });
});
