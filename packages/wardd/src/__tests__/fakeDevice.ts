/**
 * A FAKE DEVICE: just enough of the firmware's host-facing rules to drive every wardd conversation
 * without an emulator. It is strict where wardd could get things wrong -- it verifies the WM's
 * attestation, every link's auth_commit, every proof against its running root -- and models
 * nothing a host cannot see (screens, sealing, storage).
 *
 * A request that pulls starts a WORKFLOW, a generator that yields what the device sends and
 * receives the host's answer, as the firmware's workflows await pulls; the rest answer outright.
 * A thrown error is a `Failure`.
 */
import { ed25519 } from '@noble/curves/ed25519.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes } from '@noble/hashes/utils.js';

import {
    DevWm,
    EMPTY_ROOT,
    MAX_BATCH,
    NO_HEAD_NONCE,
    type RelayMessage,
    TAG_COMMIT,
    TAG_REVERT,
    TAG_WM_HEAD,
    TAG_WM_INIT,
    type WardLeaf,
    type WardPart,
    attestationPreimage,
    commitOf,
    deleteRoot,
    equalBytes,
    insertRoot,
    toBytes,
    toHex,
    transitionPreimage,
    updateRoot,
    wmPreimage,
} from '@trezor/ward-core';

type Json = Record<string, any>;
type Workflow = Generator<RelayMessage, RelayMessage, RelayMessage>;
interface Head {
    counter: number;
    root: Uint8Array;
}

const same = (a: Head, b: Head) => a.counter === b.counter && equalBytes(a.root, b.root);
const wireRoot = (key: string, r: Uint8Array): Json =>
    equalBytes(r, EMPTY_ROOT) ? {} : { [key]: toHex(r) };
const fromWire = (v: string | undefined | null) => (v ? toBytes(v) : EMPTY_ROOT);
const msg = (name: string, message: Json = {}): RelayMessage => ({ name, message });

/**
 * A SEALED part, as a real device builds every leaf (encoding 0). The fake does not encrypt -- the
 * host never opens a part, so only the framing matters -- but the shape is the real one, which is
 * what a codec in between gets to mangle.
 */
const sealed = (bytes: Uint8Array, keyType?: string): WardPart => ({
    encoding: 0,
    ...(keyType ? { key_type: keyType } : {}),
    encrypted: { nonce: toHex(randomBytes(12)), tag: toHex(randomBytes(16)), ct: toHex(bytes) },
});

export interface WalletKeys {
    kAuth: Uint8Array;
    kSig: Uint8Array;
}

export const newWallet = (): WalletKeys => ({ kAuth: randomBytes(32), kSig: randomBytes(32) });

export class FakeDevice {
    readonly wardId: Uint8Array;
    head: Head = { counter: 0, root: EMPTY_ROOT };
    online = false;
    queue: { entryKey: Uint8Array; leaf: WardLeaf | null }[] = [];
    private headNonce: Uint8Array = NO_HEAD_NONCE;
    private nonce: Uint8Array | null = null;
    private att: (Json & { from: Head; to: Head }) | null = null;
    private inflight: { to: Head; count: number } | null = null;
    private wf: Workflow | null = null;
    private readonly wmPubkey = new DevWm().pubkey;

    constructor(private readonly keys: WalletKeys = newWallet()) {
        this.wardId = ed25519.getPublicKey(keys.kSig);
    }

    /** Queue a change offline. `value` null is a deletion. */
    enqueue(identifier: string, value: string | null) {
        const id = new TextEncoder().encode(identifier);
        this.queue.push({
            entryKey: sha256(id),
            leaf:
                value === null
                    ? null
                    : {
                          identity: sealed(id, 'address'),
                          content: sealed(new TextEncoder().encode(value)),
                      },
        });
    }

    readonly call = (m: RelayMessage): Promise<RelayMessage> => {
        try {
            let r: IteratorResult<RelayMessage, RelayMessage>;
            if (this.wf) {
                r = this.wf.next(m);
            } else {
                const start = (
                    this as unknown as Record<string, (b: Json) => Workflow | RelayMessage>
                )[`on${m.name}`];
                if (!start) throw new Error(`unexpected ${m.name}`);
                const out = start.call(this, m.message as Json);
                // a one-step request answers outright; a workflow is resumed on each reply
                if (!('next' in out)) return Promise.resolve(out);
                this.wf = out;
                r = this.wf.next(undefined as unknown as RelayMessage);
            }
            if (r.done) this.wf = null;

            return Promise.resolve(r.value);
        } catch (e) {
            this.wf = null;

            return Promise.resolve(msg('Failure', { message: (e as Error).message }));
        }
    };

