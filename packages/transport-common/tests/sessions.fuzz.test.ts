import fc from 'fast-check';

import { SessionsBackground } from '../src/sessions/background';
import { SessionsClient } from '../src/sessions/client';
import { Descriptor, PathInternal, PathPublic, Session } from '../src/types';

/**
 * Concurrency fuzz harness for the sessions lock / stealing protocol.
 *
 * The hand-written tests in sessions.test.ts are strictly sequential: every
 * message is awaited before the next is sent, so two handleMessage calls are
 * never in flight at once - which is exactly the window where lock races live.
 *
 * SessionsBackground is a single-threaded message processor whose only
 * non-determinism is the order in which concurrent clients' messages arrive and
 * interleave at internal `await` points. So we let fast-check fuzz that arrival
 * order: each client is a small state machine, we "fire" its next message
 * without awaiting, and flush microtasks between fires. A message that must wait
 * for the lock simply stays pending until another client's message frees it -
 * real lock mechanics, no fake timers, no safety-net involved.
 *
 * Each client either acquires a device it believes is free (previous: null) or
 * STEALS it from the current owner (previous: last observed session) - the
 * session-takeover flow Suite uses against the bridge.
 *
 * The session lifecycle under test:
 *   acquireIntent(previous) -> reserves a fresh session under the lock,
 *                              returns it (+ a releaseRequest when stealing)
 *   acquireDone(path)       -> commits the session, releases the lock
 *   releaseIntent(session)  -> takes the lock if the session is current
 *   releaseDone(path)       -> clears the session, releases the lock
 *
 * The system under test is the real SessionsBackground - no mocks - so any
 * counterexample is a real defect, and fast-check shrinks the arrival order to
 * the minimal interleaving that breaks the invariant.
 */

const DEVICE_INTERNAL = PathInternal('dev-1');
// enumerateDone assigns incrementing public paths starting at '1' for the
// first device it sees.
const DEVICE_PUBLIC = PathPublic('1');

// Enough microtask turns to let any unblocked handleMessage chain settle. The
// lock's only macrotask is a 4s safety-net timer we intentionally never wait
// for, so draining microtasks is all that is needed to observe steady state.
const flushMicrotasks = async () => {
    for (let i = 0; i < 16; i += 1) {
        await Promise.resolve();
    }
};

const setupSingleDevice = async () => {
    const background = new SessionsBackground();
    const admin = new SessionsClient(background);
    await admin.handshake();
    await admin.enumerateDone({
        descriptors: [{ path: DEVICE_INTERNAL, type: 1, apiType: 'usb' }],
    });

    return background;
};

const committedSession = (descriptors: Descriptor[]): Session | null =>
    descriptors.find(d => d.path === DEVICE_PUBLIC)?.session ?? null;

type Phase = 'idle' | 'acquired' | 'committed' | 'releasing' | 'done';

interface Actor {
    index: number;
    client: SessionsClient;
    steals: boolean; // false: acquire with previous=null; true: steal current session
    phase: Phase;
    busy: boolean; // a request is in flight; a real client awaits its reply before sending the next
    claimedPrevious: Session | null; // the `previous` this client passed to acquireIntent
    granted: Session | null; // session handed out by acquireIntent
    internalPath: PathInternal | null;
}

interface RunState {
    // The owners that currently believe they hold the device: committed, not yet
    // released, and NOT yet told to release. The protocol's only "you have been
    // superseded" signal is the releaseRequest event - so an owner stays here
    // until either it releases itself or it receives a releaseRequest. Two
    // standing owners means someone took the device without the previous owner
    // being notified.
    owners: { client: number; session: Session }[];
    maxOwners: number;
    // shared "what a client last saw as the current session", used as steal target
    observedCurrent: Session | null;
    // Every session some client DELIBERATELY claimed as `previous` (i.e. tried to
    // steal). A releaseRequest only legitimately supersedes an owner if that
    // owner's session is in here - otherwise the releaseRequest is spurious (the
    // acquireIntent dead-guard, race #1, kicking the current owner while granting
    // an acquire that claimed the device was FREE), and the kicked owner must
    // stay standing so INV-1 can observe the double-grant.
    claimedPreviouses: Session[];
}

interface RunOptions {
    withRelease: boolean;
}

/**
 * Advance one client by firing its next message (fire-and-forget). The client
 * never pipelines: while a request is in flight (`busy`) it does nothing, which
 * is how a real client behaves.
 */
