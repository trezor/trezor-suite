import net from 'net';

export const isPortUsed = (port: number) =>
    new Promise(resolve => {
        const server = net.createServer();

        server.once('error', () => {
            resolve(true);
        });

        server.once('listening', () => {
            server.close();
            resolve(false);
        });

        server.listen(port);
    });
