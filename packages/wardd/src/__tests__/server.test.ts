import { WebSocket } from 'ws';

import { InMemoryWardDb, type RelayDevice, type WardRelayEndpoint } from '@trezor/ward';

import { WarddClient } from '../client';
import { startServer } from '../server';
import { Wardd } from '../service';
import { MockWm } from '../wm';

const WARD_ID = 'cd'.repeat(32);
const TOKEN = 'pairing-token';

describe('wardd over the WebSocket', () => {
    let server: Awaited<ReturnType<typeof startServer>>;
    let storage: InMemoryWardDb;
    let url: string;

    beforeEach(async () => {
        storage = new InMemoryWardDb();
        server = await startServer({
            wardd: new Wardd({ storage, wm: new MockWm() }),
            token: TOKEN,
            port: 0,
        });
        url = `ws://127.0.0.1:${server.port}`;
    });

    afterEach(() => server.close());

    const client = (token = TOKEN) =>
        new WarddClient({
            url,
            token,
            WebSocket: WebSocket as unknown as typeof globalThis.WebSocket,
        });

    it('refuses a wrong pairing token', async () => {
        await expect(client('wrong').connect()).rejects.toMatchObject({ code: 'unauthorised' });
    });

    it('answers a pull raised inside a conversation on the same socket', async () => {
        const endpoint: WardRelayEndpoint = await client().connect();
        const pulls: unknown[] = [];
        // An insert into an empty tree: the device pulls the pre-state proof while wardd is still
        // waiting on the WARDPerformUpdate reply -- the adapter's answerProofRequest overlaps the call.
        const device: RelayDevice = async ({ name, message }) => {
            switch (name) {
                case 'WARDSync':
                    return {
                        name: 'WARDSyncAck',
                        message: {
                            nonce: 'ab'.repeat(32),
                            version: 1,
                            counter: 0,
                            root_known: true,
                            ward_id: WARD_ID,
                        },
                    };
                case 'WARDListPendingEdits':
                    return { name: 'WARDListPendingEditsAck', message: { pending_ids: [] } };
                case 'WARDIngestAttestation':
                    pulls.push(
                        await endpoint.call('answerProofRequest', {
                            request: { entry_key: '11'.repeat(32) },
                        }),
                    );

                    return { name: 'WARDIngestAttestationAck', message: { counter: 0 } };
                case 'WARDReconcile':
                    return { name: 'WARDReconcileAck', message: { counter: 0 } };
                case 'WARDValidateCache': // a firmware that predates the offline-cache check
                    return { name: 'Failure', message: { message: 'Unexpected message' } };
                default:
                    return {
                        name: 'Failure',
                        message: { message: `unexpected ${name} ${message}` },
                    };
            }
        };

        const result = await endpoint.call(
            'sync',
            { appId: 'btc', address: 'bc1q', networkSymbol: 'btc', metadata: { label: 'x' } },
            device,
        );

        expect(result).toMatchObject({ wardId: WARD_ID, counter: 0, root: '' });
        expect(pulls).toEqual([{ proof: [] }]);
        expect(storage.getTreeState(WARD_ID)).toMatchObject({ counter: 0, root: '' });
        await expect(endpoint.call('status')).resolves.toEqual({
            wardId: WARD_ID,
            counter: 0,
            root: '',
        });
        endpoint.close();
    });

    it('turns a device error into a Failure reply, ending the conversation', async () => {
        const endpoint = await client().connect();
        const device: RelayDevice = () => Promise.reject(new Error('device unplugged'));

        await expect(endpoint.call('sync', {}, device)).rejects.toMatchObject({
            code: 'device_failure',
        });
        endpoint.close();
    });
});
