import fc from 'fast-check';

import { DEVICE_NOT_FOUND, UNEXPECTED_ERROR } from '../errors';
import { type Descriptor, PathInternal, type PathPublic, type Session } from '../types';
import { SessionsBackground } from './background';
import { SessionsClient } from './client';

/**
 * Disconnect/reconnect fuzz harness for the sessions lock protocol.
 *
 * background.fuzz.test.ts fuzzes concurrent acquire/steal/release arrival order
 * but deliberately keeps the device connected for the whole run. The paths this
 * PR touches live exactly in the window it does not model:
 *   - releaseDone arriving after the descriptor vanished (device disconnected
 *     between releaseIntent and releaseDone) must error DEVICE_NOT_FOUND and
 *     STILL free the lock taken by releaseIntent,
 *   - acquireDone arriving after a disconnect must not commit a phantom session,
 *   - reconnects re-mint a fresh public path while stale-path requests are
 *     still in flight (including parked inside waitInQueue),
 *   - internal paths are raw USB serials, so hostile serials colliding with
 *     Object.prototype members ('toString', '__proto__', 'hasOwnProperty')
 *     must behave like any other path (null-prototype dictionaries).
 *
 * The technique is the same as the base harness: SessionsBackground is a
 * single-threaded message processor, so we fuzz the arrival order of client
 * messages and admin enumerateDone (disconnect/reconnect) events, fire without
 * awaiting, and flush microtasks between fires. The 4s lock safety-net timer
 * never gets a chance to run, so every liveness observation below is about the
 * lock mechanics themselves.
 *
 * Invariants asserted after every run settles:
 *   INV-A (safety): at most one simultaneously committed owner per device.
 *         A disconnect legitimately supersedes all owners (the background
 *         deleted the descriptor); a steal supersedes only the owner whose
 *         session was deliberately claimed as `previous`.
 *   INV-B (liveness, no-timer world): every client reaches a terminal state
 *         and background.locksQueue is empty - each waitInQueue was paired
 *         with a clearLock. A leaked lock (e.g. releaseDone bailing out before
 *         clearing) shows up as a wedged actor and a non-empty queue.
 *   INV-C (no crashes): handleMessage never resolves with the UNEXPECTED_ERROR
 *         catch-all and never rejects. Either one means an unhandled throw
 *         inside the background (on pre-fix code: releaseDone dereferencing the
 *         deleted descriptor). Note: under jest the catch-all's console.error
 *         is trapped by JestCustomEnv and re-thrown, so a background crash
 *         surfaces here as a REJECTED handleMessage rather than the
 *         UNEXPECTED_ERROR response - both are counted.
 *   INV-D (no pollution): device registration always succeeds even for hostile
 *         serials, and Object.prototype stays untouched afterwards.
 */

// enough microtask turns to let any unblocked handleMessage chain settle
const flushMicrotasks = async () => {
    for (let i = 0; i < 16; i += 1) {
        await Promise.resolve();
    }
};

// internal paths are raw USB serial numbers reported by the device; a hostile
// or broken device can present a serial colliding with Object.prototype members
const INTERNAL_PATHS = ['dev-1', 'toString', '__proto__', 'hasOwnProperty'] as const;

const committedSession = (
    descriptors: Descriptor[],
    publicPath: PathPublic | null,
): Session | null =>
    publicPath === null ? null : (descriptors.find(d => d.path === publicPath)?.session ?? null);

const isUnexpected = (res: { success: boolean; error?: { code?: string } }) =>
    !res.success && res.error?.code === UNEXPECTED_ERROR;

type Phase = 'idle' | 'acquired' | 'committed' | 'releasing' | 'done';

interface Actor {
    index: number;
    client: SessionsClient;
    steals: boolean;
    phase: Phase;
    busy: boolean; // request in flight; a real client awaits the reply before the next request
    targetPath: PathPublic | null; // public path captured when acquireIntent fired (may go stale)
    granted: Session | null;
    internalPath: PathInternal | null;
}

interface RunState {
    // committed-and-not-superseded owners; see INV-A above for what counts as
    // a legitimate supersede (steal of a claimed session, or a disconnect)
    owners: { client: number; session: Session }[];
    maxOwners: number;
    observedCurrent: Session | null;
    // sessions some client deliberately claimed as `previous` - only these make
    // a releaseRequest a legitimate supersede (same oracle as the base harness)
    claimedPreviouses: Session[];
    connected: boolean;
    currentPublicPath: PathPublic | null;
    lastPublicPath: PathPublic | null; // survives disconnect; used to fire stale-path requests
    generation: number;
    adminBusy: boolean;
    unexpectedErrors: number;
    registrationFailures: number;
}

