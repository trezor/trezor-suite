import net from 'net';

export const getFreePort = async (count = 1): Promise<number> => {
    const servers = Array.from({ length: count }, () => net.createServer());

    const ports = await Promise.all(
        servers.map(server => {
            return new Promise<number>((resolve, reject) => {
                server.unref();
                server.on('error', reject);
                server.listen(0, () => {
                    const { port } = server.address() as net.AddressInfo;
                    resolve(port);
                });
            });
        }),
    );

    await Promise.all(
        servers.map(server => {
            return server.close();
        }),
    );

    return ports[0];
};
