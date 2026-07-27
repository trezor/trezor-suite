import { Socket } from 'net';
import { TLSSocket } from 'tls';

import { isNative } from '@trezor/env-utils';

import { SocketBase } from './base';
import type { SocketListener } from './interface';

export class TlsSocket extends SocketBase {
    protected openSocket(listener: SocketListener) {
        // Socket instance is required in React Native but would imply socket nesting on web.
        const socket = new TLSSocket(isNative() ? new Socket() : (null as any));
        this.configureSocket(socket);
        this.bindSocket(socket, listener);

        return new Promise<TLSSocket>((resolve, reject) => {
            const errorHandler = (err: Error) => reject(err);
            socket.on('error', errorHandler);
            // The React Native implementation requires connect(options[, callback]) to be used.
            socket.connect({ host: this.host, port: this.port }, () => {
                socket.removeListener('error', errorHandler);
                resolve(socket);
            });
        });
    }
}
