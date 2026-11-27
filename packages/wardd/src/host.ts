/**
 * The host side of WARD for ONE wallet (wardd keeps one per `wardId`): its replica, its WM, and
 * the conversations that keep the device in step with both. A port of what `trezorlib.ward`'s
 * callers do, in the order the firmware requires.
 *
 * THE REPLICA IS REBUILT ON EVERY CALL from the backend and the WM's head. Rows another host
 * replicates in are then simply there, and there is no cached tree to go stale; the cost is a
 * replay, which is cheap at the sizes a wallet holds.
 *
 * ONE CALL AT A TIME per wallet: a conversation reads the replica, the device answers against it,
 * and a write lands on top of it -- interleaving two would serve one a tree the other just moved.
 */
import { ed25519 } from '@noble/curves/ed25519.js';

import {
    type Attestation,
    EMPTY_ROOT,
    type Link,
    type RelayErrorCode,
    type RelayMessage,
    TAG_STEP,
    TAG_WM_HEAD,
    TAG_WM_REVERT,
    type WardEntryRequestJson,
    type WardResultJson,
    type WardTrie,
    type WmClient,
    WmConflict,
    WmUnavailable,
    applyResult as applyToTrie,
    attestationPreimage,
    equalBytes,
    leafFromWire,
    leafIsDelete,
    serveChain,
    serveEntry,
    toBytes,
    toHex,
    verifyWmSig,
} from '@trezor/ward-core';

import {
    type StoredAttestation,
    type StoredLink,
    type WardBackend,
    attestationStepKey,
    hexOrNull,
} from './backend';
import { type Head, type Replica, materialize } from './replica';

/** Send one message to the device on the client's session; resolves to its answer. */
export type Device = (message: RelayMessage) => Promise<RelayMessage>;

export class RelayFailure extends Error {
    constructor(
        readonly code: RelayErrorCode,
        message: string,
    ) {
        super(message);
        this.name = 'RelayFailure';
    }
}

type Json = Record<string, any>;

export interface ServiceSyncRound {
    response: RelayMessage;
    chainPage: (request: Json) => RelayMessage;
}

// A 32-byte MAC, two 32-byte roots, two uint32 counters and protobuf framing cost
// at most 116 bytes per link. A full page fits the firmware's 8704-byte buffer.
const SERVICE_CHAIN_PAGE_SIZE = 64;
// With a WM attestation each link carries ~110 bytes more; 16 keep a page well inside the buffer.
const ACCEPTANCE_PAGE_SIZE = 16;
// The device signs at most this many transitions per WardRollForward.
const ROLL_FORWARD_PAGE_SIZE = 16;

/** A step's identity on the wire, the empty tree as an absent root. */
const stepKeyOf = (link: {
    from_counter: number;
    from_root?: string;
    to_counter: number;
    to_root?: string;
}) => {
    const root = (r?: string) =>
        !r || r.toLowerCase() === toHex(EMPTY_ROOT) ? '' : r.toLowerCase();

    return `${link.from_counter}:${root(link.from_root)}:${link.to_counter}:${root(link.to_root)}`;
};

const expectReply = (reply: RelayMessage, ...names: string[]): Json => {
    if (reply.name === 'Failure') {
        throw new RelayFailure(
            'device_failure',
            String((reply.message as Json).message ?? 'the device refused'),
        );
    }
    if (!names.includes(reply.name)) {
        throw new RelayFailure('device_failure', `unexpected ${reply.name}; wanted ${names}`);
    }

    return reply.message;
};

/** The wire's root: absent, empty and EMPTY_ROOT all mean the empty tree. */
const rootOf = (v: string | null | undefined): Uint8Array | null => {
    if (!v) return null;
    const b = toBytes(v);

    return equalBytes(b, EMPTY_ROOT) ? null : b;
};

const sameRoot = (a: Uint8Array | null, b: Uint8Array | null) =>
    equalBytes(a ?? EMPTY_ROOT, b ?? EMPTY_ROOT);

const isCounter = (n: number) => Number.isInteger(n) && n >= 0 && n <= 0xffffffff;

/** Bytes to the wire, leaving the field out when it is absent -- never `null`. */
const opt = (key: string, v: Uint8Array | null | undefined): Json =>
    v?.length ? { [key]: toHex(v) } : {};

const liveStep = (a: Attestation) => ({
    from_counter: a.fromCounter,
    ...opt('from_root', rootOf(toHex(a.fromRoot))),
    to_counter: a.toCounter,
    ...opt('to_root', rootOf(toHex(a.toRoot))),
    wm_signature: toHex(a.signature),
    timestamp: a.timestamp,
});

export interface HostSyncResult {
    counter: number;
    root: string | null;
    /** `catchUp` is the only route without a WM (`--without-wm`) */
    how: 'reconcile' | 'verifyChain' | 'rejoin' | 'catchUp';
    discarded?: number;
    /** the device found the WM restored below its head, and signed its accepted history again */
    rolledForward?: RollForwardResult;
}

export interface RollForwardResult {
    /** transitions the WM accepted again */
    steps: number;
    /** the WM's head afterwards */
    toCounter: number;
    /** the WM's acceptance time of the last transition rolled forward, as the device showed it */
    lastTimestamp: number;
}

export interface HostFlushResult {
    counter: number;
    root: string | null;
    published: number;
    remaining: number;
}

/** A guard against a device that keeps offering changes without its queue shrinking. */
const MAX_FLUSH_ROUNDS = 1000;

export interface WardHostOptions {
    /**
     * Roll a WM found below the newest head this host holds an attestation for forward, by having
     * the device sign the accepted transitions again (`rollForward`). On unless turned off
     * (`--no-roll-forward`), which models a host that does not hold the newer history.
     */
    rollForward?: boolean;
}

export class WardHost {
    private queue: Promise<unknown> = Promise.resolve();

    constructor(
        readonly wardId: Uint8Array,
        private readonly backend: WardBackend,
        /**
         * null: deployed WITHOUT a WM (the MVP, `--without-wm`). The replica's head is then the
         * highest head its rows build, a write is stored without a WM's say, and a sync is a
         * `catchUp`, which the device persists.
         */
        private readonly wm: WmClient | null,
        private readonly onWmChange: () => void | Promise<void> = () => {},
        /** narrate replica rebuilds (`--verbose`) */
        private readonly log?: (line: string) => void,
        private readonly opts: WardHostOptions = {},
    ) {}

