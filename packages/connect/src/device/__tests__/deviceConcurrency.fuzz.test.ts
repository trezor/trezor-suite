/**
 * Deterministic interleaving fuzz harness for the per-device run-queue (PHASE 2).
 *
 * Scope: the `Device` concurrency seams documented in `../CONCURRENCY_MODEL.md`
 * — `run` / `_runInner`, `interrupt`, `acquire` / `release`, `keepTransportSession`
 * and the externally-driven `usedElsewhere` transition. The heavy firmware /
 * handshake / feature-reload middle of `_runInner` is stubbed out so the harness
 * exercises the *queue* mechanics, while `acquire` / `release` and the
 * `sessionDfd` session machinery run for real against a controllable transport.
 *
 * DeviceList consistency (INV-5) and core override dispatch live in a separate
 * harness (those need DeviceList / Core, not a single Device) and are out of
 * scope for this file.
 *
 * fast-check generates a sequence of operations; after every step and at
 * quiescence the harness asserts the invariants:
 *   INV-1 mutual exclusion — at most one run body live at any time.
 *   INV-2 liveness         — every issued run settles; the system drains.
 *   INV-3 session balance  — releases never exceed acquires; no dangling session.
 *   INV-4 abort/override    — interrupt settles and leaves the device runnable.
 *
 * Run a longer hunt with: `yarn workspace @trezor/connect test:fuzz`
 * (raise FUZZ_RUNS / drop the fixed seed via env to search harder).
 */
import fc from 'fast-check';

import { noopCreateLogger } from '@trezor/connect-common/src/utils/debug';
import { TRANSPORT } from '@trezor/transport-common';
import { type Deferred, createDeferred } from '@trezor/utils';

import { Device } from '../Device';
import {
    type ControllableTransport,
    createControllableTransport,
} from './support/controllableTransport';

// Neutralise the firmware / handshake middle of _runInner so only the run-queue
// and session mechanics remain. These modules issue real transport messages
// that are irrelevant to the concurrency invariants under test.
jest.mock('../workflow/handshake', () => ({
    handshakeCancel: jest.fn(() => Promise.resolve()),
    handshake: jest.fn(() => Promise.resolve()),
}));
jest.mock('../workflow/checkFirmwareHashWithRetries', () => ({
    checkFirmwareHashWithRetries: jest.fn(() => Promise.resolve()),
}));

const PATH = '1' as any;

type Op =
    | { t: 'run'; keepSession: boolean }
    | { t: 'completeAcquire' }
    | { t: 'completeAcquireFail' }
    | { t: 'completeFn' }
    | { t: 'completeRelease' }
    | { t: 'completeMessage' }
    | { t: 'interrupt' }
    | { t: 'requestRelease' }
    | { t: 'externalSession' };

// Alphabet: the per-device run-queue core (run / acquire / fn / release /
// interrupt / keepSession) plus the externally-driven `externalSession`
// transition. `externalSession` opens the acquire-vs-session-change race
// (`Device.updateDescriptor` awaiting a rejecting `acquirePromise`) — confirmed
// in PHASE 3 as a real unhandled-rejection bug (see
// `deviceSessionRace.repro.test.ts`) and fixed via `Promise.allSettled`. It is
// now generated so the fix is exercised under arbitrary interleavings, with the
// "no leaked updateDescriptor rejection" check below asserting INV-2.
const opArb: fc.Arbitrary<Op> = fc.oneof(
    fc.record({ t: fc.constant('run' as const), keepSession: fc.boolean() }),
    fc.constant({ t: 'completeAcquire' as const }),
    fc.constant({ t: 'completeAcquireFail' as const }),
    fc.constant({ t: 'completeFn' as const }),
    fc.constant({ t: 'completeRelease' as const }),
    fc.constant({ t: 'completeMessage' as const }),
    fc.constant({ t: 'interrupt' as const }),
    fc.constant({ t: 'requestRelease' as const }),
    fc.constant({ t: 'externalSession' as const }),
);

const flush = () => new Promise(resolve => setImmediate(resolve));

class Harness {
    readonly transport: ControllableTransport;
    readonly device: Device;

