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

// Bool 2 Text
export const b2t = (bool: boolean) => (bool ? 'Yes' : 'No');