    private authCommit(from: Head, to: Head, tag = TAG_COMMIT) {
        return hmac(
            sha256,
            this.keys.kAuth,
            transitionPreimage(tag, this.wardId, from.counter, from.root, to.counter, to.root),
        );
    }

    private checkLink(from: Head, to: Head, ac: Uint8Array) {
        if (
            !equalBytes(ac, this.authCommit(from, to)) &&
            !equalBytes(ac, this.authCommit(from, to, TAG_REVERT))
        ) {
            throw new Error('link is not authorised by this wallet');
        }
    }

    private adopt(to: Head) {
        this.head = to;
        this.headNonce = toBytes(this.att!.to_head_nonce);
        this.online = true;
        // the in-flight change took effect only if THIS head is the one it made
        if (this.inflight && same(this.inflight.to, to)) this.queue.splice(0, this.inflight.count);
        this.inflight = null;
        this.att = null;
    }

    /** Walk back from `start` to `stop`'s counter through host-served links; returns where it lands. */
    private *walk(start: Head, stopCounter: number): Generator<RelayMessage, Head, RelayMessage> {
        let cursor = start;
        while (cursor.counter > stopCounter) {
            const reply = yield msg('WardChainRequest', {
                to_counter: cursor.counter,
                ...wireRoot('to_root', cursor.root),
            });
            const links = ((reply.message as Json).links ?? []) as Json[];
            if (!links.length) throw new Error('the host has no link into this state');
            for (const l of links) {
                const to = { counter: l.to_counter, root: fromWire(l.to_root) };
                const from = { counter: l.from_counter, root: fromWire(l.from_root) };
                if (!same(to, cursor)) throw new Error('link does not end where the walk is');
                this.checkLink(from, to, toBytes(l.auth_commit));
                cursor = from;
                if (cursor.counter <= stopCounter) break;
            }
        }

        return cursor;
    }

    onWardSync(): RelayMessage {
        this.nonce = randomBytes(32);
        const { counter, root } = this.head;

        return msg('WardSyncAck', {
            nonce: toHex(this.nonce),
            ward_id: toHex(this.wardId),
            counter,
            // as the firmware: the root only at genesis (apps/ward/sync.py)
            ...(counter === 0 ? wireRoot('root', root) : {}),
            head_init_sig: toHex(
                ed25519.sign(
                    wmPreimage(
                        TAG_WM_INIT,
                        this.wardId,
                        counter,
                        root,
                        counter,
                        root,
                        NO_HEAD_NONCE,
                    ),
                    this.keys.kSig,
                ),
            ),
        });
    }

    onWardIngestAttestation(m: Json): RelayMessage {
        if (!this.nonce) throw new Error('no sync round is open');
        const body = {
            fromCounter: m.from_counter,
            fromRoot: fromWire(m.from_root),
            fromHeadNonce: toBytes(m.from_head_nonce),
            toCounter: m.to_counter,
            toRoot: fromWire(m.to_root),
            toHeadNonce: toBytes(m.to_head_nonce),
            timestamp: m.timestamp ?? 0,
        };
        const preimage = attestationPreimage(this.nonce, this.wardId, body);
        if (!ed25519.verify(toBytes(m.wm_signature), preimage, this.wmPubkey)) {
            throw new Error('attestation does not verify');
        }
        this.nonce = null;
        this.att = {
            ...m,
            from: { counter: body.fromCounter, root: body.fromRoot },
            to: { counter: body.toCounter, root: body.toRoot },
        };

        return msg('WardIngestAttestationAck', { counter: this.head.counter });
    }

    onWardReconcile(m: Json): RelayMessage {
        const { att } = this;
        if (!att) throw new Error('no attestation');
        if (att.to.counter !== 0) {
            if (!m.auth_commit) throw new Error('reconcile needs the link into the head');
            this.checkLink(att.from, att.to, toBytes(m.auth_commit));
        }
        if (!same(this.head, att.to) && !same(this.head, att.from)) {
            throw new Error('reconcile moves one step only');
        }
        this.adopt(att.to);

        return msg('WardReconcileAck', {
            counter: this.head.counter,
            ...wireRoot('new_root', this.head.root),
        });
    }

    *onWardVerifyChain(): Workflow {
        const { att } = this;
        if (!att) throw new Error('no attestation');
        const landed = yield* this.walk(att.to, this.head.counter);
        if (!same(landed, this.head)) throw new Error('the attested head does not descend');
        this.adopt(att.to);

        return msg('WardVerifyChainAck', {
            counter: this.head.counter,
            ...wireRoot('new_root', this.head.root),
            reverts_crossed: 0,
        });
    }

