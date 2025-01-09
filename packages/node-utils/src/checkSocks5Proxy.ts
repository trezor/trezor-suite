import net from 'net';

export const checkSocks5Proxy = (host: string, port: number): Promise<boolean> =>
    new Promise((resolve, reject) => {
        const socket = new net.Socket();

        socket.setTimeout(2_000);

        socket.on('connect', () => {
            // Version 5, 1 method, no authentication
            const handshakeRequest = Buffer.from([0x05, 0x01, 0x00]);
            socket.write(handshakeRequest);
        });

        socket.on('data', data => {
            if (data[0] === 0x05 && data[1] === 0x00) {
                resolve(true);
            } else {
                resolve(false);
            }
            socket.destroy();
        });

        socket.on('error', err => {
            reject(err);
        });

        socket.on('timeout', () => {
            socket.destroy();
            reject(new Error('Connection timed out'));
        });

        socket.connect(port, host);
    });
