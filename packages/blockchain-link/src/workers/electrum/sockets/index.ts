import { CustomError } from '@trezor/blockchain-link-types';
import { parseElectrumUrl, throwError } from '@trezor/utils';

import type { SocketBase, SocketOptions } from './base';
import { TcpSocket } from './tcp';
import { TlsSocket } from './tls';

export const createSocket = (url: string, options?: SocketOptions): SocketBase => {
    const { host, port, protocol } =
        parseElectrumUrl(url) ?? throwError(new CustomError('Invalid electrum url'));
    const { timeout, keepAlive } = options || {};
    switch (protocol) {
        case 't': // TCP socket
            return new TcpSocket({ host, port, timeout, keepAlive });
        case 's': // TLS socket
        default:
            return new TlsSocket({ host, port, timeout, keepAlive });
    }
};
