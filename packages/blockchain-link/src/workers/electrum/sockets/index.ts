import { CustomError } from '@trezor/blockchain-link-types';
import { parseElectrumUrl, throwError } from '@trezor/utils';

import type { SocketBase, SocketOptions } from './base';
import { TcpSocket } from './tcp';
import { TlsSocket } from './tls';
import { TorSocket } from './tor';

export const createSocket = (url: string, options?: SocketOptions): SocketBase => {
    const { host, port, protocol } =
        parseElectrumUrl(url) ?? throwError(new CustomError('Invalid electrum url'));
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
