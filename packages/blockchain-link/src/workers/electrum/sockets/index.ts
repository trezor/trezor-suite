import { CustomError } from '../../../constants/errors';
import { TcpSocket } from './tcp';
import { TlsSocket } from './tls';
import { TorSocket } from './tor';
import type { SocketBase, SocketOptions } from './base';

export const createSocket = (url: string, options?: SocketOptions): SocketBase => {
    const [host, portString, protocol] = url.replace(/.*:\/\//, '').split(':');
    if (!host) throw new CustomError('Missing host');
    const port = Number.parseInt(portString, 10);
    if (!port) throw new CustomError('Invalid port');
    const { timeout, keepAlive, proxyAgent } = options || {};
    // Onion address is TCP over Tor
    if (proxyAgent /* host.endsWith('.onion') */) {
        return new TorSocket({
            host,
            port,
            timeout,
            keepAlive,
            proxyAgent,
        });
    }
    // TCP socket
    if (protocol === 't') {
        return new TcpSocket({ host, port, timeout, keepAlive });
    }
    // TLS socket
    if (!protocol || protocol === 's') {
        return new TlsSocket({ host, port, timeout, keepAlive });
    }
    throw new CustomError('Invalid protocol');
};
