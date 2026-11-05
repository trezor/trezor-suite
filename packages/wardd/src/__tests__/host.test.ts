import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';

import {
    type BlobRow,
    InMemoryWardDb,
    type RelayDevice,
    type RelayMessage,
    type WardRelayEndpoint,
    computeRootFromBlobs,
} from '@trezor/ward';
import { DEBUG_QM_SEED } from '@trezor/ward/src/mocks';

import { Wardd } from '../service';
import { MockWm, type WmClient, WmConflict } from '../wm';

const WARD_ID = 'cd'.repeat(32);
const NONCE = 'ab'.repeat(32);
const utf8Hex = (s: string) => bytesToHex(new TextEncoder().encode(s));

const part = (body: string) => ({
    encoding: 0,
    nonceHex: '01'.repeat(12),
    tagHex: '02'.repeat(16),
    bodyHex: body,
});
const wireLeaf = (body: string) => ({
    content: { encoding: 0, encrypted: { nonce: '01'.repeat(12), tag: '02'.repeat(16), ct: body } },
    identity: {
        encoding: 0,
        key_type: 'address',
        encrypted: { nonce: '01'.repeat(12), tag: '02'.repeat(16), ct: 'ee' },
    },
});

/**
 * A scripted device for one endpoint. It keeps the leaves it "sealed", so the roots it reports
 * are the ones wardd's stored leaves rebuild to, and it pulls a proof through `answerProofRequest` exactly
 * where the firmware does -- inside WARDLookup and WARDPerformUpdate -- the way an adapter answers
 * the pull without returning it to the conversation.
 */
const fakeDevice = (endpoint: () => WardRelayEndpoint, opts: { wardId?: string } = {}) => {
    const sent: RelayMessage[] = [];
    const pulls: Record<string, unknown>[] = [];
    const leaves = new Map<string, BlobRow>();
    let counter = 0;
    let pending: { entryKey: string; body: string } | undefined;
    const root = () => computeRootFromBlobs([...leaves.values()]);
    const entryKeyOf = (address: string) => utf8Hex(address).padEnd(64, '0').slice(0, 64);
    const pull = async (entryKey: string) => {
        const ack = await endpoint().call('answerProofRequest', {
            request: { entry_key: entryKey },
        });
        pulls.push(ack);
    };

    const device: RelayDevice = async ({ name, message }) => {
        sent.push({ name, message });
        switch (name) {
            case 'WARDSync':
                return {
                    name: 'WARDSyncAck',
                    message: { nonce: NONCE, version: 1, ward_id: opts.wardId ?? WARD_ID },
                };
            case 'WARDIngestAttestation':
                return { name: 'WARDIngestAttestationAck', message: { counter: message.counter } };
            case 'WARDReconcile':
                return {
                    name: 'WARDReconcileAck',
                    message: { counter, ...(root() && { new_root: root() }) },
                };
            case 'WARDLookup': {
                const address = new TextDecoder().decode(hexToBytes(message.address as string));
                await pull(entryKeyOf(address));
                const membership = leaves.has(entryKeyOf(address));

                return {
                    name: 'WARDLookupAck',
                    message: { valid: true, counter, membership, ward_id: WARD_ID },
                };
            }
            case 'WARDQueueUpdate': {
                const address = new TextDecoder().decode(hexToBytes(message.address as string));
                pending = { entryKey: entryKeyOf(address), body: message.new_value as string };

                return { name: 'WARDQueueUpdateAck', message: { pending_id: 7 } };
            }
            case 'WARDPerformUpdate': {
                await pull(pending!.entryKey);
                const next = new Map(leaves);
                if (pending!.body === '') next.delete(pending!.entryKey);
                else {
                    next.set(pending!.entryKey, {
                        entryKeyHex: pending!.entryKey,
                        keyType: 'address',
                        identity: part('ee'),
                        content: part(pending!.body),
                    });
                }
                const nextRoot = computeRootFromBlobs([...next.values()]);

                return {
                    name: 'WARDPerformUpdateAck',
                    message: {
                        counter: counter + 1,
                        ward_id: WARD_ID,
                        entry_key: pending!.entryKey,
                        ...(nextRoot && { new_root: nextRoot, mac: 'aa'.repeat(32) }),
                        ...(pending!.body === '' ? {} : wireLeaf(pending!.body)),
                    },
                };
            }
            case 'WARDConfirmedByWM': {
                counter = message.counter as number;
                if (pending!.body === '') leaves.delete(pending!.entryKey);
                else {
                    leaves.set(pending!.entryKey, {
                        entryKeyHex: pending!.entryKey,
                        keyType: 'address',
                        identity: part('ee'),
                        content: part(pending!.body),
                    });
                }
                pending = undefined;

                return {
                    name: 'WARDConfirmedByWMAck',
                    message: {
                        counter,
                        ...(root() && { new_root: root(), root_mac: 'bb'.repeat(32) }),
                    },
                };
            }
            case 'WARDDiscardPending':
                pending = undefined;

                return { name: 'WARDDiscardPendingAck', message: {} };
            default:
                return { name: 'Failure', message: { code: 1, message: `unexpected ${name}` } };
        }
    };

    return { device, sent, pulls, names: () => sent.map(m => m.name) };
};

