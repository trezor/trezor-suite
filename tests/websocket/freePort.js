/* @flow */

import net from 'net';

// using a free port instead of a constant port enables parallelization
const getFreePort = async (): Promise<number> => {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        let port;
        server.on('listening', function() {
            port = server.address().port;
            server.close();
        });
        server.on('close', function() {
            resolve(port);
        });
        server.on('error', function(error) {
            reject(error);
        });
        server.listen(0);
    });
}

export default getFreePort;