    /** What the last narrated rebuild was built from, so an unchanged replica is not retold. */
    private rebuilt = '';

    /** The write session this host last activated with a device proof. */
    private session: Uint8Array | null = null;

    /** An opening proof activates a session. Page and publication attestations only read the head. */
    private async attestSession(
        wm: WmClient,
        wardId: Uint8Array,
        nonce: Uint8Array,
        proof?: Uint8Array,
    ) {
        const att = proof
            ? await wm.openSession(wardId, nonce, proof)
            : await wm.attest(wardId, nonce);
        if (proof) this.session = nonce;
        await this.keepAttestation(att, nonce);

        return att;
    }

    /**
     * Run `fn` with this wallet to itself. A WM that cannot be reached fails the call as
     * `wm_unavailable`: the device then keeps its last head, and shows what it reads as unproven.
     */
    exclusive<T>(fn: () => Promise<T>): Promise<T> {
        const guarded = () =>
            fn().catch((e: unknown) => {
                if (e instanceof WmUnavailable) throw new RelayFailure('wm_unavailable', e.message);
                throw e;
            });
        const run = this.queue.then(guarded, guarded);
        this.queue = run.catch(() => {});

        return run;
    }

    /** The WM's head, or none while it cannot be reached. */
    private async wmHead(): Promise<{
        head: { counter: number; root: Uint8Array | null } | null;
        available: boolean;
    }> {
        if (!this.wm) return { head: null, available: false };
        try {
            return { head: await this.wm.head(this.wardId), available: true };
        } catch (e) {
            if (!(e instanceof WmUnavailable)) throw e;

            return { head: null, available: false };
        }
    }

    /**
     * Served from the WM's head. While the WM is down, from the highest head the stored rows
     * build -- rows the relay brings in meanwhile included -- which is what a device catches up to
     * (`catchUp`); the device itself checks that it descends from the head it stored.
     */
    async replica(): Promise<Replica> {
        const links = await this.backend.load();
        const { head } = await this.wmHead();
        // the replica is rebuilt on every call; narrate it only when what it is built from changed
        const from = `${links.length}/${head?.counter ?? '-'}/${head?.root ? toHex(head.root) : ''}`;
        const narrate = this.log && from !== this.rebuilt;
        this.rebuilt = from;

        return materialize(links, head, narrate ? this.log : undefined);
    }

    status() {
        return this.exclusive(async () => {
            const { trie, head, behind, corrupt } = await this.replica();
            const wm = await this.wmHead();
            const attested = this.newestAttested(trie, head, await this.backend.loadAttestations());

            return {
                counter: head.counter,
                root: hexOrNull(head.root),
                // `catchUp`'s target: the newest head on the chain a kept WM attestation names
                attestedCounter: attested?.at.counter ?? null,
                wmCounter: wm.available ? (wm.head?.counter ?? null) : null,
                wmRoot: wm.available ? hexOrNull(wm.head?.root) : null,
                wmAvailable: wm.available,
                withoutWm: !this.wm,
                behind,
                // stored rows left out of the replica because they do not reproduce their root
                corrupt,
            };
        });
    }

    /** Answer one pull for a caller that drives the device itself (Connect's `wardProvider`). */
    serveEntry(request: WardEntryRequestJson, staged: readonly [string, string][] = []) {
        return this.exclusive(async () => {
            const { trie } = await this.replica();

            return serveEntry(
                trie,
                request,
                staged.map(([k, c]) => [toBytes(k), toBytes(c)] as [Uint8Array, Uint8Array]),
            );
        });
    }

    applyResult(result: WardResultJson) {
        return this.exclusive(() => this.applyInner(result));
    }

    sync(device: Device, opts: { rejoin?: boolean } = {}) {
        return this.exclusive(() => this.syncInner(device, opts));
    }

    /**
     * Walk the device up WITHOUT the WM -- what a host can do while the WM is down -- to the
     * NEWEST HEAD ON THIS REPLICA'S CHAIN THAT A KEPT WM ATTESTATION VOUCHES FOR, which may be
     * below the replica's head. The device verifies the attestation, proves the chain back to its
     * stored head and reads from that head for the session only, under a warning that it reflects
     * nothing since the attestation's timestamp, nor reverts -- or persists it, where the user
     * allowed that for the wallet (`persisted` says which).
     *
     * WITH NO KEPT ATTESTATION the replica's head is offered bare. A firmware built without a WM
     * (the MVP) follows the chain alone and always persists; one with a WM refuses, and the device
     * stays on its stored head.
     */
    catchUp(device: Device) {
        return this.exclusive(() => this.catchUpInner(device));
    }

    private async catchUpInner(device: Device) {
        const { trie, head } = await this.replica();
        const target = this.newestAttested(trie, head, await this.backend.loadAttestations());
        const at = target?.at ?? head;
        const a = target?.attestation;
        const attested = a
            ? {
                  nonce: a.nonce,
                  from_counter: a.fromCounter,
                  ...opt('from_root', rootOf(a.fromRoot)),
                  timestamp: a.timestamp,
                  wm_signature: a.signature,
              }
            : {};
        const ack = expectReply(
            await this.answerChain(
                device,
                trie,
                await device({
                    name: 'WardCatchUp',
                    message: {
                        to_counter: at.counter,
                        ...opt('to_root', at.root),
                        ...attested,
                    },
                }),
            ),
            'WardCatchUpAck',
        );

        return {
            counter: ack.counter ?? at.counter,
            root: hexOrNull(at.root),
            timestamp: a?.timestamp ?? null,
            replicaCounter: head.counter,
            reverts: ack.reverts_crossed ?? 0,
            persisted: ack.persisted ?? false,
        };
    }

