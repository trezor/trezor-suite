/**
 * Override-dispatch seam — INV-4 (abort/override correctness).
 *
 * Scope: the device-level contract that `core/index.ts`'s override path
 * (`onCallDevice`, lines 313-330) depends on. When a method with
 * `overridePreviousCall` (in production only `setBusy`) preempts an in-flight
 * call to the same device, core does:
 *
 *     await device.interrupt(Method_Override);   // abort the in-flight run
 *     // ... then immediately:
 *     await device.run(innerAction, ...);        // start the overriding run
 *
 * The whole override mechanism rests on one device-level guarantee: the instant
 * `await device.interrupt(reason)` resolves, the device must be immediately
 * runnable — `device.run()` issued on the very next line must NOT throw
 * `Device_CallInProgress`, and the interrupted run must have rejected with
 * exactly `reason` (so the overridden method responds with `Method_Override`,
 * not some other error). If `interrupt()` returned while `runPromise` were still
 * set, the override's `run()` would spuriously throw and the overriding call
 * would be lost.
 *
 * The existing fuzz harness (`deviceConcurrency.fuzz.test.ts`) only asserts
 * runnability *after a full drain to quiescence*. Core does not drain — it
 * re-runs on the next microtask after interrupt resolves — so this immediate
 * interrupt→run sequence is its own seam. These tests drive the *real*
 * `Device.interrupt` / `Device.run` (no reproduction of `onCallDevice`'s
 * bookkeeping) over the controllable transport, across the three in-flight states
 * core can interrupt: a run blocked in its `fn` body, a run blocked in
 * `acquire()`, and a run parked before `acquire()` at `await this.releasePromise`.
 */
import { ERRORS } from '@trezor/connect-common';
import { noopCreateLogger } from '@trezor/connect-common/src/utils/debug';
import { type Deferred, createDeferred } from '@trezor/utils';

import { Device } from '../Device';
import {
    type ControllableTransport,
    createControllableTransport,
} from './support/controllableTransport';

// Neutralise the firmware / handshake middle of _runInner; only the run-queue and
// session mechanics are under test (same stubs as the fuzz harness).
jest.mock('../workflow/handshake', () => ({
    handshakeCancel: jest.fn(() => Promise.resolve()),
    handshake: jest.fn(() => Promise.resolve()),
}));
jest.mock('../workflow/checkFirmwareHashWithRetries', () => ({
    checkFirmwareHashWithRetries: jest.fn(() => Promise.resolve()),
}));

const PATH = '1' as any;
const flush = () => new Promise(resolve => setImmediate(resolve));

const makeDevice = (transport: ControllableTransport) => {
    const device = new Device({
        id: 'override' as any,
        transport,
        descriptor: { path: PATH, type: 1, session: null, apiType: 'usb' } as any,
        createLogger: noopCreateLogger,
    });
    jest.spyOn(device, 'getFeatures').mockResolvedValue(undefined as any);
    jest.spyOn(device as any, 'initialize').mockResolvedValue(undefined as any);
    jest.spyOn(device as any, 'checkFirmwareRevisionWithRetries').mockResolvedValue(
        undefined as any,
    );

    return device;
};

/**
 * Faithful method body: a real connect method drives the device through
 * `currentSession.typedCall`, which `interrupt()` aborts — so the body rejects
 * promptly once the run is aborted rather than running to completion. Resolves on
 * its deferred (normal completion) or rejects on the run's abort signal.
 */
const makeAbortableFn = (device: Device, dfd: Deferred<void>) => () => {
    const signal: AbortSignal | undefined = (device as any).runAbort?.signal;

    return new Promise<void>((resolve, reject) => {
        dfd.promise.then(resolve, reject);
        if (signal) {
            if (signal.aborted) reject(signal.reason);
            else signal.addEventListener('abort', () => reject(signal.reason));
        }
    });
};

/**
 * Settle pending transport ops (and the in-flight run's `fn`) until `promise`
 * settles. `device.interrupt()` awaits the interrupted run, whose abort `catch`
 * may issue a `release()` (or be parked on an earlier one); the real transport
 * resolves those, so the harness must too for `interrupt()` to return — exactly
 * the production flow.
 */
const settleUntil = async (
    promise: Promise<unknown>,
    transport: ControllableTransport,
    nextSession: () => string,
    fnDeferreds: Deferred<void>[],
) => {
    let done = false;
    const tracked = promise.then(
        () => {
            done = true;
        },
        () => {
            done = true;
        },
    );
    for (let i = 0; i < 200 && !done; i++) {
        while (fnDeferreds.length) fnDeferreds.shift()?.resolve();
        transport.completeMessage();
        transport.completeAcquire(nextSession());
        transport.completeRelease();

        await flush();
    }
    await tracked;
};

/** Drive everything still in flight to a clean stop. */
const drain = async (
    transport: ControllableTransport,
    nextSession: () => string,
    fnDeferreds: Deferred<void>[],
) => {
    for (let i = 0; i < 200; i++) {
        let progressed = false;
        while (fnDeferreds.length) {
            fnDeferreds.shift()?.resolve();
            progressed = true;
        }
        if (transport.completeMessage()) progressed = true;
        if (transport.completeAcquire(nextSession())) progressed = true;
        if (transport.completeRelease()) progressed = true;

        await flush();
        if (!progressed && !transport.hasPending()) return;
    }
};

