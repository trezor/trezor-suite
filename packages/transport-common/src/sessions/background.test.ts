import { PathInternal, PathPublic, Session } from '../types';
import { SessionsBackground } from './background';
import { SessionsClient } from './client';
import { type SessionsBackgroundInterface } from './types';

describe('sessions', () => {
    let background: SessionsBackground;

    beforeEach(() => {
        background = new SessionsBackground();
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

    test('releaseDone with disconnected device errors but releases the lock', async () => {
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
        await client1.acquireDone({ path: PathPublic('1') });

        const releaseIntent = await client1.releaseIntent({ session: Session('1') });
        expect(releaseIntent).toMatchObject({ success: true, payload: { path: '1' } });

        // device disconnects while the caller is closing it
        await client1.enumerateDone({ descriptors: [] });

        const releaseDone = await client1.releaseDone({ path: PathInternal('1') });
        expect(releaseDone).toMatchObject({
            success: false,
            error: { code: 'device not found' },
        });

        // the lock taken by releaseIntent was freed: a fresh acquire of the
        // reconnected device must resolve immediately, not by waiting out the
        // 4s safety-net timer of a leaked lock (hence the race; the sentinel
        // must stay well below lockDuration in background.ts)
        await client1.enumerateDone({
            descriptors: [{ path: PathInternal('1'), type: 1, apiType: 'usb' }],
        });
        const acquireAgain = await Promise.race([
            client1.acquireIntent({ path: PathPublic('2'), previous: null }),
            new Promise(resolve =>
                setTimeout(() => resolve('stuck behind the safety-net timer'), 1000),
            ),
        ]);
        expect(acquireAgain).toMatchObject({ success: true });

        // cleanup: release the lock acquireAgain just took
        await client1.acquireDone({ path: PathPublic('2'), abort: true });
    });

    // paths are raw USB serial numbers, so a (hostile or broken) device can
    // present a serial colliding with an Object.prototype member; such a device
    // must still register and go through the acquire/release lifecycle
    test('descriptor paths colliding with Object.prototype keys', async () => {
        const client1 = new SessionsClient(background);
        await client1.handshake();

        await client1.enumerateDone({
            descriptors: [
                { path: PathInternal('toString'), type: 1, apiType: 'usb' },
                { path: PathInternal('__proto__'), type: 1, apiType: 'usb' },
            ],
        });

        const sessions = await client1.getSessions();
        expect(sessions).toMatchObject({
            success: true,
            payload: { descriptors: [{ path: '1' }, { path: '2' }] },
        });

        const acquireIntent = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });
        expect(acquireIntent).toMatchObject({ success: true, payload: { path: 'toString' } });
        await client1.acquireDone({ path: PathPublic('1') });

        const releaseIntent = await client1.releaseIntent({ session: Session('1') });
        expect(releaseIntent).toMatchObject({ success: true, payload: { path: 'toString' } });
        const releaseDone = await client1.releaseDone({ path: PathInternal('toString') });
        expect(releaseDone).toMatchObject({ success: true });

        // and nothing leaked into the global prototype
        expect((Object.prototype as any).session).toBeUndefined();
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