    /**
     * ROLL A RESTORED WM FORWARD, THROUGH THE TREZOR. Run when the device's WardIngestAttestation
     * reported `wm_behind`: the WM's register went back (a backup restore, a failover onto a stale
     * replica) and holds a head below the device's. The device signatures stored with the links cannot bring it back: each
     * is bound to the session nonce of the sync it was minted in, and a restore ends every session.
     * So the device signs them again for THIS round's session (`WardRollForward`): this host feeds
     * it the transitions from the WM's attested head, each with the WM's own signed record that it
     * accepted that step; the device checks its own `auth_commit` and the WM's record, and returns
     * one `wm_sig` per step, which go to the WM as ordinary advances. The WM accepts nothing else.
     *
     * ONLY ALONG ACCEPTED HISTORY. The target is the newest head a kept, verified WM attestation
     * names, and the WM's head must lie on the chain walking back from it; otherwise this is a
     * fork (rejoin), not a restore, and nothing is replayed. A step with no kept record ends the
     * path there; a device or WM refusal ends the roll-forward there. Pages of 16, each anchored
     * on a fresh attestation under the SAME round nonce -- the device's round is still open. The
     * device asks the user on the first page; the last page is `final`, on which it shows the head
     * restored and when the WM accepted its last change.
     *
     * Returns the attestation the sync continues with, and what was rolled forward (null: nothing).
     */
    private async rollForward(
        device: Device,
        wm: WmClient,
        nonce: Uint8Array,
        att: Attestation,
    ): Promise<{ att: Attestation; result: RollForwardResult | null }> {
        if (this.opts.rollForward === false) return { att, result: null };
        const current: Head = { counter: att.toCounter, root: rootOf(toHex(att.toRoot)) };
        const records = await this.receiptsByStep();
        const { trie } = await this.replica();
        const targets = [...records.values()]
            .filter(a => a.toCounter > current.counter)
            .sort((a, b) => b.toCounter - a.toCounter || b.timestamp - a.timestamp);
        let path: Link[] | null = null;
        for (const target of targets) {
            // bounded by the counter distance: every step raises the counter by at least one
            const back = trie.linksEndingAt(
                target.toCounter,
                rootOf(target.toRoot),
                target.toCounter - current.counter,
            );
            const at = back.findIndex(
                l => l.fromCounter === current.counter && sameRoot(l.fromRoot, current.root),
            );
            if (at >= 0) {
                path = back.slice(0, at + 1).reverse();
                break;
            }
        }
        const steps: { link: Link; record: StoredAttestation }[] = [];
        for (const link of path ?? []) {
            const record = records.get(
                stepKeyOf({
                    from_counter: link.fromCounter,
                    from_root: hexOrNull(link.fromRoot) ?? undefined,
                    to_counter: link.toCounter,
                    to_root: hexOrNull(link.toRoot) ?? undefined,
                }),
            );
            if (!record) break;
            steps.push({ link, record });
        }
        if (!steps.length) return { att, result: null };

        let anchor = att;
        let advanced = 0;
        let lastTimestamp = 0;
        for (let first = 0; first < steps.length; first += ROLL_FORWARD_PAGE_SIZE) {
            const page = steps.slice(first, first + ROLL_FORWARD_PAGE_SIZE);
            const final = first + ROLL_FORWARD_PAGE_SIZE >= steps.length;
            const reply = await device({
                name: 'WardRollForward',
                message: {
                    from_counter: anchor.fromCounter,
                    ...opt('from_root', rootOf(toHex(anchor.fromRoot))),
                    to_counter: anchor.toCounter,
                    ...opt('to_root', rootOf(toHex(anchor.toRoot))),
                    timestamp: anchor.timestamp,
                    wm_signature: toHex(anchor.signature),
                    links: page.map(({ link, record }) => ({
                        from_counter: link.fromCounter,
                        ...opt('from_root', link.fromRoot),
                        to_counter: link.toCounter,
                        ...opt('to_root', link.toRoot),
                        auth_commit: toHex(link.authCommit),
                        acceptance: {
                            nonce: record.nonce,
                            timestamp: record.timestamp,
                            wm_signature: record.signature,
                        },
                    })),
                    ...(final ? { final: true } : {}),
                },
            });
            if (reply.name !== 'WardRollForwardAck') {
                this.log?.(
                    `roll-forward: the device refused: ${(reply.message as Json)?.message ?? reply.name}`,
                );
                break;
            }
            const sigs = ((reply.message as Json).wm_sigs ?? []) as string[];
            let complete = sigs.length === page.length;
            for (const [index, { link, record }] of page.entries()) {
                if (!sigs[index]) break;
                try {
                    const { acceptance } = await wm.advance({
                        wardId: this.wardId,
                        fromCounter: link.fromCounter,
                        fromRoot: link.fromRoot,
                        toCounter: link.toCounter,
                        toRoot: link.toRoot,
                        wmSig: toBytes(sigs[index]),
                        session: nonce,
                    });
                    await this.keepAttestation(acceptance, acceptance.nonce);
                    advanced++;
                    lastTimestamp = record.timestamp;
                } catch (e) {
                    if (e instanceof WmUnavailable) throw e;
                    this.log?.(
                        `roll-forward: the WM refused #${link.fromCounter} -> #${link.toCounter}: ` +
                            String(e),
                    );
                    complete = false;
                    break;
                }
            }
            // the next page, or the rest of the sync, is anchored on where the WM is now
            anchor = await this.attestSession(wm, this.wardId, nonce);
            if (!complete) break;
        }
        if (advanced) {
            this.log?.(
                `roll-forward: the WM was at #${current.counter}; the device signed ${advanced} ` +
                    `accepted transition(s) again, to #${anchor.toCounter}`,
            );
            await this.onWmChange();
        }

        return {
            att: anchor,
            result: advanced
                ? { steps: advanced, toCounter: anchor.toCounter, lastTimestamp }
                : null,
        };
    }

