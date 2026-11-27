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
    type RelayMessage,
    TAG_COMMIT,
    TAG_REVERT,
    TAG_STEP,
    TAG_WM_HEAD,
    TAG_WM_INIT,
    TAG_WM_REVERT,
    type WardLeaf,
    attestationPreimage,
    concatBytes,
    deleteRoot,
    equalBytes,
    insertRoot,
    sessionOpenPreimage,
    toBytes,
    toHex,
    transitionPreimage,
    updateRoot,
    valueDigest,
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
 * A SEALED part, as a real device builds every leaf: 0x01 || nonce || tag || ct, hex. The fake
 * does not encrypt -- the host never opens a part, so only the framing matters.
 */
const sealed = (bytes: Uint8Array): string =>
    toHex(new Uint8Array([0x01, ...randomBytes(12), ...randomBytes(16), ...bytes]));

export interface WalletKeys {
    kAuth: Uint8Array;
    kSig: Uint8Array;
}

export const newWallet = (): WalletKeys => ({ kAuth: randomBytes(32), kSig: randomBytes(32) });

export class FakeDevice {
    readonly wardId: Uint8Array;
    head: Head = { counter: 0, root: EMPTY_ROOT };
    online = false;
    /** without a WM: whether a catch-up has stored a head yet (genesis included), as writes need */
    stored = false;
    /** the WM's timestamp for `head`, as the firmware persists it beside the head */
    headTime: number | null = null;
    /** the head `WardCatchUp` reached, for this session only; never `head` */
    provisional: (Head & { timestamp: number }) | null = null;
    queue: { entryKey: Uint8Array; leaf: WardLeaf | null }[] = [];
    private nonce: Uint8Array | null = null;
    /** the round nonce of the latest attestation this device verified: its WM session */
    private session: Uint8Array | null = null;
    /** a restored WM detected by ingest in the round `nonce`; the roll-forward stands at `cursor` */
    private rolling: { nonce: Uint8Array; cursor: Head } | null = null;
    private att: (Json & { from: Head; to: Head }) | null = null;
    private inflight: { to: Head; count: number } | null = null;
    private wf: Workflow | null = null;
    private readonly wmPubkey = new DevWm().pubkey;

