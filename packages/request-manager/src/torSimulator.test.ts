import http from 'http';
import net from 'net';
import { SocksProxyAgent } from 'socks-proxy-agent';

import { TorSimulator } from '@trezor/e2e-utils';

// TorSimulator is the SOCKS5 test double the coinjoin/interceptor integration tests rely on to
// prove Tor identity isolation. These tests pin its own behavior directly, without the
// interceptor, so a regression in the mock cannot silently weaken those integration assertions.

describe('TorSimulator', () => {
    const simulator = new TorSimulator();
    let target: http.Server;
    let targetPort = 0;
    // total request body bytes the target actually received, keyed by path
    const receivedBytes: Record<string, number> = {};

    const socksAgent = (identity: string) =>
        new SocksProxyAgent(new URL(`socks://${identity}@127.0.0.1:${simulator.port}`));

    // POST `body` through the proxy, writing the head+first part and the rest in separate flushes
    // so the payload is split across the connect-pending window and multiple tunnel chunks
    const proxiedPost = (identity: string, path: string, head: Buffer, tail: Buffer) =>
        new Promise<number>((resolve, reject) => {
            const request = http.request(
                {
                    host: 'localhost',
                    port: targetPort,
                    path,
                    method: 'POST',
                    agent: socksAgent(identity),
                    headers: { 'Content-Length': String(head.length + tail.length) },
                },
                response => {
                    response.resume();
                    response.on('end', () => resolve(response.statusCode ?? 0));
                },
            );
            request.on('error', reject);
            request.write(head);
            setImmediate(() => {
                request.write(tail);
                request.end();
            });
        });

    beforeAll(async () => {
        target = http.createServer((request, response) => {
            const path = request.url ?? '';
            request.on('data', chunk => {
                receivedBytes[path] = (receivedBytes[path] ?? 0) + chunk.length;
            });
            request.on('end', () => response.end('ok'));
        });
        await new Promise<void>(resolve => target.listen(0, '127.0.0.1', resolve));
        const address = target.address();
        if (!address || typeof address === 'string') throw new Error('No target address');
        targetPort = address.port;

        await simulator.start();
    });

    afterAll(async () => {
        target?.close();
        await simulator.close();
    });

    it('records the identity credentials and target of each CONNECT', async () => {
        const before = simulator.connections.length;
        await proxiedPost('alice:secret-a', '/one', Buffer.from('x'), Buffer.from('y'));

        const connection = simulator.connections[before];
        expect(connection?.username).toBe('alice');
        expect(connection?.password).toBe('secret-a');
        expect(connection?.targetHost).toBe('localhost');
        expect(connection?.targetPort).toBe(targetPort);
        expect(connection?.outboundLocalPort).toEqual(expect.any(Number));
    });

    it('forwards a multi-chunk request body losslessly', async () => {
        // head+first write, then a large second write that lands after the SOCKS reply while the
        // outbound socket is still connecting, spanning many tunnel chunks
        const head = Buffer.alloc(100, 0x41);
        const tail = Buffer.alloc(200000, 0x42);

        const status = await proxiedPost('bob:secret-b', '/big', head, tail);

        expect(status).toBe(200);
        expect(receivedBytes['/big']).toBe(head.length + tail.length);
    });

    it('injects a connection reset for a matching identity and records the fault', async () => {
        simulator.setFaultRule(({ username }) =>
            username === 'faulty' ? 'reset-after-request' : undefined,
        );

        await expect(
            proxiedPost('faulty:secret-c', '/reset', Buffer.from('a'), Buffer.from('b')),
        ).rejects.toThrow();

        const faulted = simulator.connections.filter(c => c.username === 'faulty');
        expect(faulted).toHaveLength(1);
        expect(faulted[0]?.fault).toBe('reset-after-request');
        simulator.setFaultRule(undefined);
    });

    it('rejects a client that does not offer username/password auth', async () => {
        const rejected = await new Promise<Buffer>((resolve, reject) => {
            const socket = net.connect(simulator.port, '127.0.0.1', () => {
                // VER=5, NMETHODS=1, METHOD=0x00 (no auth) — the simulator requires 0x02
                socket.write(Buffer.from([0x05, 0x01, 0x00]));
            });
            socket.once('data', resolve);
            socket.on('error', reject);
        });

        expect(Array.from(rejected)).toEqual([0x05, 0xff]);
    });

    it('rejects an unsupported command (only CONNECT is supported)', async () => {
        const connectionsBefore = simulator.connections.length;
        const reply = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            const socket = net.connect(simulator.port, '127.0.0.1', () => {
                socket.write(Buffer.from([0x05, 0x01, 0x02])); // greeting: username/password
                socket.write(Buffer.from([0x01, 0x01, 0x61, 0x01, 0x62])); // auth user 'a' pass 'b'
                // request with CMD=0x03 (UDP ASSOCIATE), ATYP=IPv4, 0.0.0.0:80
                socket.write(Buffer.from([0x05, 0x03, 0x00, 0x01, 0, 0, 0, 0, 0, 0x50]));
            });
            socket.on('data', chunk => chunks.push(chunk));
            socket.on('end', () => resolve(Buffer.concat(chunks)));
            socket.on('error', reject);
        });

        // REP byte of the request reply must be 0x07 = command not supported
        expect(reply.subarray(reply.length - 10)[1]).toBe(0x07);
        expect(simulator.connections.length).toBe(connectionsBefore);
    });

    it('rejects an unsupported address type instead of forwarding to a broken host', async () => {
        const connectionsBefore = simulator.connections.length;
        const reply = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            const socket = net.connect(simulator.port, '127.0.0.1', () => {
                socket.write(Buffer.from([0x05, 0x01, 0x02])); // greeting: username/password
                socket.write(Buffer.from([0x01, 0x01, 0x61, 0x01, 0x62])); // auth user 'a' pass 'b'
                // request with ATYP=0x00 (invalid), one address byte, port 80
                socket.write(Buffer.from([0x05, 0x01, 0x00, 0x00, 0x00, 0x00, 0x50]));
            });
            // the simulator ends the socket after the error reply, so collect until close
            socket.on('data', chunk => chunks.push(chunk));
            socket.on('end', () => resolve(Buffer.concat(chunks)));
            socket.on('error', reject);
        });

        // last 10 bytes are the request reply; byte 1 (REP) must be 0x08 = address type unsupported
        const requestReply = reply.subarray(reply.length - 10);
        expect(requestReply[1]).toBe(0x08);
        // no connection is recorded for a rejected address type
        expect(simulator.connections.length).toBe(connectionsBefore);
    });
});