    /**
     * The newest state on the replica's line, from its head down, that a kept attestation names as
     * its `to` end; the latest such attestation if there are several.
     */
    private newestAttested(trie: WardTrie, head: Head, kept: StoredAttestation[]) {
        const byHead = new Map<string, StoredAttestation[]>();
        const empty = toHex(EMPTY_ROOT);
        for (const a of kept) {
            if (
                !a ||
                !isCounter(a.toCounter) ||
                !Number.isSafeInteger(a.timestamp) ||
                (a.toRoot !== null && typeof a.toRoot !== 'string')
            ) {
                continue;
            }
            const key = `${a.toCounter}/${a.toRoot?.toLowerCase() || empty}`;
            const proofs = byHead.get(key);
            if (proofs) proofs.push(a);
            else byHead.set(key, [a]);
        }
        const line: Head[] = [
            head,
            ...trie
                .linksEndingAt(head.counter, head.root, Number.MAX_SAFE_INTEGER)
                .map(l => ({ counter: l.fromCounter, root: l.fromRoot })),
        ];
        for (const at of line) {
            const proofs = byHead.get(`${at.counter}/${toHex(at.root ?? EMPTY_ROOT)}`);
            const attestation = proofs
                ?.sort((a, b) => b.timestamp - a.timestamp)
                .find(a => this.verifiesAttestation(a));
            if (attestation) return { at, attestation };
        }

        return null;
    }

    private verifiesAttestation(a: StoredAttestation): boolean {
        if (
            !this.wm ||
            !isCounter(a.fromCounter) ||
            !isCounter(a.toCounter) ||
            !Number.isSafeInteger(a.timestamp) ||
            a.timestamp < 0
        ) {
            return false;
        }
        try {
            const nonce = toBytes(a.nonce);
            const body = {
                ...a,
                fromRoot: rootOf(a.fromRoot) ?? EMPTY_ROOT,
                toRoot: rootOf(a.toRoot) ?? EMPTY_ROOT,
            };
            const widths = [nonce, body.fromRoot, body.toRoot];

            return (
                widths.every(field => field instanceof Uint8Array && field.length === 32) &&
                ed25519.verify(
                    toBytes(a.signature),
                    attestationPreimage(nonce, this.wardId, body),
                    this.wm.pubkey,
                )
            );
        } catch {
            return false;
        }
    }

    /**
     * Keep what the WM just signed, for `catchUp` while it is down. A failure to store it fails
     * nothing: the attestation is a convenience for later, and the round it answers goes on.
     */
    private async keepAttestation(att: Attestation, nonce: Uint8Array) {
        try {
            const proof = {
                fromCounter: att.fromCounter,
                fromRoot: hexOrNull(rootOf(toHex(att.fromRoot))),
                toCounter: att.toCounter,
                toRoot: hexOrNull(rootOf(toHex(att.toRoot))),
                timestamp: att.timestamp,
                nonce: toHex(nonce),
                signature: toHex(att.signature),
            };
            // One per step. A newer one replaces it: a WM restored from a backup re-accepts a
            // step later, so retain the latest signed date for display.
            const key = attestationStepKey(proof);
            const kept = await this.backend.loadAttestations();
            if (
                kept.some(
                    a =>
                        a &&
                        attestationStepKey(a) === key &&
                        a.timestamp >= proof.timestamp &&
                        this.verifiesAttestation(a),
                )
            ) {
                return;
            }
            if (this.verifiesAttestation(proof)) {
                await this.backend.appendAttestation(proof);
            }
        } catch (e) {
            this.log?.(`replica: could not keep the WM's attestation: ${String(e)}`);
        }
    }

    flush(device: Device, opts: { maxBatch?: number } = {}) {
        return this.exclusive(() => this.flushInner(device, opts));
    }

    /**
     * Store a confirmed transition, THEN publish it. The order is the host obligation: a WM that
     * advanced to a head no replica holds has a wallet nobody can serve. Losing a race to another
     * host between the two leaves the row as a dead branch -- harmless, and kept, since it is this
     * device's side of any later rejoin.
     *
     * WITHOUT A WM storing it is all there is: the device mints no `wm_sig`, and the row becomes the
     * replica's head because it builds the highest one. Two hosts storing at one counter fork the
     * chain, and nothing short of a WM picks between them.
     */
    private async applyInner(
        result: WardResultJson,
        expect: { fromRoot?: Uint8Array | null; toRoot?: Uint8Array | null } = {},
    ) {
        const { trie, head } = await this.replica();
        if (!result.auth_commit) {
            applyToTrie(trie, result); // refuses a "no change" the replica contradicts

            return { counter: head.counter, root: hexOrNull(head.root), published: false };
        }
        // MINTED ON THIS HEAD, OR NOT AT ALL. A single-leaf result does not name its `from` state,
        // so applying it to whatever head the replica is at now would build a tree the device never
        // built. The counter must follow on from the head, and the device's `wm_sig` -- which covers
        // both ends -- must verify over exactly this step: then the row stored below is the step
        // the device authorised, and nothing else ever is. WITHOUT A WM the same signature comes
        // under TAG_STEP, and is checked the same way: it is all that stops anyone holding this
        // wardd's token from storing a step no device of this wallet made.
        const fromCounter = result.leaves?.length ? result.from_counter : (result.counter ?? 0) - 1;
        if (fromCounter !== head.counter || !result.wm_sig) {
            throw new RelayFailure(
                'wm_conflict',
                `this result was minted against counter ${fromCounter}; the head is at ` +
                    `${head.counter}. Sync and flush again`,
            );
        }
        // THE DEVICE'S OWN ROOTS, where it states them (a service-build WardPublish does): both
        // ends must be the ones this replica builds, or the two hold different trees
        if ('fromRoot' in expect && !sameRoot(expect.fromRoot ?? null, head.root)) {
            throw new RelayFailure(
                'wm_conflict',
                'the device built on another tree at this counter',
            );
        }
        applyToTrie(trie, result);
        const toRoot = trie.root();
        if ('toRoot' in expect && !sameRoot(expect.toRoot ?? null, toRoot)) {
            throw new RelayFailure(
                'wm_conflict',
                'this replica builds a different root for the change',
            );
        }
        const { wm } = this;
        const step = [this.wardId, head.counter, head.root, result.counter!, toRoot] as const;
        if (!wm) {
            if (!verifyWmSig(...step, toBytes(result.wm_sig), TAG_STEP)) {
                throw new RelayFailure(
                    'bad_request',
                    "this step is not signed by this wallet's device; it is not stored",
                );
            }
        } else if (
            !this.session ||
            !(
                verifyWmSig(...step, toBytes(result.wm_sig), TAG_WM_HEAD, this.session) ||
                verifyWmSig(...step, toBytes(result.wm_sig), TAG_WM_REVERT, this.session)
            )
        ) {
            // BOUND TO THE SESSION: the WM takes it only under the nonce of the wallet's latest
            // sync, which this host ran -- or another host has synced since, and it is stale
            throw new RelayFailure(
                'wm_conflict',
                'this result was not minted on the current head in the current session; sync ' +
                    'and flush again',
            );
        }
        const changes = result.leaves?.length
            ? result.leaves.map(leaf => ({
                  entryKey: leaf.entry_key ?? '',
                  leaf: leafIsDelete(leafFromWire(leaf)) ? null : leafFromWire(leaf),
              }))
            : [
                  {
                      entryKey: result.entry_key ?? '',
                      leaf: leafIsDelete(leafFromWire(result)) ? null : leafFromWire(result),
                  },
              ];
        const link: StoredLink = {
            fromCounter: head.counter,
            fromRoot: hexOrNull(head.root),
            toCounter: result.counter!,
            toRoot: hexOrNull(toRoot),
            authCommit: result.auth_commit,
            operation: 'commit',
            wmSig: result.wm_sig ?? null,
            changes,
        };
        await this.backend.append(link);
        if (!wm) return { counter: link.toCounter, root: link.toRoot, published: true };
        try {
            const { acceptance } = await wm.advance({
                wardId: this.wardId,
                fromCounter: link.fromCounter,
                fromRoot: head.root,
                toCounter: link.toCounter,
                toRoot,
                wmSig: toBytes(result.wm_sig),
                // what this host believes the session is: the WM uses it to explain a refusal
                ...(this.session ? { session: this.session } : {}),
            });
            // THE WM'S OWN RECORD of the transition: what a roll-forward presents after a restore
            await this.keepAttestation(acceptance, acceptance.nonce);
        } catch (e) {
            if (e instanceof WmConflict) {
                throw new RelayFailure(
                    'wm_conflict',
                    `another writer moved the WM head to ${e.headCounter}; sync, then send the ` +
                        'same request with the retry token from its WardLeafAck',
                );
            }
            throw e;
        }
        await this.onWmChange();

        return { counter: link.toCounter, root: link.toRoot, published: true };
    }