    /** runs that started (run() returned without throwing) and have not settled */
    live = 0;
    /** fn bodies currently executing — directly probes mutual exclusion */
    activeFn = 0;
    /** pending fn deferreds the drain must resolve */
    private readonly fnDeferreds: Deferred<void>[] = [];
    private session = 0;
    /** invariant violations recorded during the program (asserted by the test) */
    readonly violations: string[] = [];
    /**
     * Every promise the transport-event handler (`updateDescriptor`) returns.
     * It is invoked fire-and-forget from `onTransportDeviceEvent`, so any
     * rejection escapes the device layer unhandled (INV-2). The drain checks that
     * none of these reject.
     */
    private readonly descriptorPromises: Promise<unknown>[] = [];

    constructor() {
        this.transport = createControllableTransport(PATH);
        this.device = new Device({
            id: 'fuzz' as any,
            transport: this.transport,
            descriptor: { path: PATH, type: 1, session: null, apiType: 'usb' } as any,
            createLogger: noopCreateLogger,
        });
        const origUpdate = (this.device as any).updateDescriptor.bind(this.device);
        jest.spyOn(this.device as any, 'updateDescriptor').mockImplementation((...a: any[]) => {
            const p = origUpdate(...a) as Promise<unknown>;
            this.descriptorPromises.push(p);

            return p;
        });
        // getFeatures / initialize would issue real transport messages; the
        // queue invariants do not depend on their result.
        jest.spyOn(this.device, 'getFeatures').mockResolvedValue(undefined as any);
        jest.spyOn(this.device as any, 'initialize').mockResolvedValue(undefined as any);
        jest.spyOn(this.device as any, 'checkFirmwareRevisionWithRetries').mockResolvedValue(
            undefined as any,
        );
    }

    private makeFn() {
        const dfd = createDeferred<void>();
        this.fnDeferreds.push(dfd);

        // Faithful method body: a real connect method drives the device through
        // currentSession.typedCall, which interrupt() aborts — so the body rejects
        // promptly once the run is aborted, rather than running to completion.
        return async () => {
            this.activeFn += 1;
            const signal: AbortSignal | undefined = (this.device as any).runAbort?.signal;
            try {
                await new Promise<void>((resolve, reject) => {
                    dfd.promise.then(resolve, reject);
                    if (signal) {
                        if (signal.aborted) reject(signal.reason);
                        else signal.addEventListener('abort', () => reject(signal.reason));
                    }
                });
            } finally {
                this.activeFn -= 1;
            }
        };
    }

    step(op: Op) {
        switch (op.t) {
            case 'run': {
                try {
                    const p = this.device.run(this.makeFn(), {
                        keepSession: op.keepSession,
                        skipFirmwareChecks: true,
                    });
                    this.live += 1;
                    // swallow rejection (abort/override is expected) and free the slot
                    p.catch(() => {}).finally(() => {
                        this.live -= 1;
                    });
                } catch {
                    // Device_CallInProgress — the mutual-exclusion guard fired.
                    // Drop the unused fn deferred so the drain stays balanced.
                    this.fnDeferreds.pop();
                }
                break;
            }
            case 'completeAcquire':
                this.transport.completeAcquire(`s${this.session++}`);
                break;
            case 'completeAcquireFail':
                this.transport.completeAcquireFail();
                break;
            case 'completeFn':
                this.fnDeferreds.shift()?.resolve();
                break;
            case 'completeRelease':
                this.transport.completeRelease();
                break;
            case 'completeMessage':
                this.transport.completeMessage();
                break;
            case 'interrupt':
                // fire-and-forget: interrupt awaits the in-flight run, which the
                // drain later unblocks. Swallow rejection.
                this.device.interrupt(new Error('fuzz-interrupt')).catch(() => {});
                break;
            case 'requestRelease':
                this.transport.emitDeviceEvent(PATH, { type: TRANSPORT.DEVICE_REQUEST_RELEASE });
                break;
            case 'externalSession':
                // another client grabbed the device → usedElsewhere
                this.transport.setSession(PATH, `ext${this.session++}`);
                break;
        }
    }

    checkStepInvariants() {
        // INV-1 mutual exclusion
        if (this.live > 1) this.violations.push(`INV-1: ${this.live} runs live concurrently`);
        if (this.activeFn > 1) this.violations.push(`INV-1: ${this.activeFn} fn bodies concurrent`);
        // INV-3 no over-release
        if (this.transport.releasedCount > this.transport.acquiredCount) {
            this.violations.push(
                `INV-3: releases (${this.transport.releasedCount}) exceed acquires (${this.transport.acquiredCount})`,
            );
        }
    }

