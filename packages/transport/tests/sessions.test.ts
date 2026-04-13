import { SessionsBackground } from '../src/sessions/background';
import { SessionsClient } from '../src/sessions/client';
import { PathInternal, PathPublic, Session } from '../src/types';

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

    test('concurrent acquire on same path - one succeeds, one fails', async () => {
        const client1 = new SessionsClient(background);
        const client2 = new SessionsClient(background);
        await client1.handshake();
        await client2.handshake();

        await client1.enumerateDone({
            descriptors: [{ path: PathInternal('1'), type: 1, apiType: 'usb' }],
        });

        // Both clients issue acquireIntent concurrently with the same previous session.
        // client1 enters the queue first (synchronous execution order) and proceeds immediately.
        // client2 enters second and waits for client1's lock.
        const promise1 = client1.acquireIntent({ path: PathPublic('1'), previous: null });
        const promise2 = client2.acquireIntent({ path: PathPublic('1'), previous: null });

        // client1 succeeds immediately (first in queue).
        const acquire1 = await promise1;
        expect(acquire1).toMatchObject({ success: true, payload: { session: '1' } });

        // Complete client1's acquire, which releases the lock and commits session.
        await client1.acquireDone({ path: PathPublic('1') });

        // client2 wakes up and detects the session has changed.
        const acquire2 = await promise2;
        expect(acquire2).toMatchObject({
            success: false,
            error: { code: 'wrong previous session' },
        });
    });

    test('release with missing descriptor returns error and releases lock', async () => {
        const client1 = new SessionsClient(background);
        await client1.handshake();

        await client1.enumerateDone({
            descriptors: [{ path: PathInternal('1'), type: 1, apiType: 'usb' }],
        });

        // Acquire and release setup.
        await client1.acquireIntent({ path: PathPublic('1'), previous: null });
        await client1.acquireDone({ path: PathPublic('1') });

        const release = await client1.releaseIntent({ session: Session('1') });
        expect(release).toMatchObject({ success: true });

        // Simulate device disconnect by re-enumerating without the device.
        await client1.enumerateDone({ descriptors: [] });

        // ReleaseDone on a path that no longer exists should return error.
        const releaseDone = await client1.releaseDone({ path: PathInternal('1') });
        expect(releaseDone).toMatchObject({
            success: false,
            error: { code: 'device not found' },
        });

        // The lock should still be released - a subsequent acquire on a re-enumerated device should work.
        await client1.enumerateDone({
            descriptors: [{ path: PathInternal('2'), type: 1, apiType: 'usb' }],
        });

        const acquire2 = await client1.acquireIntent({
            path: PathPublic('2'),
            previous: null,
        });
        expect(acquire2).toMatchObject({ success: true });
        await client1.acquireDone({ path: PathPublic('2') });
    });

    test('clearLock only releases own lock, not another requester lock', async () => {
        const client1 = new SessionsClient(background);
        const client2 = new SessionsClient(background);
        await client1.handshake();
        await client2.handshake();

        await client1.enumerateDone({
            descriptors: [{ path: PathInternal('1'), type: 1, apiType: 'usb' }],
        });

        // Client 1 acquires successfully.
        const acquire1 = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });
        expect(acquire1).toMatchObject({ success: true });
        await client1.acquireDone({ path: PathPublic('1') });

        // Client 2 tries to acquire with wrong previous - fails before queue.
        const acquire2 = await client2.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });
        expect(acquire2).toMatchObject({
            success: false,
            error: { code: 'wrong previous session' },
        });

        // Client 2 can still acquire with correct previous.
        const acquire3 = await client2.acquireIntent({
            path: PathPublic('1'),
            previous: Session('1'),
        });
        expect(acquire3).toMatchObject({
            success: true,
            payload: { session: '2' },
        });
        await client2.acquireDone({ path: PathPublic('1') });
    });
});
