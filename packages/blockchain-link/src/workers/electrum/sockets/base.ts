import type { Socket as TCPSocket, TcpSocketConnectOpts } from 'net';
import type { SocksProxyAgent } from 'socks-proxy-agent';
import type { TLSSocket } from 'tls';

import { isNative } from '@trezor/env-utils';

import type { ISocket, SocketListener } from './interface';

const TIMEOUT = 10000;
const KEEP_ALIVE = true;

type Socket = TCPSocket | TLSSocket;

export type SocketOptions = {
    timeout?: number;
    keepAlive?: boolean;
    proxyAgent?: SocksProxyAgent;
};

type Err = Error &
    Partial<{
        errorno: string;
        code: string;
        connect: boolean;
    }>;

export type SocketConfig = SocketOptions & {
    host: string;
    port: number;
};

type ConnectOptions = TcpSocketConnectOpts & {
    connectTimeout?: number; // honoured by react-native-tcp-socket
};

export abstract class SocketBase implements ISocket {
    private socket?: Socket;
    protected host: string;
    protected port: number;
    protected timeout: number;
    protected keepAlive: boolean;

    constructor({ host, port, timeout, keepAlive }: SocketConfig) {
        this.host = host;
        this.port = port;
        this.timeout = timeout !== undefined ? timeout : TIMEOUT;
        this.keepAlive = keepAlive !== undefined ? keepAlive : KEEP_ALIVE;
    }

    protected connectOptions(): ConnectOptions {
        const options: ConnectOptions = { host: this.host, port: this.port };

        if (isNative()) {
            // The React Native connect() method has no timeout and thus stays pending until
            // the OS gives up on it, which leaves the socket and its native client behind.
            options.connectTimeout = this.timeout;
        }

        return options;
    }

    async connect(listener: SocketListener) {
        this.socket = await this.openSocket(listener);
    }

    close() {
        this.socket?.end();
        this.socket?.destroy();
    }

    send(data: string | Uint8Array) {
        return this.socket?.write(data);
    }

    protected abstract openSocket(listener: SocketListener): Promise<Socket>;

    protected configureSocket(socket: Socket) {
        socket.setTimeout(this.timeout);
        socket.setEncoding('utf8');
        socket.setKeepAlive(this.keepAlive);
        socket.setNoDelay(true);
    }

    protected bindSocket(socket: Socket, listener: SocketListener) {
        socket.on('connect', () => {
            socket.setTimeout(0);
            listener.onConnect();
        });

        socket.on('close', e => {
            listener.onClose(e);
        });

        socket.on('timeout', () => {
            const e: Err = new Error('ETIMEDOUT');
            e.errorno = 'ETIMEDOUT';
            e.code = 'ETIMEDOUT';
            e.connect = false;
            socket.emit('error', e);
        });

        socket.on('data', chunk => {
            socket.setTimeout(0);
            listener.onReceive(chunk);
        });

        socket.on('end', (e: unknown) => {
            socket.setTimeout(0);
            listener.onEnd(e);
        });

        socket.on('error', e => {
            listener.onError(e);
        });
    }
}