describe('Device override dispatch (INV-4: interrupt → immediate run)', () => {
    let sessionCounter = 0;
    const nextSession = () => `s${sessionCounter++}`;

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // The three in-flight states core's override path can interrupt. Each sets up a
    // run in that state and returns the captured run promise + its pending fn
    // deferreds, so the shared assertions below run against all of them.
    const scenarios: Array<{
        name: string;
        setup: (
            device: Device,
            transport: ControllableTransport,
        ) => Promise<{ runA: Promise<unknown>; fnDeferreds: Deferred<void>[] }>;
    }> = [
        {
            name: 'run blocked in its fn body',
            setup: async (device, transport) => {
                const fnDeferreds: Deferred<void>[] = [];
                const fnA = createDeferred<void>();
                fnDeferreds.push(fnA);
                const runA = device.run(makeAbortableFn(device, fnA), { skipFirmwareChecks: true });
                await flush(); // reaches acquire()
                transport.completeAcquire(nextSession());
                await flush(); // acquire settled → fn body now executing

                return { runA, fnDeferreds };
            },
        },
        {
            name: 'run blocked in acquire()',
            setup: async device => {
                const fnDeferreds: Deferred<void>[] = [];
                const fnA = createDeferred<void>();
                fnDeferreds.push(fnA);
                const runA = device.run(makeAbortableFn(device, fnA), { skipFirmwareChecks: true });
                await flush(); // reaches acquire(), left pending on purpose

                return { runA, fnDeferreds };
            },
        },
        {
            name: 'run parked before acquire at releasePromise',
            setup: async (device, transport) => {
                const fnDeferreds: Deferred<void>[] = [];
                // First run acquires, runs fn, then issues its trailing release.
                const fn0 = createDeferred<void>();
                const run0 = device
                    .run(makeAbortableFn(device, fn0), { skipFirmwareChecks: true })
                    .catch(() => {});
                await flush();
                transport.completeAcquire(nextSession());
                await flush();
                fn0.resolve(); // fn done → _runInner reaches trailing release()
                await flush();
                // run0 settles (resolved) but its release is still in flight; clear it
                // by aborting so runPromise frees and a fresh run can park on the
                // pending release.
                device.interrupt(ERRORS.TypedError('Method_Override')).catch(() => {});
                await run0.catch(() => {});
                await flush();

                // Now a new run starts while the release is still pending → parks at
                // `await this.releasePromise`, before acquire().
                const fnA = createDeferred<void>();
                fnDeferreds.push(fnA);
                const runA = device.run(makeAbortableFn(device, fnA), { skipFirmwareChecks: true });
                await flush();

                return { runA, fnDeferreds };
            },
        },
    ];

    scenarios.forEach(({ name, setup }) => {
        it(`interrupt resolves immediately runnable — ${name}`, async () => {
            sessionCounter = 0;
            const transport = createControllableTransport(PATH);
            const device = makeDevice(transport);

            const { runA, fnDeferreds } = await setup(device, transport);
            const firstReason = runA.then(
                () => ({ rejected: false as const }),
                (e: any) => ({ rejected: true as const, error: e }),
            );

            // Core's override path: await interrupt with the override error.
            const reason = ERRORS.TypedError('Method_Override');
            const interruptP = device.interrupt(reason);
            await settleUntil(interruptP, transport, nextSession, fnDeferreds);
            await interruptP;

            // INV-4: the device must be immediately runnable on the very next line,
            // exactly as onCallDevice issues device.run() right after interrupt.
            let overrideThrew: unknown = null;
            let overrideRun: Promise<unknown> | undefined;
            const fnB = createDeferred<void>();
            try {
                overrideRun = device
                    .run(makeAbortableFn(device, fnB), { skipFirmwareChecks: true })
                    .catch(() => {});
                fnDeferreds.push(fnB);
            } catch (e) {
                overrideThrew = e;
            }
            expect(overrideThrew).toBeNull();

            // The interrupted run rejected with exactly the override reason, so the
            // overridden method would respond with Method_Override (not e.g.
            // Device_CallInProgress or a stray transport error).
            const outcome = await firstReason;
            expect(outcome.rejected).toBe(true);
            expect((outcome as any).error?.code).toBe('Method_Override');

            // The override run completes and the device drains with a balanced
            // session ledger (no orphaned/leaked session).
            await drain(transport, nextSession, fnDeferreds);
            await overrideRun;
            await drain(transport, nextSession, fnDeferreds);

            expect((device as any).sessionAcquired).toBeNull();
            expect((device as any).keepTransportSession).toBe(false);
            expect((device as any).runPromise).toBeUndefined();
            expect(transport.hasPending()).toBe(false);
            expect(transport.releasedCount).toBeLessThanOrEqual(transport.acquiredCount);
        });
    });

    it('a concurrent run WITHOUT interrupt is rejected (mutual exclusion the override path relies on)', async () => {
        sessionCounter = 0;
        const transport = createControllableTransport(PATH);
        const device = makeDevice(transport);

        const fnA = createDeferred<void>();
        const fnDeferreds = [fnA];
        const runA = device
            .run(makeAbortableFn(device, fnA), { skipFirmwareChecks: true })
            .catch(() => {});
        await flush();
        transport.completeAcquire(nextSession());
        await flush();

        // Without an interrupt, a second run on a busy device throws
        // Device_CallInProgress — this is the `else if (device.currentRun)` branch
        // core takes for a NON-override second call. The override branch is the only
        // way to preempt; this asserts the contract's other half.
        let threw: any = null;
        try {
            device.run(async () => {}, { skipFirmwareChecks: true });
        } catch (e) {
            threw = e;
        }
        expect(threw?.code).toBe('Device_CallInProgress');

        // cleanup: fire the interrupt (do not await — it blocks on the run's
        // trailing release, which only the drain below settles), then drain.
        const interruptP = device.interrupt(ERRORS.TypedError('Method_Override')).catch(() => {});
        await drain(transport, nextSession, fnDeferreds);
        await interruptP;
        await runA;
    });
});