    // --- THE SERVICE BUILD: the device asks, this host answers -------------------------------
    //
    // The same replica, WM and checks as the connect path, with the conversation inverted: on a
    // service build the device talks to wardd over its own interface and pulls what it needs. A
    // port of tests/ward_service.py `MockWardService`, minus its failure-mode knobs.

    async serviceChallenge() {
        const wm = this.requireWm('the service channel');

        return {
            name: 'WardSyncResponse',
            message: { wm_challenge: toHex(await wm.challenge(this.wardId)) },
        };
    }

    /** Attest once, then serve backwards from a snapshot of that history. */
    serviceSync(req: Json): Promise<ServiceSyncRound> {
        return this.exclusive(async () => {
            const wm = this.requireWm('the service channel');
            const wardId = toBytes(req.ward_id ?? '');
            if (!equalBytes(wardId, this.wardId)) {
                throw new Error('a sync for another wallet than this store');
            }
            const current: Head = {
                counter: req.current_counter ?? 0,
                root: rootOf(req.current_root),
            };
            if (!(await wm.head(wardId))) {
                // first contact: enrol from the device's opening head (genesis only -- see syncInner)
                if (current.counter !== 0) {
                    throw new Error(
                        'the WM does not know this wallet and enrols only at counter 0',
                    );
                }
                await wm.enrol(wardId, current.root, toBytes(req.head_init_sig ?? ''));
                await this.onWmChange();
            }
            // no roll-forward on the deprecated service channel: it has no WardRollForward
            const att = await this.attestSession(
                wm,
                wardId,
                toBytes(req.nonce ?? ''),
                toBytes(req.session_proof ?? ''),
            );
            const anchor = { counter: att.toCounter, root: rootOf(toHex(att.toRoot)) };
            let cursor = anchor;
            const snapshot =
                anchor.counter > current.counter
                    ? materialize(await this.backend.load(), anchor)
                    : undefined;
            let history = snapshot?.behind ? undefined : snapshot?.trie;

            return {
                response: {
                    name: 'WardSyncResponse',
                    message: {
                        from_counter: att.fromCounter,
                        ...opt('from_root', rootOf(toHex(att.fromRoot))),
                        to_counter: anchor.counter,
                        ...opt('to_root', anchor.root),
                        timestamp: att.timestamp,
                        wm_signature: toHex(att.signature),
                    },
                },
                chainPage(request) {
                    if (
                        request.to_counter !== cursor.counter ||
                        !sameRoot(rootOf(request.to_root), cursor.root)
                    ) {
                        throw new Error('unexpected service chain cursor');
                    }
                    const links = history
                        ? serveChain(
                              history,
                              cursor.counter,
                              cursor.root,
                              SERVICE_CHAIN_PAGE_SIZE,
                          ).filter(link => link.from_counter >= current.counter)
                        : [];
                    if (
                        links.some(
                            link =>
                                link.auth_commit.length !== 64 ||
                                (link.from_root !== undefined && link.from_root.length !== 64) ||
                                (link.to_root !== undefined && link.to_root.length !== 64),
                        )
                    ) {
                        throw new Error('invalid service chain link');
                    }
                    const last = links.at(-1);
                    if (last) {
                        cursor = {
                            counter: last.from_counter,
                            root: rootOf(last.from_root),
                        };
                    }
                    if (!last || cursor.counter === current.counter) history = undefined;

                    return { name: 'WardChainLinkAck', message: { links } };
                },
            };
        });
    }

    /** WardServiceFetch -> WardEntryAck, or WardSyncRequired when the device is not at our head. */
    serviceFetch(req: Json) {
        return this.exclusive(async () => {
            const { trie, head } = await this.replica();
            // HEAD-AWARE: a proof against a root the device does not hold would fail on the device
            // with nothing to say why. Both fields, since roots may share a counter across forks.
            const current: Head = {
                counter: req.current_counter ?? 0,
                root: rootOf(req.current_root),
            };
            if (current.counter !== head.counter || !sameRoot(current.root, head.root)) {
                return { name: 'WardSyncRequired', message: {} };
            }

            return {
                name: 'WardEntryAck',
                message: serveEntry(trie, { entry_key: req.entry_key }) as unknown as Json,
            };
        });
    }

