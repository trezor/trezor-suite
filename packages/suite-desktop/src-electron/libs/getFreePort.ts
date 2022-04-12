import net from 'net';

// TODO: this could be added to @trezor/utils but considering is only for nodejs
export const getFreePort = (): Promise<number> =>
    new Promise<number>((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, () => {
            const { port } = server.address() as net.AddressInfo;
            server.close(() => {
                resolve(port);
            });
        });
    });
