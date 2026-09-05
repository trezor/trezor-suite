/**
 * Deterministic interleaving fuzz harness for `DeviceList` consistency (INV-5).
 *
 * Scope: the shared `DeviceList.devices` registry documented in
 * `../CONCURRENCY_MODEL.md` §1.5 / §3 (seams 5 & 6) — the array mutated from the
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
 * Run a longer hunt with: `yarn workspace @trezor/connect test:fuzz`
 * (raise FUZZ_RUNS / drop the fixed seed via env to search harder).
 */
import fc from 'fast-check';

import { noopCreateLogger } from '@trezor/connect-common/src/utils/debug';
import { TRANSPORT } from '@trezor/transport-common';

import { Device } from '../Device';
import { DeviceList } from '../DeviceList';
import {
    type ControllableTransport,
    createControllableTransport,
} from './support/controllableTransport';

// Neutralise the firmware / handshake middle of _runInner so each handshake
// reduces to acquire → release driven by the controllable transport (see the
// per-device harness for the rationale).
jest.mock('../workflow/handshake', () => ({
    handshakeCancel: jest.fn(() => Promise.resolve()),
    handshake: jest.fn(() => Promise.resolve()),
}));
jest.mock('../workflow/checkFirmwareHashWithRetries', () => ({
    checkFirmwareHashWithRetries: jest.fn(() => Promise.resolve()),
}));

const PATHS = ['1', '2', '3'] as const;
type Path = (typeof PATHS)[number];

// Drain across timer + microtask phases: `onDeviceConnected` defers the
// handshake behind `resolveAfter(0)` (a setTimeout), and the run-queue resolves
// on microtasks, so a faithful flush must let both run.
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

        // The firmware/feature transport calls are irrelevant to registry
        // consistency; stub them so each handshake is acquire → release only.
        jest.spyOn(Device.prototype, 'getFeatures').mockResolvedValue(undefined as any);
        jest.spyOn(Device.prototype as any, 'initialize').mockResolvedValue(undefined as any);
        jest.spyOn(Device.prototype as any, 'checkFirmwareRevisionWithRetries').mockResolvedValue(
            undefined as any,
        );

        this.deviceList = new DeviceList({
            priority: 0,
            manifest: { appName: 'fuzz', appUrl: 'fuzz' } as any,
            createLogger: noopCreateLogger,
        });

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

describe('DeviceList registry consistency (fuzz)', () => {
    const FUZZ_RUNS = Number(process.env.FUZZ_RUNS ?? 150);
    const FUZZ_SEED = process.env.FUZZ_SEED ? Number(process.env.FUZZ_SEED) : 1;

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

                const drained = await h.drain();
                expect(drained).toBe(true);

                h.checkNoDuplicates();
                h.checkPresentIffConnected();

                expect(h.violations).toEqual([]);
            }),
            { numRuns: FUZZ_RUNS, seed: FUZZ_SEED },
        );
    }, 120000);
});