const advance = (actor: Actor, state: RunState, options: RunOptions) => {
    if (actor.busy || actor.phase === 'done') return;

    if (actor.phase === 'idle') {
        const previous = actor.steals ? state.observedCurrent : null;
        actor.claimedPrevious = previous;
        // Record a deliberate steal so the releaseRequest oracle can tell a
        // legitimate supersede from the spurious one race #1 produces.
        if (previous !== null) state.claimedPreviouses.push(previous);
        actor.busy = true;
        actor.client.acquireIntent({ path: DEVICE_PUBLIC, previous }).then(
            res => {
                actor.busy = false;
                if (res.success) {
                    actor.granted = res.payload.session;
                    actor.phase = 'acquired';
                } else {
                    actor.phase = 'done';
                }
            },
            () => {
                actor.busy = false;
                actor.phase = 'done';
            },
        );
    } else if (actor.phase === 'acquired') {
        actor.busy = true;
        actor.client.acquireDone({ path: DEVICE_PUBLIC }).then(
            res => {
                actor.busy = false;
                if (res.success && actor.granted) {
                    // Become an owner. Superseding the previous owner is the
                    // protocol's job via releaseRequest (handled in runChurn); if
                    // that signal never fired, the previous owner is still standing
                    // here and we now have two owners of one device - the bug.
                    state.owners.push({ client: actor.index, session: actor.granted });
                    state.maxOwners = Math.max(state.maxOwners, state.owners.length);
                    state.observedCurrent = committedSession(res.payload.descriptors);
                }
                actor.phase = options.withRelease ? 'committed' : 'done';
            },
            () => {
                actor.busy = false;
                actor.phase = 'done';
            },
        );
    } else if (actor.phase === 'committed') {
        actor.busy = true;
        actor.client.releaseIntent({ session: actor.granted as Session }).then(
            res => {
                actor.busy = false;
                if (res.success) {
                    actor.internalPath = res.payload.path;
                    actor.phase = 'releasing';
                } else {
                    actor.phase = 'done';
                }
            },
            () => {
                actor.busy = false;
                actor.phase = 'done';
            },
        );
    } else if (actor.phase === 'releasing') {
        actor.busy = true;
        actor.client.releaseDone({ path: actor.internalPath as PathInternal }).then(
            res => {
                actor.busy = false;
                const owned = state.owners.findIndex(o => o.client === actor.index);
                if (owned >= 0) state.owners.splice(owned, 1);
                if (res.success) state.observedCurrent = committedSession(res.payload.descriptors);
                actor.phase = 'done';
            },
            () => {
                actor.busy = false;
                actor.phase = 'done';
            },
        );
    }
};

interface RunResult {
    maxOwners: number;
    allReachedDone: boolean;
}

/**
 * Run a fuzzed arrival order against a fresh background, then fairly drive every
 * client to completion. Returns the metrics the invariants assert on.
 */
const runChurn = async (
    script: number[],
    clientCount: number,
    steals: boolean[],
    options: RunOptions,
): Promise<RunResult> => {
    const background = await setupSingleDevice();
    const state: RunState = {
        owners: [],
        maxOwners: 0,
        observedCurrent: null,
        claimedPreviouses: [],
    };

    // The protocol's "you have been superseded, please release" signal. When it
    // fires for a session, that owner now knows to step down, so it stops
    // counting as a standing owner - but ONLY if some client deliberately stole
    // that session (claimed it as `previous`). A releaseRequest for a session
    // nobody claimed is the acquireIntent dead-guard (race #1): an acquire that
    // declared the device FREE still kicked the live owner. Honoring it would
    // mask the double-grant, so we ignore it and let INV-1 see two owners.
    background.on('releaseRequest', descriptor => {
        const superseded = descriptor.session;
        if (superseded === null || !state.claimedPreviouses.includes(superseded)) return;
        const notified = state.owners.findIndex(o => o.session === superseded);
        if (notified >= 0) state.owners.splice(notified, 1);
    });

    try {
        const actors: Actor[] = Array.from({ length: clientCount }, (_, i) => ({
            index: i,
            client: new SessionsClient(background),
            steals: steals[i] ?? false,
            phase: 'idle',
            busy: false,
            claimedPrevious: null,
            granted: null,
            internalPath: null,
        }));

        // Phase 1: fuzzed arrival order.
        for (const pick of script) {
            const actor = actors[pick % clientCount];
            if (actor) advance(actor, state, options);

            await flushMicrotasks();
        }

        // Phase 2 (liveness): fairly drive everyone to completion. A correct lock
        // lets every client finish without the 4s safety-net; an orphaned lock
        // leaves someone stuck, so a full round with no phase change means the
        // device is wedged.
        for (let round = 0; round < clientCount * 20; round += 1) {
            if (actors.every(a => a.phase === 'done')) break;
            const before = actors.map(a => a.phase).join('|');
            actors.forEach(a => advance(a, state, options));

            await flushMicrotasks();
            if (actors.map(a => a.phase).join('|') === before) break;
        }

        return {
            maxOwners: state.maxOwners,
            allReachedDone: actors.every(a => a.phase === 'done'),
        };
    } finally {
        // clears any still-pending lock safety-net timers so jest sees no open handles
        background.dispose();
    }
};

const churn = (maxClients: number) =>
    fc.integer({ min: 2, max: maxClients }).chain(clientCount =>
        fc.record({
            clientCount: fc.constant(clientCount),
            steals: fc.array(fc.boolean(), { minLength: clientCount, maxLength: clientCount }),
            script: fc.array(fc.integer({ min: 0, max: clientCount - 1 }), {
                minLength: 2,
                maxLength: 20,
            }),
        }),
    );

