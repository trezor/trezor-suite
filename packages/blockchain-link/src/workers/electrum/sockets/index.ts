import { parseElectrumUrl } from '@trezor/utils';
import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import { TcpSocket } from './tcp';
import { TlsSocket } from './tls';
import { TorSocket } from './tor';
import type { SocketBase, SocketOptions } from './base';

export const createSocket = (url: string, options?: SocketOptions): SocketBase => {
    const parsed = parseElectrumUrl(url);
    if (!parsed) throw new CustomError('Invalid electrum url');
    const { host, port, protocol } = parsed;
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
    switch (protocol) {
        case 't': // TCP socket
            return new TcpSocket({ host, port, timeout, keepAlive });
        case 's': // TLS socket
        default:
            return new TlsSocket({ host, port, timeout, keepAlive });
    }
};
