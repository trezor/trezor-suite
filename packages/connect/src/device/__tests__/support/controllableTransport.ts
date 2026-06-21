/**
 * Controllable mock transport for the device-concurrency fuzz harness (PHASE 2).
 *
 * Unlike `global.JestMocks.createTestTransport` (which is built on
 * `AbstractApiTransport` and drives the *real* session background at the UsbApi
 * read/write level), this transport implements the `Transport` interface
 * directly so the harness controls when `acquire` / `release` / `call` / `send` /
 * `receive` / `enumerate` settle. It still extends `AbstractTransport` so the
 * real `deviceEvents` emitter, `getDescriptor` and `handleDescriptorsChange`
 * machinery are exercised exactly as in production (see CONCURRENCY_MODEL.md).
 *
 * Every async operation the `Device` issues against the transport is parked in a
 * queue of deferreds. The test resolves them on command, which is what makes the
 * interleavings deterministic and fully under the harness's control.
 */
import { AbstractTransport, type Descriptor, type Session } from '@trezor/transport-common';
import { type Deferred, createDeferred } from '@trezor/utils';

type Path = Descriptor['path'];

type Pending<T> = {
    kind: 'acquire' | 'release' | 'call' | 'send' | 'receive';
    path: Path;
    dfd: Deferred<T>;
};

const asSession = (value: string | null): Session | null => value as Session | null;

export class ControllableTransport extends AbstractTransport {
    public readonly name = 'NodeUsbTransport' as const;

    /** FIFO queues of operations the Device has issued but the test hasn't settled yet. */
    public readonly pending: Pending<any>[] = [];

    /** Bookkeeping for the session-balance invariant (INV-3). */
    public readonly releaseDeviceCalls: Array<Session> = [];
    public readonly releaseSyncCalls: Array<Session> = [];
    public acquiredCount = 0;
    public releasedCount = 0;

    init() {
        this.stopped = false;

        return Promise.resolve({ success: true as const, payload: undefined });
    }

    listen() {
        this.listening = true;

        return { success: true as const, payload: undefined };
    }

    enumerate() {
        return Promise.resolve({ success: true as const, payload: this.descriptors });
    }

    acquire({ input }: { input: { path: Path; previous: Session | null } }) {
        const dfd = createDeferred<{ success: true; payload: Session } | { success: false }>();
        this.pending.push({ kind: 'acquire', path: input.path, dfd });

        return dfd.promise as any;
    }

    release({ path }: { session: Session; path?: Path }) {
        const dfd = createDeferred<{ success: true; payload: null } | { success: false }>();
        this.pending.push({ kind: 'release', path: path as Path, dfd });

        return dfd.promise as any;
    }

    releaseDevice(session: Session) {
        this.releaseDeviceCalls.push(session);

        return Promise.resolve({ success: true as const, payload: undefined });
    }

    releaseSync(session: Session) {
        this.releaseSyncCalls.push(session);
    }

    call({ session }: { session: Session }) {
        const dfd = createDeferred<any>();
        this.pending.push({ kind: 'call', path: this.pathForSession(session), dfd });

        return dfd.promise as any;
    }

    send({ session }: { session: Session }) {
        const dfd = createDeferred<any>();
        this.pending.push({ kind: 'send', path: this.pathForSession(session), dfd });

        return dfd.promise as any;
    }

    receive({ session }: { session: Session }) {
        const dfd = createDeferred<any>();
        this.pending.push({ kind: 'receive', path: this.pathForSession(session), dfd });

        return dfd.promise as any;
    }

    private pathForSession(session: Session): Path {
        return (this.descriptors.find(d => d.session === session)?.path ??
            this.descriptors[0]?.path) as Path;
    }

    // --- harness control surface ---------------------------------------------

    /** Seed an initial descriptor without emitting any device event. */
    seedDescriptor(path: Path, session: string | null = null) {
        this.descriptors = [{ path, session: asSession(session), type: 1 } as Descriptor];
    }

    /**
     * Drive a transport-level session change. Uses the *real*
     * `handleDescriptorsChange` so the proper `DEVICE_SESSION_CHANGED` /
     * `DEVICE_DISCONNECTED` events fan out to the Device.
     */
    setSession(path: Path, session: string | null) {
        this.handleDescriptorsChange([
            { path, session: asSession(session), type: 1 } as Descriptor,
        ]);
    }

    /** Emit a raw device event (used to model REQUEST_RELEASE / disconnect). */
    emitDeviceEvent(path: Path, event: Parameters<typeof this.deviceEvents.emit>[1]) {
        this.deviceEvents.emit(path, event);
    }

    private firstPending(kind: Pending<any>['kind']) {
        const idx = this.pending.findIndex(p => p.kind === kind);

        return idx === -1 ? undefined : this.pending.splice(idx, 1)[0];
    }

    /** Settle the oldest in-flight acquire as success and advance the session. */
    completeAcquire(session: string) {
        const op = this.firstPending('acquire');
        if (!op) return false;
        this.acquiredCount += 1;
        op.dfd.resolve({ success: true, payload: asSession(session) as Session });
        this.setSession(op.path, session);

        return true;
    }

    completeAcquireFail() {
        const op = this.firstPending('acquire');
        if (!op) return false;
        // The real transport always carries an error code on failure; mirror that
        // so Device.acquire's `throw new Error(result.error.code)` path is faithful.
        op.dfd.resolve({
            success: false,
            error: { code: 'DEVICE_DISCONNECTED_DURING_ACTION' },
        } as any);

        return true;
    }

    /** Settle the oldest in-flight release as success and clear the session. */
    completeRelease() {
        const op = this.firstPending('release');
        if (!op) return false;
        this.releasedCount += 1;
        op.dfd.resolve({ success: true, payload: null });
        this.setSession(op.path, null);

        return true;
    }

    /** Settle every parked transport message call so workflows can't hang the drain. */
    completeMessage() {
        const op =
            this.firstPending('call') ?? this.firstPending('send') ?? this.firstPending('receive');
        if (!op) return false;
        op.dfd.resolve({ success: true, payload: { type: 'Success', message: {} } });

        return true;
    }

    hasPending() {
        return this.pending.length > 0;
    }
}

export const createControllableTransport = (path = '1') => {
    const transport = new ControllableTransport({ id: 'fuzz-transport' });
    // init()/listen() flip the `stopped` flag; without it handleDescriptorsChange
    // short-circuits and no DEVICE_SESSION_CHANGED events ever fan out.
    transport.init();
    transport.listen();
    transport.seedDescriptor(path as Path, null);

    return transport;
};