// aggregated across all fc runs: proves the fuzzer actually reaches the code
// paths this PR changed (a green run that never disconnects proves nothing)
interface Sentinels {
    reconnects: number;
    acquireIntentOnMissingDevice: number;
    acquireDoneAfterDisconnect: number;
    releaseDoneAfterDisconnect: number;
}

interface RunResult {
    maxOwners: number;
    allReachedDone: boolean;
    locksQueueLength: number;
    unexpectedErrors: number;
    registrationFailures: number;
    probeSettled: boolean;
}

const runDisconnectChurn = async (
    script: number[],
    clientCount: number,
    steals: boolean[],
    pathPool: string[],
    sentinels: Sentinels,
): Promise<RunResult> => {
    const background = new SessionsBackground();
    const admin = new SessionsClient(background);
    await admin.handshake();

    const state: RunState = {
        owners: [],
        maxOwners: 0,
        observedCurrent: null,
        claimedPreviouses: [],
        connected: false,
        currentPublicPath: null,
        lastPublicPath: null,
        generation: 0,
        adminBusy: false,
        unexpectedErrors: 0,
        registrationFailures: 0,
    };

    const connectDevice = (res: Awaited<ReturnType<SessionsClient['enumerateDone']>>) => {
        if (isUnexpected(res)) state.unexpectedErrors += 1;
        if (!res.success || res.payload.descriptors.length !== 1) {
            // the device presented a serial and did not get registered - on
            // prototype-keyed dictionaries this is what 'toString' paths do
            state.registrationFailures += 1;

            return;
        }
        state.connected = true;
        state.currentPublicPath = res.payload.descriptors[0]?.path ?? null;
        state.lastPublicPath = state.currentPublicPath ?? state.lastPublicPath;
        state.observedCurrent = committedSession(res.payload.descriptors, state.currentPublicPath);
    };

    // initial connect, generation 0
    connectDevice(
        await admin.enumerateDone({
            descriptors: [{ path: PathInternal(pathPool[0] as string), type: 1, apiType: 'usb' }],
        }),
    );
    state.generation = 1;

    const fireDisconnect = () => {
        if (state.adminBusy || !state.connected) return;
        state.adminBusy = true;
        admin.enumerateDone({ descriptors: [] }).then(
            res => {
                state.adminBusy = false;
                if (isUnexpected(res)) state.unexpectedErrors += 1;
                // the background deleted the descriptor: every committed owner
                // has been superseded by the disconnect itself
                state.owners = [];
                state.observedCurrent = null;
                state.connected = false;
                state.currentPublicPath = null;
            },
            () => {
                state.unexpectedErrors += 1;
                state.adminBusy = false;
            },
        );
    };

    const fireReconnect = () => {
        if (state.adminBusy || state.connected) return;
        state.adminBusy = true;
        sentinels.reconnects += 1;
        const internal = pathPool[state.generation % pathPool.length] as string;
        state.generation += 1;
        admin
            .enumerateDone({
                descriptors: [{ path: PathInternal(internal), type: 1, apiType: 'usb' }],
            })
            .then(
                res => {
                    state.adminBusy = false;
                    connectDevice(res);
                },
                () => {
                    state.unexpectedErrors += 1;
                    state.adminBusy = false;
                },
            );
    };

    // same oracle as the base harness: a releaseRequest supersedes an owner
    // only if some client deliberately claimed that session as `previous`
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
            targetPath: null,
            granted: null,
            internalPath: null,
        }));

        const advance = (actor: Actor) => {
            if (actor.busy || actor.phase === 'done') return;

            if (actor.phase === 'idle') {
                // while disconnected, fire against the last known (stale) public
                // path - that is what a real client with outdated descriptors does
                const target = state.currentPublicPath ?? state.lastPublicPath;
                if (!target) {
                    actor.phase = 'done';

                    return;
                }
                const previous = actor.steals ? state.observedCurrent : null;
                if (previous !== null) state.claimedPreviouses.push(previous);
                actor.targetPath = target;
                actor.busy = true;
                actor.client.acquireIntent({ path: target, previous }).then(
                    res => {
                        actor.busy = false;
                        if (isUnexpected(res)) state.unexpectedErrors += 1;
                        if (res.success) {
                            actor.granted = res.payload.session;
                            actor.phase = 'acquired';
                        } else {
                            if (!res.success && res.error.code === DEVICE_NOT_FOUND) {
                                sentinels.acquireIntentOnMissingDevice += 1;
                            }
                            actor.phase = 'done';
                        }
                    },
                    () => {
                        // rejection = crash inside the background (see INV-C)
                        state.unexpectedErrors += 1;
                        actor.busy = false;
                        actor.phase = 'done';
                    },
                );
            } else if (actor.phase === 'acquired') {
                actor.busy = true;
                actor.client.acquireDone({ path: actor.targetPath as PathPublic }).then(
                    res => {
                        actor.busy = false;
                        if (isUnexpected(res)) state.unexpectedErrors += 1;
                        if (res.success && actor.granted) {
                            state.owners.push({ client: actor.index, session: actor.granted });
                            state.maxOwners = Math.max(state.maxOwners, state.owners.length);
                            state.observedCurrent = committedSession(
                                res.payload.descriptors,
                                state.currentPublicPath,
                            );
                            actor.phase = 'committed';
                        } else {
                            // disconnect landed between acquireIntent and
                            // acquireDone - no phantom session may be committed
                            if (!res.success && res.error.code === DEVICE_NOT_FOUND) {
                                sentinels.acquireDoneAfterDisconnect += 1;
                            }
                            actor.phase = 'done';
                        }
                    },
                    () => {
                        state.unexpectedErrors += 1;
                        actor.busy = false;
                        actor.phase = 'done';
                    },
                );
            } else if (actor.phase === 'committed') {
                actor.busy = true;
                actor.client.releaseIntent({ session: actor.granted as Session }).then(
                    res => {
                        actor.busy = false;
                        if (isUnexpected(res)) state.unexpectedErrors += 1;
                        if (res.success) {
                            actor.internalPath = res.payload.path;
                            actor.phase = 'releasing';
                        } else {
                            actor.phase = 'done';
                        }
                    },
                    () => {
                        state.unexpectedErrors += 1;
                        actor.busy = false;
                        actor.phase = 'done';
                    },
                );
            } else if (actor.phase === 'releasing') {
                actor.busy = true;
                actor.client.releaseDone({ path: actor.internalPath as PathInternal }).then(
                    res => {
                        actor.busy = false;
                        if (isUnexpected(res)) state.unexpectedErrors += 1;
                        const owned = state.owners.findIndex(o => o.client === actor.index);
                        if (owned >= 0) state.owners.splice(owned, 1);
                        if (res.success) {
                            state.observedCurrent = committedSession(
                                res.payload.descriptors,
                                state.currentPublicPath,
                            );
                        } else if (res.error.code === DEVICE_NOT_FOUND) {
                            // THE path this PR fixes: descriptor vanished between
                            // releaseIntent and releaseDone; must error (not
                            // crash) and must have freed the releaseIntent lock
                            sentinels.releaseDoneAfterDisconnect += 1;
                        }
                        actor.phase = 'done';
                    },
                    () => {
                        state.unexpectedErrors += 1;
                        actor.busy = false;
                        actor.phase = 'done';
                    },
                );
            }
        };

        // Phase 1: fuzzed arrival order of client messages and plug/unplug events.
        // Slot clientCount = disconnect, slot clientCount+1 = reconnect.
        for (const pick of script) {
            const slot = pick % (clientCount + 2);
            if (slot === clientCount) {
                fireDisconnect();
            } else if (slot === clientCount + 1) {
                fireReconnect();
            } else {
                const actor = actors[slot];
                if (actor) advance(actor);
            }

            await flushMicrotasks();
        }

        // Phase 2 (liveness): fairly drive every client to a terminal state.
        // No admin events here - actors either finish their protocol against the
        // final device state or fail fast against a missing device. A round with
        // no phase change means someone is wedged behind a leaked lock.
        for (let round = 0; round < clientCount * 20; round += 1) {
            if (actors.every(a => a.phase === 'done')) break;
            const before = actors.map(a => a.phase).join('|');
            actors.forEach(a => advance(a));

            await flushMicrotasks();
            if (actors.map(a => a.phase).join('|') === before) break;
        }

        // Wedge probe: after the churn the device (reconnected if needed) must
        // be acquirable with microtasks only - i.e. without sitting out the 4s
        // safety-net timer of a leaked lock.
        if (!state.connected) {
            fireReconnect();
            await flushMicrotasks();
        }
        let probeSettled = false;
        let probeSuccess = false;
        const probePath = state.currentPublicPath;
        if (probePath) {
            const sessionsRes = await admin.getSessions();
            const current = sessionsRes.success
                ? committedSession(sessionsRes.payload.descriptors, probePath)
                : null;
            admin.acquireIntent({ path: probePath, previous: current }).then(
                res => {
                    probeSettled = true;
                    probeSuccess = res.success;
                },
                () => {
                    state.unexpectedErrors += 1;
                    probeSettled = true;
                },
            );
            await flushMicrotasks();
            if (probeSuccess) {
                // free the lock the probe's own acquireIntent took
                await admin.acquireDone({ path: probePath, abort: true });
                await flushMicrotasks();
            }
        }

        return {
            maxOwners: state.maxOwners,
            allReachedDone: actors.every(a => a.phase === 'done'),
            // INV-B: every waitInQueue must have been paired with a clearLock;
            // with the 4s timers never firing, a leak is a non-empty queue
            locksQueueLength: (background as unknown as { locksQueue: unknown[] }).locksQueue
                .length,
            unexpectedErrors: state.unexpectedErrors,
            registrationFailures: state.registrationFailures,
            probeSettled,
        };
    } finally {
        background.dispose();
    }
};