    *onWardRejoin(m: Json): Workflow {
        const { att } = this;
        if (!att) throw new Error('no attestation');
        const fork = m.fork_counter as number;
        const theirs = yield* this.walk(att.to, fork);
        const mine = yield* this.walk(this.head, fork);
        if (theirs.counter !== fork || !same(theirs, mine)) {
            throw new Error('the branches do not meet at the fork');
        }
        const discarded = this.head.counter - fork;
        this.adopt(att.to);

        return msg('WardRejoinAck', {
            counter: this.head.counter,
            ...wireRoot('new_root', this.head.root),
            discarded,
            reverts_crossed: 0,
        });
    }

    *onWardFlushQueue(m: Json): Workflow {
        if (!this.online) throw new Error('flush needs a synced session');
        const batched = (m.max_batch ?? 1) > 1;
        const n = Math.min(m.max_batch ?? 1, MAX_BATCH, this.queue.length);
        if (!n) return msg('WardFlushQueueAck', { remaining: 0 });

        let { root } = this.head;
        let staged: Json | undefined;
        const leaves: Json[] = [];
        for (const change of this.queue.slice(0, n)) {
            const reply = yield msg('WardEntryRequest', {
                entry_key: toHex(change.entryKey),
                ...(staged ? { staged } : {}),
            });
            const ans = reply.message as Json;
            const proof = ((ans.proof ?? []) as string[]).map(toBytes);
            const present = !!(ans.identity || ans.content);
            const oldCommit = present ? commitOf('address', ans.identity, ans.content) : null;
            const newCommit = change.leaf
                ? commitOf('address', change.leaf.identity, change.leaf.content)
                : null;
            if (present && newCommit) {
                root = updateRoot(change.entryKey, oldCommit!, newCommit, proof, root);
            } else if (present) {
                if (batched) throw new Error('the fake does not stage deletions');
                root = deleteRoot(change.entryKey, oldCommit!, proof, root);
            } else if (newCommit) {
                root = insertRoot(
                    change.entryKey,
                    newCommit,
                    proof,
                    root,
                    ans.witness_entry_key ? toBytes(ans.witness_entry_key) : null,
                    ans.witness_commit ? toBytes(ans.witness_commit) : null,
                );
            } else {
                throw new Error('the fake does not model deleting an absent entry');
            }
            staged = newCommit
                ? { entry_key: toHex(change.entryKey), commit: toHex(newCommit) }
                : undefined;
            leaves.push({
                entry_key: toHex(change.entryKey),
                identity: change.leaf?.identity ?? null,
                ...(change.leaf ? { content: change.leaf.content } : {}),
            });
        }

        const to = { counter: this.head.counter + n, root };
        this.inflight = { to, count: n };
        const authorisation = {
            counter: to.counter,
            auth_commit: toHex(this.authCommit(this.head, to)),
            wm_sig: toHex(
                ed25519.sign(
                    wmPreimage(
                        TAG_WM_HEAD,
                        this.wardId,
                        this.head.counter,
                        this.head.root,
                        to.counter,
                        to.root,
                        this.headNonce,
                    ),
                    this.keys.kSig,
                ),
            ),
            remaining: this.queue.length - n,
        };

        return msg(
            'WardFlushQueueAck',
            batched
                ? { ...authorisation, from_counter: this.head.counter, leaves }
                : { ...leaves[0], ...authorisation },
        );
    }

    // --- THE SERVICE BUILD: the device asks a daemon, and checks what comes back ----------------

    private serviceNonce: Uint8Array | null = null;
    private servicePending: { to: Head; nonce: Uint8Array } | null = null;

    /** WardSyncRequest: this device's head, a fresh nonce, the opening-head authorisation. */
    serviceSyncRequest(): RelayMessage {
        this.serviceNonce = randomBytes(32);
        const { counter, root } = this.head;

        return msg('WardSyncRequest', {
            nonce: toHex(this.serviceNonce),
            ward_id: toHex(this.wardId),
            current_counter: counter,
            ...wireRoot('current_root', root),
            head_init_sig: toHex(
                ed25519.sign(
                    wmPreimage(
                        TAG_WM_INIT,
                        this.wardId,
                        counter,
                        root,
                        counter,
                        root,
                        NO_HEAD_NONCE,
                    ),
                    this.keys.kSig,
                ),
            ),
        });
    }