describe('sessions fuzz (concurrency + stealing)', () => {
    /**
     * INV-1 (safety): a device has at most one owner at a time.
     * An owner holds from a successful acquire until it releases. A legitimate
     * steal supersedes the owner it claimed via `previous`; a client that
     * acquires "from free" (previous: null) while someone already owns the
     * device must be rejected. Two standing owners == the device was granted
     * twice.
     *
     * Because the oracle only counts an owner as superseded when some client
     * DELIBERATELY stole its session (see `claimedPreviouses` in runChurn), this
     * one invariant fails on BOTH bugs:
     *  - race #1 (acquireIntent dead-guard): a second "from free" acquire wins
     *    against a busy device and kicks the owner with a spurious releaseRequest
     *    nobody asked for -> the owner stays standing -> two owners.
     *  - race #2 (release racing a steal): the late release clobbers the new
     *    owner's session while the previous owner is still standing -> two owners.
     */
    it('INV-1: a device is never owned by two clients at once', async () => {
        await fc.assert(
            fc.asyncProperty(churn(4), async ({ clientCount, steals, script }) => {
                const { maxOwners } = await runChurn(script, clientCount, steals, {
                    withRelease: true,
                });
                expect(maxOwners).toBeLessThanOrEqual(1);
            }),
            // race #1 is caught nearly every run; race #2 surfaces in only ~0.5% of
            // interleavings, so run enough schedules that INV-1 (not just the
            // deterministic VERIFY below) reliably exercises it.
            { numRuns: 2000 },
        );
    }, 30000);

    /**
     * VERIFY (deterministic, no model): the exact race INV-1 shrank to. A
     * release issued while the caller still owned the device, but landing after
     * another client stole and committed, must NOT destroy the new owner's
     * session. The guard is that releaseIntent re-checks ownership after the
     * lock; without it releaseDone (which nulls unconditionally) wipes c1's
     * freshly stolen session while c1 is never told it lost ownership.
     */
    it('VERIFY: a release racing a steal must not destroy the new owner session', async () => {
        const background = await setupSingleDevice();
        const c0 = new SessionsClient(background);
        const c1 = new SessionsClient(background);

        const releaseRequests: (Session | null)[] = [];
        background.on('releaseRequest', d => releaseRequests.push(d.session));

        try {
            // c0 acquires the free device -> session "1"
            await c0.acquireIntent({ path: DEVICE_PUBLIC, previous: null });
            await c0.acquireDone({ path: DEVICE_PUBLIC });

            // c1 steals it (previous "1"); intent succeeds and KEEPS the lock
            const a1 = await c1.acquireIntent({ path: DEVICE_PUBLIC, previous: Session('1') });
            expect(a1).toMatchObject({ success: true });

            // c0, asked to release, starts releasing - blocks behind c1's lock
            const rel0Promise = c0.releaseIntent({ session: Session('1') });

            // c1 commits the steal -> device session becomes "2", unblocks c0
            await c1.acquireDone({ path: DEVICE_PUBLIC });

            const rel0 = await rel0Promise;
            if (rel0.success) {
                await c0.releaseDone({ path: rel0.payload.path });
            }

            const sessions = await c0.getSessions();
            const current = committedSession(sessions.payload.descriptors);

            // c0 was notified it was superseded; c1 was not (it is the new owner).
            // These two document the protocol contract but hold on both the fixed
            // and unfixed code - they are not what distinguishes the race.
            expect(releaseRequests).toContain(Session('1'));
            expect(releaseRequests).not.toContain(Session('2'));
            // LOAD-BEARING: this is the assertion that fails on the unfixed code -
            // without the releaseIntent re-check, c0's release clobbers c1's
            // freshly stolen session and `current` is null instead of "2".
            expect(current).toBe(Session('2'));
        } finally {
            background.dispose();
        }
    });

    /**
     * INV-2 (liveness): the lock never leaks; the device stays operable.
     * After any interleaving, every client can be driven to completion without
     * the 4s safety-net firing. A client left stuck means a lock was orphaned
     * (e.g. clearLock freeing the queue head instead of the caller's own lock).
     *
     * Note: this guards SessionsBackground liveness only. The lock LEAK this PR
     * fixes lives one layer up - in the transport-bridge core / AbstractApiTransport
     * wrappers (acquire/release around openDevice/closeDevice) - which this harness
     * does not instantiate; that leak is covered by transport-bridge/tests/core.test.ts.
     * INV-2 is kept as a forward-looking regression guard for the lock itself.
     */
    it('INV-2: the device never wedges (no orphaned lock)', async () => {
        await fc.assert(
            fc.asyncProperty(churn(4), async ({ clientCount, steals, script }) => {
                const { allReachedDone } = await runChurn(script, clientCount, steals, {
                    withRelease: true,
                });
                expect(allReachedDone).toBe(true);
            }),
            { numRuns: 300 },
        );
    }, 30000);
});