    /**
     * WardPublish -> WardPublishAck, or WardPublishConflict when it is definitively not landing.
     *
     * STAGE, CHECK THE PREDECESSOR, PROMOTE -- the write-ahead order a real wardd needs, and the append-only log
     * gives it for nothing: the row is staged first, and it is the head only once the WM's
     * predecessor check points at it. A failed predecessor check leaves a dead row, never a
     * half-applied tree.
     */
    servicePublish(req: Json) {
        return this.exclusive(async () => {
            const result: WardResultJson = {
                entry_key: req.entry_key,
                sealed_identity: req.sealed_identity,
                sealed_content: req.sealed_content,
                counter: req.counter,
                auth_commit: req.auth_commit,
                wm_sig: req.wm_sig,
            };
            const wm = this.requireWm('the service channel');
            try {
                await this.applyInner(result, {
                    fromRoot: rootOf(req.from_root),
                    toRoot: rootOf(req.new_root),
                });
            } catch (e) {
                if (e instanceof RelayFailure && e.code === 'wm_conflict') {
                    const wmHead = await wm.head(this.wardId);

                    return {
                        name: 'WardPublishConflict',
                        message: { head_counter: wmHead?.counter ?? 0 },
                    };
                }
                throw e;
            }
            const att = await this.attestSession(wm, this.wardId, toBytes(req.nonce ?? ''));

            return {
                name: 'WardPublishAck',
                message: {
                    timestamp: att.timestamp,
                    wm_signature: toHex(att.signature),
                },
            };
        });
    }

    /** The WM, or refuse `what` on a wardd running without one (`--without-wm`). */
    private requireWm(what: string): WmClient {
        if (!this.wm) {
            throw new RelayFailure(
                'bad_request',
                `${what} needs a WARD Manager; this wardd runs without one`,
            );
        }

        return this.wm;
    }

    /** The stored rows, as the replica is built from them. */
    storedLinks() {
        return this.backend.load();
    }

    /**
     * Answer the device's `WardChainRequest`s from `trie` until it sends something else. A request
     * with `with_acceptance` (WardRollback) also gets each link's kept WM attestation, found by the
     * link's step, in smaller pages so they fit the device's buffer.
     */
    async answerChain(device: Device, trie: WardTrie, reply: RelayMessage) {
        let receipts: Map<string, StoredAttestation> | undefined;
        while (reply.name === 'WardChainRequest') {
            const req = reply.message as Json;
            const withAcceptance = !!req.with_acceptance;
            if (withAcceptance && !receipts) receipts = await this.receiptsByStep();
            const links = serveChain(
                trie,
                req.to_counter ?? 0,
                req.to_root ?? null,
                withAcceptance ? ACCEPTANCE_PAGE_SIZE : undefined,
            ).map(link => {
                const a = withAcceptance ? receipts?.get(stepKeyOf(link)) : undefined;

                return a
                    ? {
                          ...link,
                          acceptance: {
                              nonce: a.nonce,
                              timestamp: a.timestamp,
                              wm_signature: a.signature,
                          },
                      }
                    : link;
            });
            reply = await device({ name: 'WardChainLinkAck', message: { links } });
        }

        return reply;
    }

    /** The newest verified kept attestation of each step. */
    private async receiptsByStep() {
        const byStep = new Map<string, StoredAttestation>();
        for (const a of await this.backend.loadAttestations()) {
            if (!a || !this.verifiesAttestation(a)) continue;
            const key = stepKeyOf({
                from_counter: a.fromCounter,
                from_root: a.fromRoot ?? undefined,
                to_counter: a.toCounter,
                to_root: a.toRoot ?? undefined,
            });
            const held = byStep.get(key);
            if (!held || held.timestamp < a.timestamp) byStep.set(key, a);
        }

        return byStep;
    }

    private async openManagerRound(device: Device, wm: WmClient) {
        const challenge = await wm.challenge(this.wardId);
        const ack = expectReply(
            await device({ name: 'WardSync', message: { wm_challenge: toHex(challenge) } }),
            'WardSyncAck',
        );
        const wardId = toBytes(ack.ward_id ?? '');
        if (!equalBytes(wardId, this.wardId)) {
            throw new RelayFailure(
                'bad_request',
                'the device is on another wallet than this store',
            );
        }
        // the device reports its ROOT only at genesis (apps/ward/sync.py); above it, `root` is
        // absent and means "not said", NOT the empty tree -- see `forkOf`
        const dev: Head = { counter: ack.counter ?? 0, root: rootOf(ack.root) };

        if (!(await wm.head(wardId))) {
            // ENROLMENT IS GENESIS ONLY: see MockWM.attest_head for why a WM must not be seeded
            // from whatever head the first device to reach it happens to hold.
            if (dev.counter !== 0) {
                throw new RelayFailure(
                    'internal',
                    'the WM does not know this wallet and enrols only at counter 0',
                );
            }
            await wm.enrol(wardId, dev.root, toBytes(ack.head_init_sig ?? ''));
            await this.onWmChange();
        }
        const nonce = toBytes(ack.nonce ?? '');
        const att = await this.attestSession(wm, wardId, nonce, toBytes(ack.session_proof ?? ''));

        return { dev, nonce, att };
    }

    recoveryTargets() {
        return this.exclusive(async () => {
            const head = await this.wm?.head(this.wardId);
            if (!head) return [];
            const rows = await this.backend.load();
            const records = await this.receiptsByStep();
            const targets = [];
            const seen = new Set<string>();
            for (const a of records.values()) {
                if (a.toCounter >= head.counter) continue;
                const key = `${a.toCounter}/${a.toRoot ?? ''}`;
                if (seen.has(key)) continue;
                const built = materialize(rows, { counter: a.toCounter, root: rootOf(a.toRoot) });
                if (built.behind) continue;
                const [link] = serveChain(built.trie, a.toCounter, a.toRoot, 1);
                if (
                    link &&
                    stepKeyOf(link) !==
                        stepKeyOf({
                            from_counter: a.fromCounter,
                            from_root: a.fromRoot ?? undefined,
                            to_counter: a.toCounter,
                            to_root: a.toRoot ?? undefined,
                        })
                )
                    continue;
                seen.add(key);
                targets.push({ counter: a.toCounter, root: a.toRoot, timestamp: a.timestamp });
            }

            return targets.sort((a, b) => b.counter - a.counter);
        });
    }

