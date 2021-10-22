import { TLSSocket } from 'tls';
import { SocketBase } from './base';
import type { SocketListener } from './interface';

export class TlsSocket extends SocketBase {
    protected openSocket(listener: SocketListener) {
        const socket = new TLSSocket(null as any /* TODO omg why? */);
        this.configureSocket(socket);
        this.bindSocket(socket, listener);
        return new Promise<TLSSocket>((resolve, reject) => {
            const errorHandler = (err: Error) => reject(err);
            socket.on('error', errorHandler);
            socket.connect(this.port, this.host, () => {
                socket.removeListener('error', errorHandler);
                resolve(socket);
            });
        });
    }
}
