/**
 * Deterministic interleaving fuzz harness for `DeviceList` consistency (INV-5).
 *
 * Scope: the shared `DeviceList.devices` registry documented in
 * `./CONCURRENCY_MODEL.md` §1.5 / §3 (seams 5 & 6) — the array mutated from the
 * async `onDeviceConnected` handler (`new Device` → `await handshakeLock` →
 * `devices.push`) and from the per-device `DEVICE.DISCONNECT` lifecycle handler
 * (`devices.splice`), under interleaved connect / disconnect / session-change
 * events fanned out by the *real* `handleDescriptorsChange`.
 *
 * The per-device run-queue (INV-1..INV-4) is covered by
 * `deviceConcurrency.fuzz.test.ts`; here `Device.handshake()` runs for real
 * against the controllable transport (acquire → getFeatures → release, with the
 * firmware/feature middle stubbed exactly as in that harness) so a disconnect
 * arriving mid-handshake interrupts the run and makes `handshake()` return
 * `false` — the production signal that gates `devices.push`.
 *
 * fast-check generates a sequence of connect/disconnect/acquire/release ops over
 * a small set of paths; after every step (no-duplicate) and at full quiescence
 * (present iff connected) the harness asserts INV-5.
 *
 * Run a longer hunt with: `yarn workspace @trezor/connect-core test:fuzz`
 * (raise FUZZ_RUNS / drop the fixed seed via env to search harder).
 */
import fc from 'fast-check';

import { noopCreateLogger } from '@trezor/logger';
import { TRANSPORT } from '@trezor/transport-common';

import { Device } from './Device';
import { DeviceList } from './DeviceList';
import {
    type ControllableTransport,
    createControllableTransport,
} from './__fixtures__/controllableTransport';

// Neutralise the firmware / handshake middle of _runInner so each handshake
// reduces to acquire → release driven by the controllable transport (see the
// per-device harness for the rationale).
jest.mock('./workflow/handshake', () => ({
    handshakeCancel: jest.fn(() => Promise.resolve()),
    handshake: jest.fn(() => Promise.resolve()),
}));
jest.mock('./workflow/checkFirmwareHashWithRetries', () => ({
    checkFirmwareHashWithRetries: jest.fn(() => Promise.resolve()),
}));

const PATHS = ['1', '2', '3'] as const;
type Path = (typeof PATHS)[number];

