import net from 'net';

// Minimal SOCKS5 server (RFC 1928 + RFC 1929 username/password auth) standing in for the Tor
// SOCKS proxy in tests. It records every CONNECT together with the credentials which encode
// the Tor identity (circuit isolation), so tests can assert which identity was used for which
// request. It can also inject connection faults to exercise the circuit-reset code paths.

export type SocksFault = 'reset-after-request';

export interface RecordedConnection {
    username: string;
    password: string;
    targetHost: string;
    targetPort: number;
    // local port of the outbound socket towards the target. The target server sees this value
    // as `socket.remotePort`, which allows pairing proxied HTTP requests with SOCKS identities
    outboundLocalPort?: number;
    // set when the outbound connection fails, so a harness misconfiguration (unreachable
    // target) is distinguishable from an injected fault in the recorded log
    outboundError?: string;
    fault?: SocksFault;
}

export type SocksFaultRule = (details: {
    username: string;
    password: string;
    targetHost: string;
    targetPort: number;
    // first data chunk of the proxied stream, for HTTP typically `POST /path HTTP/1.1...`
    httpRequestHead: string;
}) => SocksFault | undefined;

// used to abandon handshake parsing when the client disconnects mid-handshake
const socketClosedError = new Error('Socket closed during SOCKS handshake');

const formatIpv6 = (bytes: Buffer) => {
    const hextets: string[] = [];
    for (let i = 0; i < bytes.length; i += 2) {
        hextets.push(bytes.readUInt16BE(i).toString(16));
    }

    return hextets.join(':');
};

const createSocketReader = (socket: net.Socket) => {
    let buffer = Buffer.alloc(0);
    let closed = false;
    let pending:
        | { size: number | undefined; resolve: (chunk: Buffer) => void; reject: (e: Error) => void }
        | undefined;

    const tryResolve = () => {
        if (!pending) return;
        // without a requested size deliver everything buffered so far (but never nothing)
        const size = pending.size ?? (buffer.length || undefined);
        if (size === undefined || buffer.length < size) return;

        const { resolve } = pending;
        pending = undefined;
        const chunk = buffer.subarray(0, size);
        buffer = buffer.subarray(size);
        resolve(chunk);
    };

    const onData = (data: Buffer) => {
        buffer = Buffer.concat([buffer, data]);
        tryResolve();
    };
    socket.on('data', onData);
    socket.on('close', () => {
        closed = true;
        if (pending) {
            const { reject } = pending;
            pending = undefined;
            reject(socketClosedError);
        }
    });

    const wait = (size?: number) =>
        new Promise<Buffer>((resolve, reject) => {
            if (closed) return reject(socketClosedError);
            pending = { size, resolve, reject };
            tryResolve();
        });

    return {
        read: (size: number) => wait(size),
        // resolves with everything buffered, waiting for the next chunk if nothing is buffered
        readSome: () => wait(),
        // stop consuming 'data' events; the caller must pause the socket first, otherwise
        // a flowing stream without 'data' listeners silently discards incoming bytes
        detach: () => {
            socket.off('data', onData);
        },
    };
};

export class TorSimulator {
    port = 0;
    connections: RecordedConnection[] = [];

    private server?: net.Server;
    private sockets = new Set<net.Socket>();
    private faultRule?: SocksFaultRule;

