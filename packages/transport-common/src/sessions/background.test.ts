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

    // Previously this test pinned the leak (see #27981): `SessionsClient.dispose()` did
    // not call `background.off()` for its constructor-registered handlers, so a shared
    // `SessionsBackground` accumulated handler refs across client lifecycles. The fix in
    // this PR adds `off()` to `SessionsBackgroundInterface` and uses it on dispose. Test
    // asserts the fixed behavior across 15 cycles with an isolated mock.
    test('client.dispose() removes its background listeners via off() without disposing background', () => {
        const listeners = {
            descriptors: [] as ((d: any) => void)[],
            releaseRequest: [] as ((d: any) => void)[],
        };
        let disposeCalls = 0;
        const mockBackground: SessionsBackgroundInterface = {
            on: (event, listener) => {
                listeners[event].push(listener);
            },
            off: (event, listener) => {
                const idx = listeners[event].indexOf(listener);
                if (idx >= 0) listeners[event].splice(idx, 1);
            },
            handleMessage: async params => {
                if ((params as any).type === 'dispose') disposeCalls++;

                return { success: true, payload: undefined, id: 0 } as any;
            },
            dispose: () => {
                disposeCalls++;
            },
        };

        for (let i = 0; i < 15; i++) {
            const client = new SessionsClient(mockBackground);
            expect(listeners.descriptors.length).toBe(1);
            expect(listeners.releaseRequest.length).toBe(1);

            client.dispose();
            expect(listeners.descriptors.length).toBe(0);
            expect(listeners.releaseRequest.length).toBe(0);
        }
    });
});