// Drain across timer + microtask phases: with the auth penalty zeroed (see the
// `Harness` constructor) `onDeviceConnected` defers the handshake behind a
// single `resolveAfter(0)` (a setTimeout), and the run-queue resolves on
// microtasks, so a faithful flush must let both run.
const flush = async () => {
    for (let i = 0; i < 4; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
};

type Op =
    | { t: 'connect'; path: Path }
    | { t: 'disconnect'; path: Path }
    | { t: 'completeAcquire' }
    | { t: 'completeRelease' };

const pathArb = fc.constantFrom(...PATHS);
const opArb: fc.Arbitrary<Op> = fc.oneof(
    fc.record({ t: fc.constant('connect' as const), path: pathArb }),
    fc.record({ t: fc.constant('disconnect' as const), path: pathArb }),
    fc.constant({ t: 'completeAcquire' as const }),
    fc.constant({ t: 'completeRelease' as const }),
);

class Harness {
    readonly transport: ControllableTransport;
    readonly deviceList: DeviceList;
    private session = 0;
    readonly violations: string[] = [];

    constructor() {
        this.transport = createControllableTransport(PATHS[0]);
        // start with no devices visible; `connect` ops introduce them
        this.transport.disconnectPath(PATHS[0] as any);

        this.deviceList = new DeviceList({
            createLogger: noopCreateLogger,
        });

        // `onDeviceConnected` gates every handshake behind
        // `resolveAfter(penalty && penalty + 501)` and `authPenaltyManager.get()`
        // never drops below `100 * priority` (= 200 ms). Zero it so the handshake
        // is deferred by a single `setTimeout(0)` that `flush()` actually covers.
        (this.deviceList as any).authPenaltyManager.get = () => 0;

        // Replicate the listener wiring `initializeTransport` installs, without
        // standing up the full TransportManager stack: DEVICE_CONNECTED →
        // onDeviceConnected (fire-and-forget, exactly as production emits it).
        this.transport.on(TRANSPORT.DEVICE_CONNECTED, (descriptor: any) => {
            (this.deviceList as any).onDeviceConnected(descriptor, this.transport);
        });
    }

    step(op: Op) {
        switch (op.t) {
            case 'connect':
                this.transport.connectPath(op.path as any);
                break;
            case 'disconnect':
                this.transport.disconnectPath(op.path as any);
                break;
            case 'completeAcquire':
                this.transport.completeAcquire(`s${this.session++}`);
                break;
            case 'completeRelease':
                this.transport.completeRelease();
                break;
        }
    }

    private devicePaths(): string[] {
        return this.deviceList.getAllDevices().map(d => d.getUniquePath());
    }

    private deviceDescriptorPaths(): string[] {
        return this.deviceList.getAllDevices().map(d => (d as any).descriptor.path);
    }

    /** INV-5 part 1: a path never appears twice in the registry. */
    checkNoDuplicates() {
        const paths = this.deviceDescriptorPaths();
        const seen = new Set<string>();
        for (const p of paths) {
            if (seen.has(p)) {
                this.violations.push(`INV-5: duplicate device for path ${p} (${paths.join(',')})`);
            }
            seen.add(p);
        }
        // unique-path identity must also be unique (no two Device instances share id)
        const ids = this.devicePaths();
        if (new Set(ids).size !== ids.length) {
            this.violations.push(`INV-5: duplicate device id (${ids.join(',')})`);
        }
    }

    /**
     * INV-5 part 2 (at full quiescence): the set of device descriptor paths in the
     * registry equals the set of paths currently present at the transport. A path
     * present at the transport but missing from `devices` is a *lost* device; a
     * path in `devices` but gone from the transport is a *leaked* device.
     */
    checkPresentIffConnected() {
        const inRegistry = new Set(this.deviceDescriptorPaths());
        const live = new Set(this.transport.livePaths().map(String));

        for (const p of live) {
            if (!inRegistry.has(p))
                this.violations.push(
                    `INV-5: lost device — path ${p} connected but absent from registry`,
                );
        }
        for (const p of inRegistry) {
            if (!live.has(p))
                this.violations.push(
                    `INV-5: leaked device — path ${p} in registry but disconnected`,
                );
        }
    }

    /** Settle every parked acquire/release and let handshakes complete. */
    async drain() {
        for (let i = 0; i < 200; i++) {
            let progressed = false;
            while (this.transport.completeAcquire(`s${this.session++}`)) progressed = true;
            while (this.transport.completeRelease()) progressed = true;

            await flush();

            if (!progressed && !this.transport.hasPending()) {
                // one more flush so any late onDeviceConnected push/splice runs

                await flush();
                if (!this.transport.hasPending()) return true;
            }
        }

        this.violations.push(
            `INV-2: deviceList drain did not reach quiescence — pending ${this.transport.pending
                .map(p => p.kind)
                .join(',')}`,
        );

        return false;
    }
}

// `Number(process.env.X ?? fallback)` only falls back on an unset variable: an
// exported-but-empty `FUZZ_RUNS=` yields 0 and a typo yields NaN, and `fc.assert`
// accepts both by resolving without ever running the property — a green suite
// that tested nothing. Keep the default unless the value is a positive integer.
const envPositiveInt = (name: string, fallback: number) => {
    const parsed = Number.parseInt(process.env[name] ?? '', 10);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

describe('DeviceList registry consistency (fuzz)', () => {
    const FUZZ_RUNS = envPositiveInt('FUZZ_RUNS', 150);
    const FUZZ_SEED = envPositiveInt('FUZZ_SEED', 1);

    // Run-invariant stubs: the firmware/feature transport calls are irrelevant to
    // registry consistency, so each handshake reduces to acquire → release. They
    // live here rather than in `Harness` so one fuzz run does not stack a spy on
    // top of the previous run's spy on the same prototype method.
    beforeEach(() => {
        jest.spyOn(Device.prototype, 'getFeatures').mockResolvedValue(undefined as any);
        jest.spyOn(Device.prototype as any, 'initialize').mockResolvedValue(undefined as any);
        jest.spyOn(Device.prototype as any, 'checkFirmwareRevisionWithRetries').mockResolvedValue(
            undefined as any,
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('preserves INV-5 under arbitrary connect/disconnect interleavings', async () => {
        await fc.assert(
            fc.asyncProperty(fc.array(opArb, { minLength: 1, maxLength: 30 }), async ops => {
                const h = new Harness();

                for (const op of ops) {
                    h.step(op);

                    await flush();
                    h.checkNoDuplicates();
                }

                try {
                    const drained = await h.drain();
                    expect(drained).toBe(true);

                    h.checkNoDuplicates();
                    h.checkPresentIffConnected();

                    expect(h.violations).toEqual([]);
                } finally {
                    // one DeviceList per run: tear it down instead of leaving
                    // every run's listeners alive for the whole property
                    await h.deviceList.dispose();
                }
            }),
            { numRuns: FUZZ_RUNS, seed: FUZZ_SEED },
        );
    }, 120000);
});
