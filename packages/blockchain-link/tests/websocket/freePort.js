import net from 'net';

// using a free port instead of a constant port enables parallelization
const getFreePort = async () => {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, () => {
            const { port } = server.address();
            server.close(() => {
                resolve(port);
            });
        });
    });
};

export default getFreePort;