    async start() {
        const server = net.createServer(socket => this.handleConnection(socket));
        this.server = server;
        // bind to loopback only: this proxy accepts any credentials and forwards to any target,
        // so binding to all interfaces would expose a transient open proxy on the network.
        // listen on an OS-assigned port; picking a "free" port upfront would be a TOCTOU race
        await new Promise<void>((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, '127.0.0.1', resolve);
        });
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('No listening address');
        this.port = address.port;
    }

    setFaultRule(rule?: SocksFaultRule) {
        this.faultRule = rule;
    }

    async close() {
        this.sockets.forEach(socket => socket.destroy());
        this.sockets.clear();
        await new Promise<void>(resolve => {
            if (!this.server) return resolve();
            this.server.close(() => resolve());
        });
    }

    private track(socket: net.Socket) {
        this.sockets.add(socket);
        socket.on('error', () => {}); // injected faults produce expected socket errors
        socket.on('close', () => this.sockets.delete(socket));
    }

    private async handleConnection(socket: net.Socket) {
        this.track(socket);
        try {
            await this.handleSocksSession(socket);
        } catch {
            // client aborted mid-handshake (e.g. request cancelled), nothing to proxy
            socket.destroy();
        }
    }

    private async handleSocksSession(socket: net.Socket) {
        const reader = createSocketReader(socket);

        // greeting: VER, NMETHODS, METHODS[]
        const greeting = await reader.read(2);
        if (greeting[0] !== 0x05) {
            // not a SOCKS5 client; nothing sensible to reply, drop the connection
            socket.destroy();

            return;
        }
        const methods = await reader.read(greeting[1] ?? 0);
        if (!methods.includes(0x02)) {
            // identities are transported via username/password auth, anything else is a bug
            socket.end(Buffer.from([0x05, 0xff]));

            return;
        }
        socket.write(Buffer.from([0x05, 0x02]));

        // username/password sub-negotiation: VER, ULEN, UNAME, PLEN, PASSWD
        await reader.read(1);
        const usernameLength = await reader.read(1);
        const username = (await reader.read(usernameLength[0] ?? 0)).toString('utf8');
        const passwordLength = await reader.read(1);
        const password = (await reader.read(passwordLength[0] ?? 0)).toString('utf8');
        socket.write(Buffer.from([0x01, 0x00]));

        // request: VER, CMD, RSV, ATYP, DST.ADDR, DST.PORT
        const requestHead = await reader.read(4);
        if (requestHead[1] !== 0x01) {
            // only CONNECT is supported (not BIND / UDP ASSOCIATE) -> SOCKS5 reply 0x07
            socket.end(Buffer.from([0x05, 0x07, 0x00, 0x01, 0, 0, 0, 0, 0, 0]));

            return;
        }
        const addressType = requestHead[3];
        let targetHost: string;
        switch (addressType) {
            case 0x01: // IPv4
                targetHost = Array.from(await reader.read(4)).join('.');
                break;
            case 0x03: {
                // domain name (what socks-proxy-agent sends: hostname resolved by the proxy)
                const length = await reader.read(1);
                targetHost = (await reader.read(length[0] ?? 0)).toString('utf8');
                break;
            }
            case 0x04: // IPv6: 16 bytes -> eight colon-separated hextets
                targetHost = formatIpv6(await reader.read(16));
                break;
            default:
                // unsupported address type -> SOCKS5 reply 0x08, never forward to a broken host
                socket.end(Buffer.from([0x05, 0x08, 0x00, 0x01, 0, 0, 0, 0, 0, 0]));

                return;
        }
        const targetPort = (await reader.read(2)).readUInt16BE(0);

        const connection: RecordedConnection = { username, password, targetHost, targetPort };
        this.connections.push(connection);

        // reply success before seeing the proxied payload, so the fault decision can be based
        // on the first chunk of the tunneled HTTP request
        socket.write(Buffer.from([0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0]));
        const firstChunk = await reader.readSome();

        const fault = this.faultRule?.({
            username,
            password,
            targetHost,
            targetPort,
            httpRequestHead: firstChunk.toString('latin1'),
        });
        if (fault === 'reset-after-request') {
            connection.fault = fault;
            socket.destroy();

            return;
        }

        // buffer everything arriving while the outbound connection is being established;
        // pipe() below resumes the socket and replays the internally buffered bytes, so
        // requests spanning multiple chunks are forwarded losslessly
        socket.pause();
        reader.detach();

        const outbound = net.connect(targetPort, targetHost, () => {
            connection.outboundLocalPort = outbound.localPort;
            outbound.write(firstChunk);
            socket.pipe(outbound);
            outbound.pipe(socket);
        });
        this.track(outbound);
        outbound.on('error', error => {
            connection.outboundError = error.message;
        });
        outbound.on('close', () => socket.destroy());
        socket.on('close', () => outbound.destroy());
    }
}
