import { SessionsClient } from '../src/sessions/client';
import { SessionsBackground } from '../src/sessions/background';
import { PathInternal, PathPublic, Session } from '../src/types';

describe('sessions', () => {
    let requestFn: SessionsClient['request'];

    beforeEach(() => {
        const background = new SessionsBackground();
        requestFn = params => background.handleMessage(params);
    });

    test('acquire without previous enumerate', async () => {
        const client1 = new SessionsClient();
        client1.init({ requestFn });
        await client1.handshake();

        const acquireIntent = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });

        expect(acquireIntent).toEqual({
            success: false,
            id: 1,
            error: 'descriptor not found',
        });
    });

    test('acquire', async () => {
        const client1 = new SessionsClient();
        client1.init({ requestFn });
        await client1.handshake();

        await client1.enumerateDone({ descriptors: [{ path: PathInternal('abc'), type: 1 }] });

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
                descriptors: [
                    {
                        path: '1', // <= pathPublic
                        session: '1',
                        type: 1,
                    },
                ],
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
                    },
                ],
            },
        });
    });

    test('acquire', async () => {
        expect.assertions(3);

        const client1 = new SessionsClient();
        client1.init({ requestFn });
        await client1.handshake();

        await client1.enumerateDone({ descriptors: [{ path: PathInternal('1'), type: 1 }] });

        const acquire1 = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });
        expect(acquire1).toMatchObject({
            success: true,
            payload: {
                session: '1',
                descriptors: [
                    {
                        path: '1',
                        session: '1',
                    },
                ],
            },
        });

        await client1.acquireDone({ path: PathPublic('1') });

        const acquire2 = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });
        expect(acquire2).toMatchObject({
            success: true,
            payload: {
                session: '2',
                descriptors: [
                    {
                        path: '1',
                        session: '2',
                    },
                ],
            },
        });

        await client1.acquireDone({ path: PathPublic('1') });

        const acquire3 = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: Session('1'),
        });

        expect(acquire3).toMatchObject({
            success: false,
            error: 'wrong previous session',
        });

        await client1.acquireDone({ path: PathPublic('1') });
    });

    test('acquire - release - acquire', async () => {
        const client1 = new SessionsClient();
        client1.init({ requestFn });
        await client1.handshake();

        await client1.enumerateDone({ descriptors: [{ path: PathInternal('1'), type: 1 }] });

        const acquire1Intent = await client1.acquireIntent({
            path: PathPublic('1'),
            previous: null,
        });
        expect(acquire1Intent).toMatchObject({
            success: true,
            payload: {
                session: '1',
                descriptors: [
                    {
                        path: '1',
                        session: '1',
                    },
                ],
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
});
