import childProcess, { type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import net from 'net';

import { findProcessFromIncomingPort } from './findProcessFromIncomingPort';
import { getFreePort } from './getFreePort';

describe('findProcessFromIncomingPort', () => {
    test('start a server on a random free port and try to detect it', async () => {
        const ports = await getFreePort();
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const [port]: [number] = ports;

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
        const ports = await getFreePort();
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const [port]: [number] = ports;
        await expect(findProcessFromIncomingPort(port)).rejects.toThrow(
            'Command failed with code 1: ',
        );
    });
});

describe('findProcessFromIncomingPort by port number alone', () => {
    const realPlatform = process.platform;

    // Answers each spawned command with the output of the first matching prefix.
    const mockCommands = (outputs: [string, string][]) =>
        jest.spyOn(childProcess, 'spawn').mockImplementation((...args: unknown[]) => {
            const command = args.filter(arg => typeof arg === 'string').join(' ');
            const child = Object.assign(new EventEmitter(), {
                stdout: new EventEmitter(),
                stderr: new EventEmitter(),
            });
            setImmediate(() => {
                const output = outputs.find(([prefix]) => command.startsWith(prefix))?.[1];
                child.stdout.emit('data', Buffer.from(output ?? ''));
                child.emit('close', output === undefined ? 1 : 0);
            });

            return child as unknown as ChildProcess;
        });

    const setPlatform = (platform: NodeJS.Platform) =>
        Object.defineProperty(process, 'platform', { value: platform });

    afterEach(() => {
        setPlatform(realPlatform);
        jest.restoreAllMocks();
    });

    test('attributes the connection to the first socket using its port number, not to its client end', async () => {
        setPlatform('linux');
        const lsofLine = (command: string, pid: number, name: string) =>
            `${command} ${pid} user 18u IPv4 207199 0t0 TCP ${name}`;
        mockCommands([
            [
                'lsof',
                [
                    'COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME',
                    lsofLine('other-tool', 100, '127.0.0.2:40000 (LISTEN)'),
                    lsofLine(
                        'suite',
                        process.pid,
                        '127.0.0.1:21335->127.0.0.1:40000 (ESTABLISHED)',
                    ),
                    lsofLine('client', 300, '127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)'),
                ].join('\n'),
            ],
            ['cat /proc/', '/usr/bin/client\0'],
        ]);

        const processInfo = await findProcessFromIncomingPort(40000, true);

        // `other-tool` merely listens on another address of the same port number, while the
        // client of the connection to 127.0.0.1:21335 is pid 300.
        expect(processInfo?.pid).toBe('100');
    });
});