    private verifyAttestation(nonce: Uint8Array, m: Json, from: Head, to: Head) {
        const body = {
            fromCounter: from.counter,
            fromRoot: from.root,
            fromHeadNonce: toBytes(m.from_head_nonce),
            toCounter: to.counter,
            toRoot: to.root,
            toHeadNonce: toBytes(m.to_head_nonce),
            timestamp: m.timestamp ?? 0,
        };
        if (
            !ed25519.verify(
                toBytes(m.wm_signature),
                attestationPreimage(nonce, this.wardId, body),
                this.wmPubkey,
            )
        ) {
            throw new Error('attestation does not verify');
        }
    }

    /** WardSyncResponse: verify the step, walk the links forward from this head, adopt. */
    onServiceSyncResponse(m: Json) {
        if (!this.serviceNonce) throw new Error('no sync round is open');
        const from = { counter: m.from_counter ?? 0, root: fromWire(m.from_root) };
        const to = { counter: m.to_counter ?? 0, root: fromWire(m.to_root) };
        this.verifyAttestation(this.serviceNonce, m, from, to);
        this.serviceNonce = null;
        let cursor = this.head;
        for (const l of (m.links ?? []) as Json[]) {
            const lf = { counter: l.from_counter, root: fromWire(l.from_root) };
            const lt = { counter: l.to_counter, root: fromWire(l.to_root) };
            if (!same(lf, cursor)) continue;
            this.checkLink(lf, lt, toBytes(l.auth_commit));
            cursor = lt;
        }
        if (!same(cursor, to)) throw new Error('the links do not reach the attested head');
        this.head = to;
        this.headNonce = toBytes(m.to_head_nonce);
        this.online = true;
    }

    /** WardServiceFetch for the next queued change, from this device's head. */
    serviceFetchRequest(): RelayMessage {
        const change = this.queue[0];
        if (!change) throw new Error('nothing queued');

        return msg('WardServiceFetch', {
            entry_key: toHex(change.entryKey),
            current_counter: this.head.counter,
            ...wireRoot('current_root', this.head.root),
        });
    }

    /** WardPublish for the next queued change, proved with the fetched leaf. */
    servicePublishRequest(fetched: Json): RelayMessage {
        const change = this.queue[0]!;
        const proof = ((fetched.proof ?? []) as string[]).map(toBytes);
        const present = !!(fetched.identity || fetched.content);
        const oldCommit = present ? commitOf('address', fetched.identity, fetched.content) : null;
        const newCommit = change.leaf
            ? commitOf('address', change.leaf.identity, change.leaf.content)
            : null;
        let root: Uint8Array;
        if (present && newCommit)
            root = updateRoot(change.entryKey, oldCommit!, newCommit, proof, this.head.root);
        else if (present) root = deleteRoot(change.entryKey, oldCommit!, proof, this.head.root);
        else if (newCommit) {
            root = insertRoot(
                change.entryKey,
                newCommit,
                proof,
                this.head.root,
                fetched.witness_entry_key ? toBytes(fetched.witness_entry_key) : null,
                fetched.witness_commit ? toBytes(fetched.witness_commit) : null,
            );
        } else throw new Error('the fake does not model deleting an absent entry');
        const to = { counter: this.head.counter + 1, root };
        const nonce = randomBytes(32);
        this.servicePending = { to, nonce };

        return msg('WardPublish', {
            entry_key: toHex(change.entryKey),
            ...(change.leaf
                ? { identity: change.leaf.identity, content: change.leaf.content }
                : {}),
            counter: to.counter,
            auth_commit: toHex(this.authCommit(this.head, to)),
            wm_sig: toHex(
                ed25519.sign(
                    wmPreimage(
                        TAG_WM_HEAD,
                        this.wardId,
                        this.head.counter,
                        this.head.root,
                        to.counter,
                        to.root,
                        this.headNonce,
                    ),
                    this.keys.kSig,
                ),
            ),
            nonce: toHex(nonce),
            ...wireRoot('from_root', this.head.root),
            ...wireRoot('new_root', to.root),
        });
    }

    /** WardPublishAck: the WM attests THIS step, bound to the publish nonce -- then it is adopted. */
    onServicePublishAck(m: Json) {
        const pending = this.servicePending;
        if (!pending) throw new Error('no publish in flight');
        this.verifyAttestation(pending.nonce, m, this.head, pending.to);
        if (!equalBytes(toBytes(m.from_head_nonce), this.headNonce)) {
            throw new Error('the attested step consumed another head nonce');
        }
        this.head = pending.to;
        this.headNonce = toBytes(m.to_head_nonce);
        this.queue.shift();
        this.servicePending = null;
    }
}