const setup = async (wm: WmClient = new MockWm()) => {
    const storage = new InMemoryWardDb();
    const wardd = new Wardd({ storage, wm });
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

        expect(result).toEqual({ wardId: WARD_ID, counter: 0, root: '' });
        expect(dev.names()).toEqual(['WARDSync', 'WARDIngestAttestation', 'WARDReconcile']);
        const ingest = dev.sent[1]!.message;
        expect(ingest.mac).toBeUndefined();
        // the debug WM's signature over the device's own nonce and ward_id
        const signed = concatBytes(
            new TextEncoder().encode('WARD ATTEST v1'),
            Uint8Array.of(1),
            hexToBytes(NONCE),
            hexToBytes(WARD_ID),
            new Uint8Array(4),
            new Uint8Array(32),
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
            'WARDPerformUpdate',
            'WARDConfirmedByWM',
        ]);
        // empty tree: the INIT answer
        expect(dev.pulls).toEqual([{ proof: [] }]);
        expect(dev.sent[3]!.message).toMatchObject({
            address: utf8Hex('bc1qfirst'),
            app_id: 'btc',
        });
        expect(dev.sent[5]!.message).toMatchObject({ counter: 1, pending_id: 7 });

        const second = await update(endpoint, dev.device, 'bc1qsecond');
        expect(second).toMatchObject({ counter: 2 });
        // non-empty tree, absent key: a non-membership witness
        expect(dev.pulls[1]).toHaveProperty('witness_entry_key');
        expect(dev.pulls[1]).toHaveProperty('witness_commit');

        const tree = storage.getTreeState(WARD_ID)!;
        expect(tree.counter).toBe(2);
        expect(storage.getAllEntries(WARD_ID)).toHaveLength(2);
        expect(storage.getTransitions(WARD_ID).map(t => t.counter)).toEqual([1, 2]);
        // the stored leaves rebuild to the root the device installed
        expect(second.root).toBe(tree.root);
    });

    it('looks up a stored entry: membership proven on the device, label returned', async () => {
        const { endpoint, dev } = await setup();
        await update(endpoint, dev.device, 'bc1qfirst');

        const found = await endpoint.call(
            'lookup',
            { appId: 'btc', address: 'bc1qfirst', networkSymbol: 'btc' },
            dev.device,
        );
        expect(found).toMatchObject({
            valid: true,
            isMember: true,
            metadata: { label: 'bc1qfirst' },
        });
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

    it('refuses to delete an entry it does not hold', async () => {
        const { endpoint, dev } = await setup();

        await expect(
            update(endpoint, dev.device, 'bc1qnone', { delete: true }),
        ).rejects.toMatchObject({
            code: 'bad_request',
        });
    });

    it('discards the candidate when the WM head moved on', async () => {
        const wm: WmClient = {
            attest: new MockWm().attest,
            commit: () => Promise.reject(new WmConflict(5)),
        };
        const { storage, endpoint, dev } = await setup(wm);

        const result = await update(endpoint, dev.device, 'bc1qfirst');

        expect(result).toMatchObject({ conflict: true, counter: 5 });
        expect(dev.names().at(-1)).toBe('WARDDiscardPending');
        expect(dev.sent.at(-1)!.message).toEqual({ pending_id: 7 });
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

        expect(order.slice(0, 3).every(o => o.startsWith('a:'))).toBe(true);
        expect(order.slice(3).every(o => o.startsWith('b:'))).toBe(true);
    });
});
