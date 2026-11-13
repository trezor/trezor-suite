import { PathInternal, PathPublic, Session } from '../types';
import { SessionsBackground } from './background';
import { SessionsClient } from './client';
import { type SessionsBackgroundInterface } from './types';

const usbDevice = (path: string) => ({
    path: PathInternal(path),
    type: 1,
    apiType: 'usb' as const,
});

// Mirrors the lock timeout in background.ts.
const lockDuration = 4000;

// Lets the background process every message that does not have to wait for a lock.
const flushMicrotasks = async () => {
    for (let i = 0; i < 16; i += 1) {
        await Promise.resolve();
    }
};

describe('sessions', () => {
    let background: SessionsBackground;

    beforeEach(() => {
        background = new SessionsBackground();
    });

    afterEach(() => {
        // Clears the timers of locks that a test leaves held.
        background.dispose();
        jest.useRealTimers();
    });

    test('acquire without previous enumerate', async () => {
        const client1 = new SessionsClient(background);
        await client1.handshake();

        const acquireIntent = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });

        expect(acquireIntent).toEqual({
            success: false,
            id: 1,
            error: { code: 'device not found' },
        });
    });

    test('acquire', async () => {
        const client1 = new SessionsClient(background);
        await client1.handshake();

        await client1.enumerateDone({
            descriptors: [{ path: PathInternal('abc'), type: 1, apiType: 'usb' }],
        });

        const acquireIntent = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });

        expect(acquireIntent).toEqual({
            success: true,
            id: 2,
            payload: {
                session: '1',
                path: 'abc', // <= pathInternal
            },
        });
        const acquireDone = await client1.acquireDone({ path: PathPublic('1') });
        expect(acquireDone).toEqual({
            success: true,
            id: 3,
            payload: {
                descriptors: [
                    {
                        path: '1',
                        session: '1',
                        type: 1,
                        apiType: 'usb',
                    },
                ],
            },
        });
    });

    test('acquire - acquire', async () => {
        expect.assertions(3);

        const client1 = new SessionsClient(background);
        await client1.handshake();

        await client1.enumerateDone({
            descriptors: [{ path: PathInternal('1'), type: 1, apiType: 'usb' }],
        });

        const acquire1 = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });
        expect(acquire1).toMatchObject({
            success: true,
            payload: {
                path: '1',
                session: '1',
            },
        });

        await client1.acquireDone({ path: PathPublic('1') });

        const acquire2 = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });
        expect(acquire2).toMatchObject({
            success: false,
            error: { code: 'wrong previous session' },
        });

        await client1.acquireDone({ path: PathPublic('1') });

        const acquire3 = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: Session('1'),
        });

        expect(acquire3).toMatchObject({
            success: true,
            payload: {
                path: '1',
                session: '2',
                releaseRequest: {
                    path: '1',
                    session: '1',
                },
            },
        });

        await client1.acquireDone({ path: PathPublic('1') });
    });

    test('acquire - release - acquire', async () => {
        const client1 = new SessionsClient(background);
        await client1.handshake();

        await client1.enumerateDone({
            descriptors: [{ path: PathInternal('1'), type: 1, apiType: 'usb' }],
        });

        const acquire1Intent = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });
        expect(acquire1Intent).toMatchObject({
            success: true,
            payload: {
                session: '1',
            },
        });

        const acquire1Done = await client1.acquireDone({ path: PathPublic('1') });
        expect(acquire1Done).toMatchObject({
            success: true,
            payload: {
                descriptors: [
                    {
                        path: '1',
                        session: '1',
                    },
                ],
            },
        });

        const sessions1 = await client1.getSessions();
        expect(sessions1).toMatchObject({
            success: true,
            payload: {
                descriptors: [
                    {
                        path: '1',
                        session: '1',
                    },
                ],
            },
        });

        const release1 = await client1.releaseIntent({ session: Session('1') });
        expect(release1).toMatchObject({
            success: true,
            payload: {
                path: '1',
            },
        });

        const release1Done = await client1.releaseDone({ path: PathInternal('1') });
        expect(release1Done).toMatchObject({
            success: true,
            payload: {
                descriptors: [
                    {
                        path: '1',
                        session: null,
                    },
                ],
            },
        });

        const sessions2 = await client1.getSessions();
        expect(sessions2).toMatchObject({
            success: true,
            payload: {
                descriptors: [
                    {
                        path: '1',
                        session: null,
                    },
                ],
            },
        });
    });

    test('acquireDone with abort releases the lock without committing a session', async () => {
        const client1 = new SessionsClient(background);
        await client1.handshake();
        await client1.enumerateDone({
            descriptors: [{ path: PathInternal('1'), type: 1, apiType: 'usb' }],
        });

        const acquireIntent = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });
        expect(acquireIntent).toMatchObject({ success: true });

        // openDevice failed after the intent reserved the session: abort must
        // release the lock without committing a phantom session.
        await client1.acquireDone({ path: PathPublic('1'), abort: true });

        // session stays null (no phantom commit)
        const sessions = await client1.getSessions();
        expect(sessions).toMatchObject({
            success: true,
            payload: { descriptors: [{ path: '1', session: null }] },
        });

        // and the lock is free: a fresh acquire from null succeeds
        const acquireAgain = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });
        expect(acquireAgain).toMatchObject({ success: true });

        // cleanup: release the lock acquireAgain just took, otherwise it stays
        // held with the 4s safety-net timer pending after the test ends
        await client1.acquireDone({ path: PathPublic('1'), abort: true });
    });

    test('dispose releases a held lock, so a reused background does not deadlock', async () => {
        const client = new SessionsClient(background);
        await client.enumerateDone({ descriptors: [usbDevice('1')] });
        // The intent takes the lock but its acquireDone never comes.
        await client.acquireIntent({ path: PathPublic('1'), previous: null });

        // AbstractApiTransport.init() disposes and then keeps using the same background.
        client.setBackground(background);
        await client.enumerateDone({ descriptors: [usbDevice('1')] });

        const onAcquireIntent = jest.fn();
        client.acquireIntent({ path: PathPublic('1'), previous: null }).then(onAcquireIntent);
        await flushMicrotasks();

        expect(onAcquireIntent).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('a timed out lock leaves the queue, so it does not delay later operations', async () => {
        jest.useFakeTimers();
        const client = new SessionsClient(background);
        await client.enumerateDone({ descriptors: [usbDevice('1')] });
        await client.acquireIntent({ path: PathPublic('1'), previous: null });
        await client.acquireDone({ path: PathPublic('1') });
        // Like releaseSync: the intent takes the lock but its releaseDone never comes.
        await client.releaseIntent({ session: Session('1') });
        jest.advanceTimersByTime(lockDuration);

        await client.acquireIntent({ path: PathPublic('1'), previous: Session('1') });
        await client.acquireDone({ path: PathPublic('1') });

        const onReleaseIntent = jest.fn();
        client.releaseIntent({ session: Session('2') }).then(onReleaseIntent);
        await flushMicrotasks();

        expect(onReleaseIntent).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('releaseDone of a device disconnected during the release still releases the lock', async () => {
        const client = new SessionsClient(background);
        await client.enumerateDone({ descriptors: [usbDevice('1')] });
        await client.acquireIntent({ path: PathPublic('1'), previous: null });
        await client.acquireDone({ path: PathPublic('1') });
        await client.releaseIntent({ session: Session('1') });
        await client.enumerateDone({ descriptors: [] });

        const releaseDone = await client.releaseDone({ path: PathInternal('1') });
        expect(releaseDone).toMatchObject({ success: true });

        // The reconnected device gets a new public path.
        await client.enumerateDone({ descriptors: [usbDevice('1')] });
        const onAcquireIntent = jest.fn();
        client.acquireIntent({ path: PathPublic('2'), previous: null }).then(onAcquireIntent);
        await flushMicrotasks();

        expect(onAcquireIntent).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('an unexpected error reply carries the id of its request', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

        // @ts-expect-error: a message type the background does not know
        const reply = await background.handleMessage({ type: 'unknown', id: 7 });
        consoleError.mockRestore();

        expect(reply).toMatchObject({ success: false, id: 7 });
    });

    describe('a *Done that comes after its lock timed out', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        test('acquireDone commits its own session, not the session of the next client', async () => {
            const client = new SessionsClient(background);
            await client.enumerateDone({ descriptors: [usbDevice('1'), usbDevice('2')] });
            await client.acquireIntent({ path: PathPublic('1'), previous: null });
            jest.advanceTimersByTime(lockDuration);
            await client.acquireIntent({ path: PathPublic('2'), previous: null });
            await client.acquireDone({ path: PathPublic('2') });

            await client.acquireDone({ path: PathPublic('1') });

            const sessions = await client.getSessions();
            expect(sessions.payload.descriptors).toMatchObject([
                { path: '1', session: '1' },
                { path: '2', session: '2' },
            ]);
        });

        test('acquireDone does not release the lock of the next client', async () => {
            const client = new SessionsClient(background);
            await client.enumerateDone({
                descriptors: [usbDevice('1'), usbDevice('2'), usbDevice('3')],
            });
            await client.acquireIntent({ path: PathPublic('1'), previous: null });
            jest.advanceTimersByTime(lockDuration);
            await client.acquireIntent({ path: PathPublic('2'), previous: null });

            await client.acquireDone({ path: PathPublic('1') });

            const onAcquireIntent = jest.fn();
            client.acquireIntent({ path: PathPublic('3'), previous: null }).then(onAcquireIntent);
            await flushMicrotasks();
            expect(onAcquireIntent).not.toHaveBeenCalled();

            await client.acquireDone({ path: PathPublic('2') });
            await flushMicrotasks();
            expect(onAcquireIntent).toHaveBeenCalledWith(
                expect.objectContaining({ success: true }),
            );
        });

        test('releaseDone does not clear the session of a client that stole the device', async () => {
            const client = new SessionsClient(background);
            await client.enumerateDone({ descriptors: [usbDevice('1')] });
            await client.acquireIntent({ path: PathPublic('1'), previous: null });
            await client.acquireDone({ path: PathPublic('1') });
            await client.releaseIntent({ session: Session('1') });
            jest.advanceTimersByTime(lockDuration);
            await client.acquireIntent({ path: PathPublic('1'), previous: Session('1') });
            await client.acquireDone({ path: PathPublic('1') });

            await client.releaseDone({ path: PathInternal('1') });

            const sessions = await client.getSessions();
            expect(sessions.payload.descriptors).toMatchObject([{ path: '1', session: '2' }]);
        });
    });

    // CURRENTLY LEAKS — see PR #27978 for the fix.
    //
    // SessionsClient subscribes to 'descriptors' and 'releaseRequest' on the background in
    // its constructor. SessionsClient.dispose() removes its own listeners and triggers a
    // 'dispose' request to the background, but it does not call background.off() to remove
    // the constructor-registered handlers from the background itself. A real shared
    // SessionsBackground masks this via its destructive dispose() (which calls
    // removeAllListeners() unconditionally) — so this test uses a minimal mock to isolate
    // the SessionsClient -> SessionsBackgroundInterface contract.
    //
    // When the fix lands SessionsBackgroundInterface gains an off() method and
    // SessionsClient.dispose() uses it to remove its own handler refs.
    test('client.dispose() leaks listeners on shared background (TODO: fix in #27978)', () => {
        const listeners = {
            descriptors: [] as ((d: any) => void)[],
            releaseRequest: [] as ((d: any) => void)[],
        };
        const mockBackground = {
            on: (event: 'descriptors' | 'releaseRequest', listener: (d: any) => void) => {
                listeners[event].push(listener);
            },
            // off() is not part of the current SessionsBackgroundInterface; included on the
            // mock so the test can detect whether dispose() reaches for it once the fix lands.
            off: (event: 'descriptors' | 'releaseRequest', listener: (d: any) => void) => {
                const idx = listeners[event].indexOf(listener);
                if (idx >= 0) listeners[event].splice(idx, 1);
            },
            handleMessage: () =>
                Promise.resolve({ success: true, payload: undefined, id: 0 } as any),
            dispose: () => {},
        } as unknown as SessionsBackgroundInterface;

        const client = new SessionsClient(mockBackground);
        expect(listeners.descriptors.length).toBe(1);
        expect(listeners.releaseRequest.length).toBe(1);

        client.dispose();

        // TODO(#27978): after the fix lands, both counts must be 0 here because
        // SessionsClient.dispose() will call background.off() for each handler it
        // registered in the constructor. Update the expectations below.
        expect(listeners.descriptors.length).toBe(1); // leaked: dispose() does not call background.off
        expect(listeners.releaseRequest.length).toBe(1); // leaked
    });
});
