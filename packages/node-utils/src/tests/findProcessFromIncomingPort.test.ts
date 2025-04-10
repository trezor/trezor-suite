import net from 'net';

import { findProcessFromIncomingPort } from '../findProcessFromIncomingPort';
import { getFreePort } from '../getFreePort';

describe('findProcessFromIncomingPort', () => {
    test('start a server on a random free port and try to detect it', async () => {
        const port = await getFreePort();

        const server = net.createServer().listen(port);
        try {
            // wait for listening
            await new Promise(resolve => {
                server.on('listening', () => {
                    resolve(undefined);
                });
            });

            const processInfo = await findProcessFromIncomingPort(port);
            expect(processInfo).toBeDefined();

            if (process.platform === 'win32') {
                expect(processInfo?.name).toEqual('node.exe');
            } else {
                expect(processInfo?.name).toEqual('node');
            }
        } finally {
            server.close();
        }
    });

    test('if there is nothing running on the port, findProcessFromIncomingPort throws', async () => {
        const port = await getFreePort();
        await expect(findProcessFromIncomingPort(port)).rejects.toThrow(
            'Command failed with code 1: ',
        );
    });
});