    /**
     * INV-3 session balance at quiescence: a session may only remain acquired on
     * purpose (`keepTransportSession`). Holding `sessionAcquired` with
     * `keepTransportSession === false` after the system has drained means a
     * release was lost — e.g. `release()`'s `waitAndCompareSession` failed and
     * skipped the `sessionAcquired = null` assignment — leaving a stale session
     * that the next run would reuse instead of re-acquiring (`acquireNeeded` keys
     * off `isUsedHere() === !!sessionAcquired`).
     */
    checkSessionBalanceAtQuiescence() {
        const held = (this.device as any).sessionAcquired;
        const keep = (this.device as any).keepTransportSession;
        if (held != null && !keep) {
            this.violations.push(
                `INV-3: session ${held} held at quiescence without keepTransportSession`,
            );
        }
    }

    /**
     * INV-2: no `updateDescriptor` (fire-and-forget transport-event handler)
     * rejected. A rejection here is an unhandled rejection escaping the device.
     */
    async checkDescriptorRejections() {
        const rejected = (await Promise.allSettled(this.descriptorPromises)).filter(
            r => r.status === 'rejected',
        );
        if (rejected.length) {
            this.violations.push(
                `INV-2: ${rejected.length} updateDescriptor promise(s) rejected — ${rejected
                    .map(r => String((r as PromiseRejectedResult).reason?.message))
                    .join(', ')}`,
            );
        }
    }

    /** Drive everything to settle; returns false on a liveness/deadlock failure. */
    async drain() {
        for (let i = 0; i < 300; i++) {
            let progressed = false;
            while (this.fnDeferreds.length) {
                this.fnDeferreds.shift()?.resolve();
                progressed = true;
            }
            if (this.transport.completeMessage()) progressed = true;
            if (this.transport.completeAcquire(`s${this.session++}`)) progressed = true;
            if (this.transport.completeRelease()) progressed = true;

            await flush();

            const quiescent =
                !progressed &&
                this.live === 0 &&
                this.activeFn === 0 &&
                this.fnDeferreds.length === 0 &&
                !this.transport.hasPending();
            if (quiescent) return true;
        }

        // Could not reach quiescence within the bound — a liveness / deadlock
        // violation. Record the residual state so a failing case is diagnosable.
        const state = {
            live: this.live,
            activeFn: this.activeFn,
            fnDeferreds: this.fnDeferreds.length,
            pending: this.transport.pending.map(p => p.kind),
            sessionAcquired: (this.device as any).sessionAcquired,
            runPromise: !!(this.device as any).runPromise,
            keepTransportSession: (this.device as any).keepTransportSession,
        };
        this.violations.push(`INV-2: drain did not reach quiescence — ${JSON.stringify(state)}`);

        return false;
    }
}

describe('Device run-queue concurrency (fuzz)', () => {
    const FUZZ_RUNS = Number(process.env.FUZZ_RUNS ?? 200);
    const FUZZ_SEED = process.env.FUZZ_SEED ? Number(process.env.FUZZ_SEED) : 1;

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('preserves INV-1..INV-4 under arbitrary interleavings', async () => {
        await fc.assert(
            fc.asyncProperty(fc.array(opArb, { minLength: 1, maxLength: 40 }), async ops => {
                const h = new Harness();

                for (const op of ops) {
                    h.step(op);

                    await flush();
                    h.checkStepInvariants();
                }

                // INV-2 liveness: the system must drain to quiescence.
                const drained = await h.drain();
                expect(drained).toBe(true);

                // INV-3: no stale session held after the system drained.
                h.checkSessionBalanceAtQuiescence();

                // INV-4 recovery: after quiescence the device must accept a new run
                // (no stuck Device_CallInProgress, no orphaned state).
                let recovered = true;
                try {
                    const p = h.device.run(async () => {}, { skipFirmwareChecks: true });
                    h.live += 1;
                    p.catch(() => {}).finally(() => {
                        h.live -= 1;
                    });
                } catch {
                    recovered = false;
                }
                expect(recovered).toBe(true);
                const drainedAgain = await h.drain();
                expect(drainedAgain).toBe(true);

                // INV-2: no fire-and-forget updateDescriptor rejection leaked.
                await h.checkDescriptorRejections();

                // INV-1/INV-3 recorded during the run.
                expect(h.violations).toEqual([]);
            }),
            { numRuns: FUZZ_RUNS, seed: FUZZ_SEED },
        );
    }, 60000);
});
