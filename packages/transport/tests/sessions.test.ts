import { SessionsClient } from '../src/sessions/client';
import { SessionsBackground } from '../src/sessions/background';

// todo: 3 clients, test queue

describe('sessions', () => {
    let requestFn: SessionsClient['request'];

    const onDescriptors = () => {};

    beforeEach(() => {
        const backend = new SessionsBackground(onDescriptors);
        requestFn = (params: any) =>
            // @ts-expect-error
            backend[params.type](params.payload);
    });

    test('concurrent enumerate', async () => {
        const client1 = new SessionsClient({ requestFn });
        const client2 = new SessionsClient({ requestFn });
        const client3 = new SessionsClient({ requestFn });

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

        expect(client1Promise).resolves.toMatchObject({ type: 'ack' });
        expect(clientPromiseResolved).toEqual([true, false, false]);

        expect(client1.enumerateDone({ connectedDevices: [] })).resolves.toMatchObject({
            type: 'ack',
        });

        await client2Promise;

        expect(clientPromiseResolved).toEqual([true, true, false]);

        expect(client2Promise).resolves.toMatchObject({ type: 'ack' });
        expect(client2.enumerateDone({ connectedDevices: [] })).resolves.toMatchObject({
            type: 'ack',
        });

        await client3Promise;
        expect(clientPromiseResolved).toEqual([true, true, true]);

        expect(client3.enumerateDone({ connectedDevices: [] })).resolves.toMatchObject({
            type: 'ack',
        });
    });

    test('acquire', () => {
        const client1 = new SessionsClient({ requestFn });
        expect(client1.acquireIntent({ path: '1', previous: null })).resolves.toMatchObject({
            type: 'ack',
        });
        expect(client1.acquireDone({ path: '1' })).resolves.toEqual({
            type: 'ack',
            session: '1',
            descriptors: [
                {
                    path: '1',
                    session: '1',
                },
            ],
        });
    });

    test('acquire', async () => {
        expect.assertions(3);

        const client1 = new SessionsClient({ requestFn });

        const acquire1 = await client1.acquireIntent({
            path: '1',
            previous: null,
        });
        expect(acquire1).toEqual({
            type: 'ack',
        });

        await client1.acquireDone({ path: '1' });

        const acquire2 = await client1.acquireIntent({
            path: '1',
            previous: null,
        });
        expect(acquire2).toEqual({
            type: 'ack',
        });

        await client1.acquireDone({ path: '1' });

        const acquire3 = await client1.acquireIntent({
            path: '1',
            previous: '1',
        });

        expect(acquire3).toEqual({
            type: 'nope',
            reason: 'wrong previous session',
        });

        await client1.acquireDone({ path: '1' });
    });

    test('acquire - release - acquire', async () => {
        const client1 = new SessionsClient({ requestFn });

        const acquire1Intent = await client1.acquireIntent({ path: '1', previous: null });
        expect(acquire1Intent).toEqual({
            type: 'ack',
        });

        const acquire1Done = await client1.acquireDone({ path: '1' });
        expect(acquire1Done).toEqual({
            type: 'ack',
            session: '1',
            descriptors: [
                {
                    path: '1',
                    session: '1',
                },
            ],
        });

        const sessions1 = await client1.getSessions();
        expect(sessions1).toEqual({
            type: 'ack',
            sessions: {
                '1': '1',
            },
        });

        const release1 = await client1.releaseIntent({ session: '1' });
        expect(release1).toEqual({
            type: 'ack',
            path: '1',
        });

        const release1Done = await client1.releaseDone({ path: '1' });
        expect(release1Done).toEqual({
            type: 'ack',
            descriptors: [
                {
                    path: '1',
                    session: null,
                },
            ],
        });

        const sessions2 = await client1.getSessions();
        expect(sessions2).toEqual({
            type: 'ack',
            sessions: {
                '1': null,
            },
        });
    });
});
