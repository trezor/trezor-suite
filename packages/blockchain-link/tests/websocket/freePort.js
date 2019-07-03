import net from 'net';

// using a free port instead of a constant port enables parallelization
const getFreePort = async () => {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        let port;
        server.on('listening', () => {
            port = server.address().port; // eslint-disable-line prefer-destructuring
            server.close();
        });
        server.on('close', () => resolve(port));
        server.on('error', error => reject(error));
        server.listen(0);
    });
};

export default getFreePort;