    revert(device: Device, counter: number, root: string | null) {
        return this.exclusive(async () => {
            const { wm } = this;
            if (!wm || !isCounter(counter) || (root !== null && !/^[a-f0-9]{64}$/i.test(root))) {
                throw new RelayFailure(
                    'bad_request',
                    'revert requires a manager and a target counter and root',
                );
            }
            const target = { counter, root: rootOf(root) };
            const rows = await this.backend.load();
            const built = materialize(rows, target);
            if (built.behind)
                throw new RelayFailure('bad_request', 'missing records for the recovery target');

            const link = serveChain(built.trie, counter, target.root, 1)[0];
            if (counter && !link)
                throw new RelayFailure('bad_request', 'missing target transition');
            const step = link ?? { from_counter: 0, to_counter: 0 };
            const receipt = (await this.receiptsByStep()).get(stepKeyOf(step));
            if (!receipt)
                throw new RelayFailure(
                    'bad_request',
                    'missing signed manager record for the target',
                );

            const { att, nonce } = await this.openManagerRound(device, wm);
            if (target.counter >= att.toCounter) {
                throw new RelayFailure(
                    'bad_request',
                    'the recovery target must precede the current manager head',
                );
            }
            const reply = expectReply(
                await this.answerChain(
                    device,
                    built.trie,
                    await device({
                        name: 'WardRollback',
                        message: {
                            ...liveStep(att),
                            recovered_counter: counter,
                            ...opt('recovered_root', target.root),
                            attested_target: {
                                ...step,
                                acceptance: {
                                    nonce: receipt.nonce,
                                    wm_signature: receipt.signature,
                                    timestamp: receipt.timestamp,
                                },
                            },
                        },
                    }),
                ),
                'WardRollbackAck',
            );
            const next = att.toCounter + 1;
            const sig = toBytes(reply.wm_sig ?? '');
            if (
                reply.counter !== next ||
                !sameRoot(rootOf(reply.new_root), target.root) ||
                toBytes(reply.auth_commit ?? '').length !== 32 ||
                !verifyWmSig(
                    this.wardId,
                    att.toCounter,
                    att.toRoot,
                    next,
                    target.root,
                    sig,
                    TAG_WM_REVERT,
                    nonce,
                )
            ) {
                throw new RelayFailure(
                    'device_failure',
                    'invalid device authorization for the revert',
                );
            }
            await this.backend.append({
                fromCounter: att.toCounter,
                fromRoot: hexOrNull(rootOf(toHex(att.toRoot))),
                toCounter: next,
                toRoot: hexOrNull(target.root),
                operation: 'revert',
                authCommit: reply.auth_commit,
                wmSig: reply.wm_sig,
                recoveredCounter: counter,
                changes: [],
            });
            try {
                const { acceptance } = await wm.advance({
                    wardId: this.wardId,
                    fromCounter: att.toCounter,
                    fromRoot: att.toRoot,
                    toCounter: next,
                    toRoot: target.root,
                    wmSig: sig,
                    session: nonce,
                });
                await this.keepAttestation(acceptance, acceptance.nonce);
            } catch (e) {
                if (e instanceof WmConflict)
                    throw new RelayFailure('wm_conflict', 'manager head changed during revert');
                throw e;
            }
            await this.onWmChange();
            const synced = await this.syncInner(device, { approvedRevert: next });

            return { counter: next, root: hexOrNull(target.root), synced };
        });
    }

