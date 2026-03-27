import { Socket as TCPSocket } from 'net';

import { SocketBase } from './base';
import type { SocketListener } from './interface';

export class TcpSocket extends SocketBase {
    protected openSocket(listener: SocketListener) {
        const socket = new TCPSocket();
        this.configureSocket(socket);
        this.bindSocket(socket, listener);

        return new Promise<TCPSocket>((resolve, reject) => {
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
