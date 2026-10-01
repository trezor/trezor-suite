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
import {
    EMPTY_ROOT,
    type RelayErrorCode,
    type RelayMessage,
    type WardEntryRequestJson,
    type WardResultJson,
    type WardTrie,
    type WmClient,
    WmConflict,
    applyResult as applyToTrie,
    equalBytes,
    leafIsDelete,
    serveChain,
    serveEntry,
    toBytes,
    toHex,
    verifyWmSig,
} from '@trezor/ward-core';

import { type StoredLink, type WardBackend, hexOrNull } from './backend';
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

    return reply.message as Json;
};

/** The wire's root: absent, empty and EMPTY_ROOT all mean the empty tree. */
const rootOf = (v: string | null | undefined): Uint8Array | null => {
    if (!v) return null;
    const b = toBytes(v);

    return equalBytes(b, EMPTY_ROOT) ? null : b;
};

/** Bytes to the wire, leaving the field out when it is absent -- never `null`. */
const opt = (key: string, v: Uint8Array | null | undefined): Json =>
    v && v.length ? { [key]: toHex(v) } : {};

export interface HostSyncResult {
    counter: number;
    root: string | null;
    how: 'reconcile' | 'verifyChain' | 'rejoin';
    discarded?: number;
}

export interface HostFlushResult {
    counter: number;
    root: string | null;
    published: number;
    remaining: number;
}

/** A guard against a device that keeps offering changes without its queue shrinking. */
const MAX_FLUSH_ROUNDS = 1000;

export class WardHost {
    private queue: Promise<unknown> = Promise.resolve();

    constructor(
        readonly wardId: Uint8Array,
        private readonly backend: WardBackend,
        private readonly wm: WmClient,
        private readonly onWmChange: () => void | Promise<void> = () => {},
    ) {}

    /** Run `fn` with this wallet to itself. */
    exclusive<T>(fn: () => Promise<T>): Promise<T> {
        const run = this.queue.then(fn, fn);
        this.queue = run.catch(() => {});

        return run;
    }

    async replica(): Promise<Replica> {
        return materialize(await this.backend.load(), await this.wm.head(this.wardId));
    }

    status() {
        return this.exclusive(async () => {
            const { head, behind } = await this.replica();
            const wmHead = await this.wm.head(this.wardId);

            return {
                counter: head.counter,
                root: hexOrNull(head.root),
                wmCounter: wmHead?.counter ?? null,
                wmRoot: hexOrNull(wmHead?.root),
                behind,
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

    flush(device: Device, opts: { maxBatch?: number } = {}) {
        return this.exclusive(() => this.flushInner(device, opts));
    }

    /**
     * Store a confirmed transition, THEN publish it. The order is the host obligation: a WM that
     * advanced to a head no replica holds has a wallet nobody can serve. Losing a race to another
     * host between the two leaves the row as a dead branch -- harmless, and kept, since it is this
     * device's side of any later rejoin.
     */
    private async applyInner(result: WardResultJson) {
        const { trie, head } = await this.replica();
        if (!result.auth_commit) {
            applyToTrie(trie, result); // refuses a "no change" the replica contradicts

            return { counter: head.counter, root: hexOrNull(head.root), published: false };
        }
        // MINTED ON THIS HEAD, OR NOT AT ALL. A single-leaf result does not name its `from` state,
        // so applying it to whatever head the replica is at now would build a tree the device never
        // built. The counter must follow on from the head, and the device's `wm_sig` -- which covers
        // both ends and the WM's current nonce -- must verify over exactly this step: then the row
        // stored below is the step the device authorised, and nothing else ever is.
        const fromCounter = result.leaves?.length ? result.from_counter : (result.counter ?? 0) - 1;
        if (fromCounter !== head.counter || !result.wm_sig) {
            throw new RelayFailure(
                'wm_conflict',
                `this result was minted against counter ${fromCounter}; the head is at ` +
                    `${head.counter}. Sync and flush again`,
            );
        }
        applyToTrie(trie, result);
        const toRoot = trie.root();
        const headNonce = await this.wm.headNonce(this.wardId);
        const minted =
            headNonce &&
            verifyWmSig(
                this.wardId,
                head.counter,
                head.root,
                result.counter!,
                toRoot,
                headNonce,
                toBytes(result.wm_sig),
            );
        if (!minted) {
            throw new RelayFailure(
                'wm_conflict',
                'this result was not minted on the current head; sync and flush again',
            );
        }
        const changes = result.leaves?.length
            ? result.leaves.map(leaf => ({
                  entryKey: leaf.entry_key ?? '',
                  leaf: leafIsDelete(leaf)
                      ? null
                      : { identity: leaf.identity, content: leaf.content },
              }))
            : [
                  {
                      entryKey: result.entry_key ?? '',
                      leaf: leafIsDelete(result)
                          ? null
                          : { identity: result.identity, content: result.content },
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
        try {
            await this.wm.advance({
                wardId: this.wardId,
                fromCounter: link.fromCounter,
                fromRoot: head.root,
                toCounter: link.toCounter,
                toRoot,
                wmSig: toBytes(result.wm_sig),
            });
        } catch (e) {
            if (e instanceof WmConflict) {
                throw new RelayFailure(
                    'wm_conflict',
                    `another writer moved the WM head to ${e.headCounter}; sync and retry`,
                );
            }
            throw e;
        }
        await this.onWmChange();

        return { counter: link.toCounter, root: link.toRoot, published: true };
    }

    private async answerChain(device: Device, trie: WardTrie, reply: RelayMessage) {
        while (reply.name === 'WardChainRequest') {
            const req = reply.message as Json;
            reply = await device({
                name: 'WardChainLinkAck',
                message: { links: serveChain(trie, req.to_counter ?? 0, req.to_root ?? null) },
            });
        }

        return reply;
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
    private async syncInner(device: Device, opts: { rejoin?: boolean }): Promise<HostSyncResult> {
        const ack = expectReply(await device({ name: 'WardSync', message: {} }), 'WardSyncAck');
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

        if (!(await this.wm.headNonce(wardId))) {
            // ENROLMENT IS GENESIS ONLY: see MockWM.attest_head for why a WM must not be seeded
            // from whatever head the first device to reach it happens to hold.
            if (dev.counter !== 0) {
                throw new RelayFailure(
                    'internal',
                    'the WM does not know this wallet and enrols only at counter 0',
                );
            }
            await this.wm.enrol(wardId, dev.root, toBytes(ack.head_init_sig ?? ''));
            await this.onWmChange();
        }

        const att = await this.wm.attest(wardId, toBytes(ack.nonce ?? ''));
        expectReply(
            await device({
                name: 'WardIngestAttestation',
                message: {
                    from_counter: att.fromCounter,
                    ...opt('from_root', rootOf(toHex(att.fromRoot))),
                    to_counter: att.toCounter,
                    ...opt('to_root', rootOf(toHex(att.toRoot))),
                    wm_signature: toHex(att.signature),
                    from_head_nonce: toHex(att.fromHeadNonce),
                    to_head_nonce: toHex(att.toHeadNonce),
                    timestamp: att.timestamp,
                },
            }),
            'WardIngestAttestationAck',
        );

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
            if (dev.counter === to.counter || dev.counter === from.counter) {
                const r = expectReply(
                    await device({
                        name: 'WardReconcile',
                        message: opt('auth_commit', into?.authCommit),
                    }),
                    'WardReconcileAck',
                );

                return { counter: r.counter ?? 0, root: r.new_root || null, how: 'reconcile' };
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

            return { counter: r.counter ?? 0, root: r.new_root || null, how: 'verifyChain' };
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