    /**
     * One sync round: the device's nonce, the WM's attestation of the step to its head, and then
     * whichever adoption the two heads call for.
     *
     * - the device is AT the head, or ONE STEP behind it: `WardReconcile` with the link into it;
     * - it is further behind ON THE SAME LINE: `WardVerifyChain`, the device walking back;
     * - it is OFF the line (a fork): `WardRejoin`, ONLY when the caller says so -- it discards
     *   the device's changes above the fork, and the user confirms that on the device;
     * - it is AHEAD of the WM: the WM's register regressed, which only a rollback repairs.
     */
    private async syncInner(
        device: Device,
        opts: { rejoin?: boolean; approvedRevert?: number },
    ): Promise<HostSyncResult> {
        const { wm } = this;
        if (!wm) {
            // WITHOUT A WM a sync is a catch-up to the replica's head, which the device persists:
            // genesis on first use, and after every write this host has stored
            const r = await this.catchUpInner(device);

            return { counter: r.counter, root: r.root, how: 'catchUp' };
        }
        const round = await this.openManagerRound(device, wm);
        const { nonce, dev } = round;
        const ingest = async (a: Attestation) =>
            expectReply(
                await device({
                    name: 'WardIngestAttestation',
                    message: liveStep(a),
                }),
                'WardIngestAttestationAck',
            );
        let { att } = round;
        let ingested = await ingest(att);
        // THE DEVICE DETECTS a WM restored below its head; the round stays open for the roll-forward
        let rolledForward: RollForwardResult | undefined;
        if (ingested.wm_behind) {
            const r = await this.rollForward(device, wm, nonce, att);
            if (r.result) {
                ({ att } = r);
                rolledForward = r.result;
                ingested = await ingest(att);
            }
            if (ingested.wm_behind) {
                throw new RelayFailure(
                    'wm_behind',
                    `the device is at ${ingested.stored_counter ?? dev.counter} but the WM holds ` +
                        `${att.toCounter}`,
                );
            }
        }

        const to: Head = { counter: att.toCounter, root: rootOf(toHex(att.toRoot)) };
        const from: Head = { counter: att.fromCounter, root: rootOf(toHex(att.fromRoot)) };
        const { trie } = await this.replica();
        const into = to.counter === 0 ? null : trie.linksEndingAt(to.counter, to.root, 1)[0];
        if (to.counter !== 0 && !into) {
            throw new RelayFailure(
                'internal',
                'this replica does not hold the link into the WM head',
            );
        }

        if (dev.counter > to.counter) {
            throw new RelayFailure(
                'wm_behind',
                `the device is at ${dev.counter} but the WM holds ${to.counter}`,
            );
        }
        // A REJOIN ONLY WHEN ASKED, and only from a branch this replica can name: it discards the
        // device's changes above the fork, which the user confirms on the device.
        const fork = opts.rejoin ? this.forkOf(trie, dev, to) : null;
        if (fork !== null) {
            const r = expectReply(
                await this.answerChain(
                    device,
                    trie,
                    await device({ name: 'WardRejoin', message: { fork_counter: fork } }),
                ),
                'WardRejoinAck',
            );

            return {
                counter: r.counter ?? 0,
                root: r.new_root || null,
                how: 'rejoin',
                discarded: r.discarded ?? 0,
            };
        }
        try {
            // AT THE HEAD, OR ONE STEP BELOW IT: the link into the head. At the same counter on
            // another branch, or one below it on another branch, the device refuses -- it holds
            // the root this host was not told.
            // A caller may have lost the publication reply. If the history has a gap,
            // the device can still recognize the exact revert it approved in this session.
            const missingRevertHistory =
                into?.operation === 'revert' &&
                dev.counter < from.counter &&
                !trie
                    .linksEndingAt(from.counter, from.root, trie.links.length)
                    .some(link => link.fromCounter === dev.counter);
            if (
                dev.counter === to.counter ||
                dev.counter === from.counter ||
                (opts.approvedRevert === to.counter && into?.operation === 'revert') ||
                missingRevertHistory
            ) {
                const r = expectReply(
                    await device({
                        name: 'WardReconcile',
                        message: opt('auth_commit', into?.authCommit),
                    }),
                    'WardReconcileAck',
                );

                return {
                    counter: r.counter ?? 0,
                    root: r.new_root || null,
                    how: 'reconcile',
                    ...(rolledForward ? { rolledForward } : {}),
                };
            }
            // FURTHER BELOW: the device walks the chain back to its own head, and is the judge
            // of whether it gets there.
            const r = expectReply(
                await this.answerChain(
                    device,
                    trie,
                    await device({ name: 'WardVerifyChain', message: {} }),
                ),
                'WardVerifyChainAck',
            );

            return {
                counter: r.counter ?? 0,
                root: r.new_root || null,
                how: 'verifyChain',
                ...(rolledForward ? { rolledForward } : {}),
            };
        } catch (e) {
            // A REFUSAL THAT A FORK EXPLAINS is reported as one: the user can then choose to rejoin.
            const forked =
                e instanceof RelayFailure &&
                e.code === 'device_failure' &&
                this.forkOf(trie, dev, to);
            if (forked !== null && forked !== false) {
                throw new RelayFailure(
                    'needs_rejoin',
                    `the device's head is off the WM's history; they share counter ${forked} (${e.message})`,
                );
            }
            throw e;
        }
    }

    /**
     * The counter the device's branch shares with the WM's, or null if this replica cannot say.
     *
     * ABOVE GENESIS THE DEVICE NAMES ITS COUNTER BUT NOT ITS ROOT (apps/ward/sync.py), so the
     * candidates are the roots this replica holds at that counter that are OFF the WM's history.
     * One such branch is a fork this replica can name; none, or several, is not.
     */
    private forkOf(trie: WardTrie, dev: Head, to: Head): number | null {
        const onWmLine = new Set(
            trie
                .linksEndingAt(to.counter, to.root, Number.MAX_SAFE_INTEGER)
                .map(l => `${l.toCounter}/${toHex(l.toRoot ?? EMPTY_ROOT)}`),
        );
        onWmLine.add(`${to.counter}/${toHex(to.root ?? EMPTY_ROOT)}`);
        const candidates =
            dev.counter === 0
                ? [dev.root]
                : trie.links.filter(l => l.toCounter === dev.counter).map(l => l.toRoot);
        const forks = new Set<number>();
        for (const root of candidates) {
            if (onWmLine.has(`${dev.counter}/${toHex(root ?? EMPTY_ROOT)}`)) continue;
            const f = trie.forkPoint([dev.counter, root], [to.counter, to.root]);
            if (f !== null) forks.add(f);
        }

        return forks.size === 1 ? [...forks][0]! : null;
    }

    /**
     * Drain the device's offline queue. Each round publishes one transition -- a single change, or
     * up to `maxBatch` folded into one -- and then syncs, because the device's head moves only when
     * the WM confirms, and the next change derives against that head.
     */
    private async flushInner(
        device: Device,
        opts: { maxBatch?: number },
    ): Promise<HostFlushResult> {
        const maxBatch = opts.maxBatch ?? 1;
        let synced = await this.syncInner(device, {});
        let published = 0;
        let remaining = 0;
        for (let round = 0; round < MAX_FLUSH_ROUNDS; round++) {
            const { trie } = await this.replica();
            let reply = await device({
                name: 'WardFlushQueue',
                message: maxBatch > 1 ? { max_batch: maxBatch } : {},
            });
            // CUMULATIVE: every change folded so far, so each proof is against the running root
            const staged: [Uint8Array, Uint8Array][] = [];
            while (reply.name === 'WardEntryRequest') {
                const req = reply.message as WardEntryRequestJson;
                if (req.staged?.entry_key && req.staged.commit) {
                    staged.push([toBytes(req.staged.entry_key), toBytes(req.staged.commit)]);
                }
                reply = await device({
                    name: 'WardEntryAck',
                    message: serveEntry(trie, req, staged) as unknown as Json,
                });
            }
            if (reply.name === 'WardFlushQueueApplied') {
                throw new RelayFailure(
                    'bad_request',
                    'this is a service build: the device publishes to the WARD service itself',
                );
            }
            const res = expectReply(reply, 'WardFlushQueueAck') as WardResultJson & {
                remaining?: number;
            };
            remaining = res.remaining ?? 0;
            if (!res.entry_key && !res.leaves?.length) break; // the queue was empty
            await this.applyInner(res);
            published++;
            synced = await this.syncInner(device, {});
            if (!remaining) break;
        }

        return { counter: synced.counter, root: synced.root, published, remaining };
    }
}
