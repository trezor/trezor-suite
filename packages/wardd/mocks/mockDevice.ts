import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';

import {
    type BlobRow,
    type RelayDevice,
    type RelayMessage,
    type WardRelayEndpoint,
    commitOf,
    computeRootFromBlobs,
    leafFromCommit,
} from '@trezor/ward';

import { readLeafContent, readLeafIdentity } from '../src/proofs';
import { normalizeRoot, transitionMessage } from '../src/transition';

const WALLET_KEY = new Uint8Array(32).fill(18);
export const WARD_ID = bytesToHex(ed25519.getPublicKey(WALLET_KEY));
export const NONCE = 'ab'.repeat(32);
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
export const fakeDevice = (endpoint: () => WardRelayEndpoint, opts: { wardId?: string } = {}) => {
    const sent: RelayMessage[] = [];
    const pulls: Record<string, unknown>[] = [];
    const leaves = new Map<string, BlobRow>();
    const cached = new Set<string>();
    const sticky = new Set<string>();
    let counter = 0;
    let pending: { entryKey: string; body: string; deleting: boolean } | undefined;
    const root = () => normalizeRoot(computeRootFromBlobs([...leaves.values()]));
    const entryKeyOf = (address: string) => utf8Hex(address).padEnd(64, '0').slice(0, 64);
    const pull = async (entryKey: string) => {
        const ack = await endpoint().call('answerProofRequest', {
            request: { entry_key: entryKey },
        });
        pulls.push(ack);
    };

    /**
     * The firmware's verified listing walk (trezor_ward's Walk), pulling through
     * `answerNodeRequest`: entries in key order, each proof completed from the one before (if
     * cut), held against the root, and checked to be the successor.
     */
    const walk = async () => {
        const bit = (key: Uint8Array, i: number) => ((key[i >> 3]! >> (7 - (i & 7))) & 1) === 1;
        type Step = { c: number; sibling: Uint8Array };
        const steps = (proof: string[]): Step[] =>
            proof.map(step => ({ c: hexToBytes(step)[0]!, sibling: hexToBytes(step).slice(1) }));
        const fold = (key: Uint8Array, node: Uint8Array, path: Step[]) =>
            path.reduce((child, { c, sibling }) => {
                const [left, right] = bit(key, c) ? [sibling, child] : [child, sibling];

                return sha256(concatBytes(Uint8Array.of(1, c), left, right));
            }, node);
        // where the next entry parts from `key`: its lowest left turn
        const turn = (key: Uint8Array, path: Step[]) => path.findIndex(({ c }) => !bit(key, c));

        const trusted = root();
        let current: { key: Uint8Array; leaf: Uint8Array; path: Step[] } | undefined;
        let entries = 0;
        const done = () => (current ? turn(current.key, current.path) < 0 : trusted === '');
        while (!done()) {
            const ack = await endpoint().call('answerNodeRequest', {
                request: { after: current ? bytesToHex(current.key) : undefined },
            });
            const served = (ack.entries ?? []) as Record<string, any>[];
            if (served.length === 0) throw new Error('WARD listing: the host returned no entry');
            for (const entry of served) {
                if (done()) throw new Error('WARD listing: entries past the last one');
                const key = hexToBytes(entry.entry_key);
                const identity = readLeafIdentity(entry.identity);
                const content = readLeafContent(entry.content);
                const leaf = leafFromCommit(
                    key,
                    commitOf(identity.keyType, identity.part!, content!),
                );
                let path = steps(entry.proof ?? []);
                let lower = -1;
                if (current) {
                    const at = turn(current.key, current.path);
                    lower = current.path[at]!.c;
                    if (path.every(({ c }) => c > lower)) {
                        // cut: splice onto the current path above the parting branch
                        const left = fold(current.key, current.leaf, current.path.slice(0, at));
                        path = [
                            ...path,
                            { c: lower, sibling: left },
                            ...current.path.slice(at + 1),
                        ];
                    }
                    const parts = [...Array(256).keys()].find(
                        i => bit(key, i) !== bit(current!.key, i),
                    );
                    if (parts !== lower) throw new Error('WARD listing: entry out of order');
                }
                if (bytesToHex(fold(key, leaf, path)) !== trusted)
                    throw new Error('WARD listing: proof does not match the root');
                if (path.some(({ c }) => c > lower && bit(key, c)))
                    throw new Error('WARD listing: entry out of order');
                current = { key, leaf, path };
                entries++;
            }
        }

        return entries;
    };

    const device: RelayDevice = async ({ name, message }) => {
        sent.push({ name, message });
        switch (name) {
            case 'WARDSync':
                return {
                    name: 'WARDSyncAck',
                    message: {
                        nonce: NONCE,
                        version: 1,
                        counter,
                        root_known: true,
                        ward_id: opts.wardId ?? WARD_ID,
                    },
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
            case 'WARDCacheEntry': {
                const entryKey = message.entry_key as string;
                await pull(entryKey);
                if (!leaves.has(entryKey)) {
                    return {
                        name: 'Failure',
                        message: {
                            code: 'Failure_DataError',
                            message: 'WARD entry is not in the trie',
                        },
                    };
                }
                const replaced = cached.has(entryKey);
                cached.add(entryKey);
                if (message.sticky === true) sticky.add(entryKey);

                return { name: 'WARDCacheEntryAck', message: { replaced, counter } };
            }
            case 'WARDValidateCache': {
                const counts = {
                    checked: 0,
                    unchanged: 0,
                    updated: 0,
                    removed: 0,
                };
                for (const entryKey of [...cached]) {
                    await pull(entryKey);
                    counts.checked++;
                    if (leaves.has(entryKey)) counts.unchanged++;
                    else {
                        // removed when WARD proves it absent, sticky or not
                        cached.delete(entryKey);
                        counts.removed++;
                    }
                }

                return { name: 'WARDValidateCacheAck', message: { ...counts, counter } };
            }
            case 'WARDCacheExport':
                return {
                    name: 'WARDCacheExportAck',
                    message: { entries: [...cached].map(k => `5e${k}`) },
                };
            case 'WARDCacheImport': {
                // every entry checked against the trie: only what WARD still holds is stored
                let imported = 0;
                for (const blob of message.entries as string[]) {
                    const entryKey = blob.slice(2);
                    await pull(entryKey);
                    if (leaves.has(entryKey)) {
                        cached.add(entryKey);
                        imported++;
                    }
                }

                return {
                    name: 'WARDCacheImportAck',
                    message: {
                        imported,
                        skipped: (message.entries as string[]).length - imported,
                    },
                };
            }
            case 'WARDListEntries': {
                const entries = await walk();

                return {
                    name: 'WARDListEntriesAck',
                    message: { shown: entries, entries, counter, complete: true },
                };
            }
            case 'WARDListPendingEdits':
                return {
                    name: 'WARDListPendingEditsAck',
                    message: { pending_ids: pending ? [7] : [] },
                };
            case 'WARDQueueUpdate': {
                const address = new TextDecoder().decode(hexToBytes(message.address as string));
                pending = {
                    entryKey: entryKeyOf(address),
                    body: message.new_value as string,
                    deleting: message.delete === true,
                };

                return { name: 'WARDQueueUpdateAck', message: { pending_id: 7 } };
            }
            case 'WARDPerformBatch': {
                await pull(pending!.entryKey);
                const next = new Map(leaves);
                if (pending!.deleting) next.delete(pending!.entryKey);
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
                    name: 'WARDPerformBatchAck',
                    message: {
                        counter: counter + 1,
                        ward_id: WARD_ID,
                        from_root: root(),
                        new_root: nextRoot || undefined,
                        mac: 'aa'.repeat(32),
                        auth_commit: '77'.repeat(32),
                        head_mac: '88'.repeat(32),
                        sig_commit: bytesToHex(
                            ed25519.sign(
                                transitionMessage({
                                    wardId: WARD_ID,
                                    fromCounter: counter,
                                    fromRoot: root(),
                                    counter: counter + 1,
                                    root: nextRoot,
                                    mac: 'aa'.repeat(32),
                                    authCommit: '77'.repeat(32),
                                    signature: '',
                                    kind: 'commit',
                                }),
                                WALLET_KEY,
                            ),
                        ),
                        leaves: [
                            {
                                entry_key: pending!.entryKey,
                                ...(pending!.deleting ? {} : wireLeaf(pending!.body)),
                            },
                        ],
                    },
                };
            }
            case 'WARDConfirmBatchByWM': {
                counter = message.counter as number;
                if (pending!.deleting) leaves.delete(pending!.entryKey);
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
                    name: 'WARDConfirmBatchByWMAck',
                    message: {
                        counter,
                        ...(root() && { new_root: root() }),
                        root_mac: 'aa'.repeat(32),
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