const churn = (maxClients: number) =>
    fc.integer({ min: 2, max: maxClients }).chain(clientCount =>
        fc.record({
            clientCount: fc.constant(clientCount),
            steals: fc.array(fc.boolean(), { minLength: clientCount, maxLength: clientCount }),
            // internal serial per device generation; reconnects cycle through the
            // pool, so a 1-element pool re-mints the SAME serial (new public path)
            pathPool: fc.array(fc.constantFrom(...INTERNAL_PATHS), {
                minLength: 1,
                maxLength: 3,
            }),
            script: fc.array(fc.integer({ min: 0, max: clientCount + 1 }), {
                minLength: 2,
                maxLength: 25,
            }),
        }),
    );

describe('sessions fuzz (disconnect/reconnect churn)', () => {
    it('INV A-D: safety, no leaked lock, no crash, no pollution under unplug churn', async () => {
        const sentinels: Sentinels = {
            reconnects: 0,
            acquireIntentOnMissingDevice: 0,
            acquireDoneAfterDisconnect: 0,
            releaseDoneAfterDisconnect: 0,
        };

        await fc.assert(
            fc.asyncProperty(churn(4), async ({ clientCount, steals, pathPool, script }) => {
                const result = await runDisconnectChurn(
                    script,
                    clientCount,
                    steals,
                    pathPool,
                    sentinels,
                );

                // INV-C: an UNEXPECTED_ERROR response is an unhandled throw
                // inside the background (pre-fix releaseDone crashed here)
                expect(result.unexpectedErrors).toBe(0);
                // INV-D: hostile serials must register like any other path
                expect(result.registrationFailures).toBe(0);
                // INV-A: never two simultaneously committed owners
                expect(result.maxOwners).toBeLessThanOrEqual(1);
                // INV-B: nobody wedged, queue fully drained, device operable
                expect(result.allReachedDone).toBe(true);
                expect(result.probeSettled).toBe(true);
                expect(result.locksQueueLength).toBe(0);

                // INV-D: Object.prototype stays unpolluted after hostile paths
                const probe: Record<string, unknown> = {};
                expect(probe.session).toBeUndefined();
                expect(probe.sessionOwner).toBeUndefined();
                expect(probe['dev-1']).toBeUndefined();
                expect(Object.keys(Object.prototype)).toHaveLength(0);
            }),
            { numRuns: 5000 },
        );

        // Prove the fuzzer reached the disconnect windows this PR changed - a
        // green run that never hit them would be vacuous. Hit rates are far
        // above per-mille, so over thousands of runs these cannot flake.
        expect(sentinels.reconnects).toBeGreaterThan(0);
        expect(sentinels.acquireIntentOnMissingDevice).toBeGreaterThan(0);
        expect(sentinels.acquireDoneAfterDisconnect).toBeGreaterThan(0);
        expect(sentinels.releaseDoneAfterDisconnect).toBeGreaterThan(0);
    }, 240000);
});