    constructor(
        private readonly keys: WalletKeys = newWallet(),
        /** `wm: false` is a firmware built without a WM (the MVP): catch-up needs no attestation and persists */
        private readonly opts: { wm?: boolean } = {},
    ) {
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
                          identity: sealed(id),
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

    /** The WM authorisation, bound to this device's session: the nonce of its latest sync. */
    private wmSig(from: Head, to: Head, tag = TAG_WM_HEAD) {
        if (!this.session) throw new Error('WARD: no WM session; sync first');

        return ed25519.sign(
            concatBytes(
                transitionPreimage(tag, this.wardId, from.counter, from.root, to.counter, to.root),
                this.session,
            ),
            this.keys.kSig,
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
        this.headTime = this.att!.timestamp ?? 0;
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

    private sessionProof(challenge: string, nonce: Uint8Array) {
        return toHex(
            ed25519.sign(
                sessionOpenPreimage(this.wardId, toBytes(challenge), nonce),
                this.keys.kSig,
            ),
        );
    }

    onWardSync(m: Json = {}): RelayMessage {
        if (this.opts.wm === false) {
            throw new Error('WARD: this firmware has no WARD Manager; catch up with WardCatchUp');
        }
        this.nonce = randomBytes(32);
        const { counter, root } = this.head;

        return msg('WardSyncAck', {
            nonce: toHex(this.nonce),
            ...(m.wm_challenge
                ? { session_proof: this.sessionProof(m.wm_challenge, this.nonce) }
                : {}),
            ward_id: toHex(this.wardId),
            counter,
            // as the firmware: the root only at genesis (apps/ward/sync.py)
            ...(counter === 0 ? wireRoot('root', root) : {}),
            head_init_sig: toHex(
                ed25519.sign(
                    transitionPreimage(TAG_WM_INIT, this.wardId, counter, root, counter, root),
                    this.keys.kSig,
                ),
            ),
        });
    }

    /**
     * WardRollForward, as `apps/ward/roll_forward.py`: verify the WM's live attestation against the
     * open round (which stays open, and becomes the session), then sign each accepted transition
     * again for it -- after checking the chain from the attested head, this wallet's own
     * `auth_commit`, the WM's record of exactly that step, and agreement with the stored head.
     */
    onWardRollForward(m: Json): RelayMessage {
        if (this.opts.wm === false) {
            throw new Error('WARD: this firmware has no WARD Manager to roll forward');
        }
        if (!this.nonce) throw new Error('no sync round is open');
        if (!this.rolling || !equalBytes(this.rolling.nonce, this.nonce)) {
            throw new Error('WARD: no restored WM detected in this round; sync first');
        }
        const links = (m.links ?? []) as Json[];
        if (!links.length) throw new Error('WARD: no transitions to roll forward');
        if (links.length > 16) throw new Error('WARD: too many transitions in one roll-forward');
        const body = {
            fromCounter: m.from_counter,
            fromRoot: fromWire(m.from_root),
            toCounter: m.to_counter,
            toRoot: fromWire(m.to_root),
            timestamp: m.timestamp ?? 0,
        };
        const live = attestationPreimage(this.nonce, this.wardId, body);
        if (!ed25519.verify(toBytes(m.wm_signature), live, this.wmPubkey)) {
            throw new Error('attestation does not verify');
        }
        this.session = this.nonce;
        let cursor: Head = { counter: body.toCounter, root: body.toRoot };
        if (!same(cursor, this.rolling.cursor)) {
            throw new Error('WARD: the WM head is not where the roll-forward stands');
        }
        const sigs: string[] = [];
        let lastTimestamp = 0;
        for (const l of links) {
            const from: Head = { counter: l.from_counter, root: fromWire(l.from_root) };
            const to: Head = { counter: l.to_counter, root: fromWire(l.to_root) };
            if (!same(from, cursor)) throw new Error('WARD: chain link does not follow the head');
            const span = to.counter - from.counter;
            if (!(span >= 1 && span <= MAX_BATCH)) {
                throw new Error('WARD: chain link must advance the counter by 1 to MAX_BATCH');
            }
            const ac = toBytes(l.auth_commit);
            const revert = equalBytes(ac, this.authCommit(from, to, TAG_REVERT));
            if (!revert && !equalBytes(ac, this.authCommit(from, to))) {
                throw new Error('link is not authorised by this wallet');
            }
            const a = l.acceptance as Json | undefined;
            const record = a && {
                fromCounter: from.counter,
                fromRoot: from.root,
                toCounter: to.counter,
                toRoot: to.root,
                timestamp: a.timestamp ?? 0,
            };
            if (
                !a?.nonce ||
                !a.wm_signature ||
                a.timestamp === undefined ||
                !ed25519.verify(
                    toBytes(a.wm_signature),
                    attestationPreimage(toBytes(a.nonce), this.wardId, record!),
                    this.wmPubkey,
                )
            ) {
                throw new Error('WARD: no WM record that this transition was accepted');
            }
            const stored = this.head;
            if (
                (from.counter < stored.counter && stored.counter < to.counter) ||
                (from.counter === stored.counter && !equalBytes(from.root, stored.root)) ||
                (to.counter === stored.counter && !equalBytes(to.root, stored.root))
            ) {
                throw new Error("WARD: the transitions are not on this device's history");
            }
            sigs.push(toHex(this.wmSig(from, to, revert ? TAG_WM_REVERT : TAG_WM_HEAD)));
            cursor = to;
            lastTimestamp = a.timestamp;
        }
        // approval is implicit here; the firmware asks on the first page
        this.rolling = m.final ? null : { nonce: this.nonce, cursor };

        return msg('WardRollForwardAck', { wm_sigs: sigs, last_timestamp: lastTimestamp });
    }

    onWardIngestAttestation(m: Json): RelayMessage {
        if (!this.nonce) throw new Error('no sync round is open');
        const body = {
            fromCounter: m.from_counter,
            fromRoot: fromWire(m.from_root),
            toCounter: m.to_counter,
            toRoot: fromWire(m.to_root),
            timestamp: m.timestamp ?? 0,
        };
        const preimage = attestationPreimage(this.nonce, this.wardId, body);
        if (!ed25519.verify(toBytes(m.wm_signature), preimage, this.wmPubkey)) {
            throw new Error('attestation does not verify');
        }
        this.session = this.nonce;
        // A HEAD BELOW THIS DEVICE'S: the WM's register went back. Not adopted, not refused: the
        // round stays open for WardRollForward, as `apps/ward/ingest.py`.
        if (body.toCounter < this.head.counter) {
            this.rolling = {
                nonce: this.nonce,
                cursor: { counter: body.toCounter, root: body.toRoot },
            };
            this.att = null;

            return msg('WardIngestAttestationAck', {
                counter: body.toCounter,
                wm_behind: true,
                stored_counter: this.head.counter,
            });
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

    /**
     * WardCatchUp: like the firmware, the named head must carry a cached WM attestation (verified
     * over the nonce the host supplies), and the walk back from
     * it must land on the stored head. The fake keeps the head it reads from apart.
     */
    *onWardCatchUp(m: Json): Workflow {
        const to = { counter: m.to_counter as number, root: fromWire(m.to_root) };
        if (to.counter < this.head.counter) {
            throw new Error(
                `the host offered head #${to.counter}, older than #${this.head.counter}`,
            );
        }
        if (this.opts.wm === false) {
            const landed = yield* this.walk(to, this.head.counter);
            if (!same(landed, this.head)) throw new Error('that head does not descend');
            this.head = to;
            this.headTime = null;
            this.stored = true;
            // as `adopt`: the in-flight change took effect only if THIS head is the one it made
            if (this.inflight && same(this.inflight.to, to)) {
                this.queue.splice(0, this.inflight.count);
            }
            this.inflight = null;

            return msg('WardCatchUpAck', {
                counter: to.counter,
                reverts_crossed: 0,
                persisted: true,
            });
        }
        if (!m.nonce || !m.wm_signature || m.timestamp === undefined) {
            throw new Error("catch-up needs the WM's attestation of the named head");
        }
        const body = {
            fromCounter: m.from_counter,
            fromRoot: fromWire(m.from_root),
            toCounter: to.counter,
            toRoot: to.root,
            timestamp: m.timestamp,
        };
        const preimage = attestationPreimage(toBytes(m.nonce), this.wardId, body);
        if (!ed25519.verify(toBytes(m.wm_signature), preimage, this.wmPubkey)) {
            throw new Error('the WM never attested that head');
        }
        const landed = yield* this.walk(to, this.head.counter);
        if (!same(landed, this.head)) throw new Error('that head does not descend');
        this.provisional = { ...to, timestamp: m.timestamp };

        return msg('WardCatchUpAck', { counter: to.counter, reverts_crossed: 0 });
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
        if (this.opts.wm === false ? !this.stored : !this.online) {
            throw new Error('flush needs a synced session');
        }
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
            const present = !!ans.sealed_content;
            const oldCommit = present ? valueDigest(ans.sealed_content) : null;
            const newCommit = change.leaf ? valueDigest(change.leaf.content) : null;
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
                sealed_identity: change.leaf?.identity ?? '',
                sealed_content: change.leaf?.content ?? '',
            });
        }

        const to = { counter: this.head.counter + n, root };
        this.inflight = { to, count: n };
        const authorisation = {
            counter: to.counter,
            auth_commit: toHex(this.authCommit(this.head, to)),
            // without a WM the step is signed for the HOST, under TAG_STEP
            wm_sig: toHex(
                this.opts.wm === false
                    ? ed25519.sign(
                          transitionPreimage(
                              TAG_STEP,
                              this.wardId,
                              this.head.counter,
                              this.head.root,
                              to.counter,
                              to.root,
                          ),
                          this.keys.kSig,
                      )
                    : this.wmSig(this.head, to),
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
    serviceSyncRequest(challenge: string): RelayMessage {
        this.serviceNonce = randomBytes(32);
        const { counter, root } = this.head;

        return msg('WardSyncRequest', {
            nonce: toHex(this.serviceNonce),
            session_proof: this.sessionProof(challenge, this.serviceNonce),
            ward_id: toHex(this.wardId),
            current_counter: counter,
            ...wireRoot('current_root', root),
            head_init_sig: toHex(
                ed25519.sign(
                    transitionPreimage(TAG_WM_INIT, this.wardId, counter, root, counter, root),
                    this.keys.kSig,
                ),
            ),
        });
    }

    private verifyAttestation(nonce: Uint8Array, m: Json, from: Head, to: Head) {
        const body = {
            fromCounter: from.counter,
            fromRoot: from.root,
            toCounter: to.counter,
            toRoot: to.root,
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

    /** Verify the attested step, then pull pages back to this device's head. */
    async onServiceSyncResponse(m: Json, pull: (request: RelayMessage) => Promise<RelayMessage>) {
        if (!this.serviceNonce) throw new Error('no sync round is open');
        const from = { counter: m.from_counter ?? 0, root: fromWire(m.from_root) };
        const to = { counter: m.to_counter ?? 0, root: fromWire(m.to_root) };
        this.verifyAttestation(this.serviceNonce, m, from, to);
        this.session = this.serviceNonce;
        this.serviceNonce = null;
        let cursor = to;
        let first = true;
        while (cursor.counter > this.head.counter) {
            const page = await pull(
                msg('WardChainRequest', {
                    to_counter: cursor.counter,
                    ...wireRoot('to_root', cursor.root),
                }),
            );
            const links = page.message.links as Json[];
            if (page.name !== 'WardChainLinkAck' || !links?.length) {
                throw new Error('the service could not continue the chain');
            }
            for (const l of links) {
                const lf = { counter: l.from_counter, root: fromWire(l.from_root) };
                const lt = { counter: l.to_counter, root: fromWire(l.to_root) };
                if (!same(lt, cursor) || lf.counter >= lt.counter || (first && !same(lf, from))) {
                    throw new Error('the link does not match the chain');
                }
                this.checkLink(lf, lt, toBytes(l.auth_commit));
                cursor = lf;
                first = false;
                if (cursor.counter <= this.head.counter) break;
            }
        }
        if (!same(cursor, this.head)) throw new Error('the links do not reach the stored head');
        this.head = to;
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
        const present = !!fetched.sealed_content;
        const oldCommit = present ? valueDigest(fetched.sealed_content) : null;
        const newCommit = change.leaf ? valueDigest(change.leaf.content) : null;
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
            sealed_identity: change.leaf?.identity ?? '',
            sealed_content: change.leaf?.content ?? '',
            counter: to.counter,
            auth_commit: toHex(this.authCommit(this.head, to)),
            wm_sig: toHex(this.wmSig(this.head, to)),
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
        this.head = pending.to;
        this.queue.shift();
        this.servicePending = null;
    }
}
