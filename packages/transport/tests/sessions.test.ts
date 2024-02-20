import { SessionsClient } from '../src/sessions/client';
import { SessionsBackground } from '../src/sessions/background';

describe('sessions', () => {
    let requestFn: SessionsClient['request'];

    beforeEach(() => {
        const background = new SessionsBackground();
        requestFn = params => background.handleMessage(params);
    });

    test('concurrent enumerate', async () => {
        const client1 = new SessionsClient({
            requestFn,
            registerBackgroundCallbacks: () => {},
        });
        const client2 = new SessionsClient({
            requestFn,
            registerBackgroundCallbacks: () => {},
        });
        const client3 = new SessionsClient({
            requestFn,
            registerBackgroundCallbacks: () => {},
        });

        await client1.handshake();
        await client2.handshake();
        await client3.handshake();

        const clientPromiseResolved = [false, false, false];

        const [client1Promise, client2Promise, client3Promise] = [client1, client2, client3].map(
            async (client, index) => {
                const res = await client.enumerateIntent();
                clientPromiseResolved[index] = true;

                return res;
            },
        );
        expect(clientPromiseResolved).toEqual([false, false, false]);
        await client1Promise;

        expect(client1Promise).resolves.toMatchObject({
            success: true,
            id: 1,
            payload: { sessions: {} },
        });
        expect(clientPromiseResolved).toEqual([true, false, false]);

        expect(client1.enumerateDone({ paths: [] })).resolves.toMatchObject({
            success: true,
        });

        await client2Promise;

        expect(clientPromiseResolved).toEqual([true, true, false]);

        expect(client2Promise).resolves.toMatchObject({ success: true });
        expect(client2.enumerateDone({ paths: [] })).resolves.toMatchObject({
            success: true,
        });

        await client3Promise;
        expect(clientPromiseResolved).toEqual([true, true, true]);

        expect(client3.enumerateDone({ paths: [] })).resolves.toMatchObject({
            success: true,
        });
    });

    test('acquire', async () => {
        const client1 = new SessionsClient({ requestFn });
        await client1.handshake();

        const acquireIntent = await client1.acquireIntent({ path: '1', previous: null });

        expect(acquireIntent).toEqual({
            success: true,
            id: 1,
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
        const acquireDone = await client1.acquireDone({ path: '1' });
        expect(acquireDone).toEqual({
            success: true,
            id: 2,
            payload: {
                descriptors: [
                    {
                        path: '1',
                        session: '1',
                    },
                ],
            },
        });
    });

    test('acquire', async () => {
        expect.assertions(3);

        const client1 = new SessionsClient({ requestFn });
        await client1.handshake();

        const acquire1 = await client1.acquireIntent({
            path: '1',
            previous: null,
        });
        expect(acquire1).toEqual({
            success: true,
            id: 1,
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

        await client1.acquireDone({ path: '1' });

        const acquire2 = await client1.acquireIntent({
            path: '1',
            previous: null,
        });
        expect(acquire2).toEqual({
            success: true,
            id: 3,
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

        await client1.acquireDone({ path: '1' });

        const acquire3 = await client1.acquireIntent({
            path: '1',
            previous: '1',
        });

        expect(acquire3).toEqual({
            success: false,
            id: 5,
            error: 'wrong previous session',
        });

        await client1.acquireDone({ path: '1' });
    });

    test('acquire - release - acquire', async () => {
        const client1 = new SessionsClient({ requestFn });
        await client1.handshake();

        const acquire1Intent = await client1.acquireIntent({ path: '1', previous: null });
        expect(acquire1Intent).toEqual({
            success: true,
            id: 1,
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

        const acquire1Done = await client1.acquireDone({ path: '1' });
        expect(acquire1Done).toEqual({
            success: true,
            id: 2,
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
        expect(sessions1).toEqual({
            success: true,
            id: 3,
            payload: {
                sessions: {
                    '1': '1',
                },
            },
        });

        const release1 = await client1.releaseIntent({ session: '1' });
        expect(release1).toEqual({
            success: true,
            id: 4,
            payload: {
                path: '1',
            },
        });

        const release1Done = await client1.releaseDone({ path: '1' });
        expect(release1Done).toEqual({
            success: true,
            id: 5,
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
        expect(sessions2).toEqual({
            success: true,
            id: 6,
            payload: {
                sessions: {
                    '1': null,
                },
            },
        });
    });
});
