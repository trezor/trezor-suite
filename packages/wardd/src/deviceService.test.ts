import { createSocket } from 'dgram';
import type { AddressInfo } from 'net';

import type { RelayMessage, WardRelayEndpoint } from '@trezor/ward';

import { DeviceServiceConnection, startDeviceService } from './deviceService';
import { ServiceCodec } from './serviceCodec';
import { mockServiceTransport } from '../mocks/mockServiceTransport';

const exercise = async (request: RelayMessage, backend: WardRelayEndpoint) => {
    const { transport, incoming, written } = mockServiceTransport();
    const codec = new ServiceCodec(transport);
    await codec.write(request);
    incoming.push(...written.splice(0));
    await new DeviceServiceConnection(transport, backend).serveOne();
    incoming.push(...written);

    return codec.read();
};

it('rejects a backend request to wipe the device and sanitizes its error', async () => {
    const backend: WardRelayEndpoint = {
        call: async (_method, _params, device) => {
            await device!({ name: 'WipeDevice', message: {} });
            throw new Error('private backend detail');
        },
        close: () => {},
    };
    const reply = await exercise(
        {
            name: 'WARDSyncAck',
            message: { nonce: '00'.repeat(32), version: 2, counter: 0, root_known: true },
        },
        backend,
    );

    expect(reply.name).toBe('Failure');
    expect(reply.message.message).toBe('WARD backend unavailable');
});

it('requests only one trie node at a time', async () => {
    const calls: unknown[] = [];
    const backend: WardRelayEndpoint = {
        call: (method, params) => {
            calls.push({ method, params });

            return Promise.resolve({ nodes: [] });
        },
        close: () => {},
    };
    const reply = await exercise(
        { name: 'WARDNodeRequest', message: { node_hash: 'ab'.repeat(32) } },
        backend,
    );

    expect(calls).toEqual([
        {
            method: 'answerNodeRequest',
            params: { request: { node_hash: 'ab'.repeat(32) }, maxNodes: 1 },
        },
    ]);
    expect(reply.name).toBe('WARDNodeAck');
});

it('opens and releases the service binding on the emulator port plus seven', async () => {
    const server = createSocket('udp4');
    await new Promise<void>(resolve => server.bind(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    const announcements: unknown[] = [];
    const backend: WardRelayEndpoint = {
        call: () => Promise.resolve({}),
        close: () => {},
    };
    const received = mockServiceTransport();
    const codec = new ServiceCodec(received.transport);
    let peerError: unknown;
    server.on('message', (report, peer) => {
        received.incoming.push(report);
        void (async () => {
            const message = await codec.read();
            announcements.push(message.message.close);
            await codec.write({
                name: 'WARDServiceOpenAck',
                message: { protocol_version: 1, buffer_size: 64 },
            });
            for (const response of received.written.splice(0)) {
                await new Promise<void>((resolve, reject) =>
                    server.send(response, peer.port, peer.address, error =>
                        error ? reject(error) : resolve(),
                    ),
                );
            }
        })().catch(error => {
            peerError = error;
        });
    });
    let hasFailed = false;
    try {
        const connection = await startDeviceService({
            wardd: { connect: () => Promise.resolve(backend) },
            devicePath: `udp:127.0.0.1:${port - 7}`,
            onError: () => {
                hasFailed = true;
            },
        });
        await connection.close();

        expect(announcements).toEqual([false, true]);
        expect(hasFailed).toBe(false);
        expect(peerError).toBeUndefined();
    } finally {
        await new Promise<void>(resolve => server.close(resolve));
    }
});
