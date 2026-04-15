import net from 'net';

import { findProcessFromIncomingPort } from '../findProcessFromIncomingPort';
import { getFreePort } from '../getFreePort';

describe('findProcessFromIncomingPort', () => {
    test('start a server on a random free port and try to detect it', async () => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const [port]: [number] = await getFreePort();

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

            switch (process.platform) {
                case 'win32':
                    expect(processInfo?.name).toEqual('Node.js');
                    break;
                case 'darwin':
                    expect(processInfo?.name).toEqual('node');
                    break;
                default:
                    expect(processInfo?.name).toEqual('MainThread');
            }
        } finally {
            server.close();
        }
    });

    test('if there is nothing running on the port, findProcessFromIncomingPort throws', async () => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const [port]: [number] = await getFreePort();
        await expect(findProcessFromIncomingPort(port)).rejects.toThrow(
            'Command failed with code 1: ',
        );
    });
});
