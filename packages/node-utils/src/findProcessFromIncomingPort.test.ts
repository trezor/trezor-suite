import childProcess, { type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
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

    test('finds the process at the client end of an accepted connection', async () => {
        const ports = await getFreePort();
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const [port]: [number] = ports;

        const server = net.createServer().listen(port, '127.0.0.1');
        const accepted = new Promise<net.Socket>(resolve => server.once('connection', resolve));
        const client = net.connect(port, '127.0.0.1');
        try {
            const socket = await accepted;
            const processInfo = await findProcessFromIncomingPort(
                socket.remotePort ?? 0,
                false,
                socket,
            );

            expect(processInfo?.pid).toEqual(String(process.pid));
        } finally {
            client.destroy();
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

describe('findProcessFromIncomingPort for an accepted connection', () => {
    const realPlatform = process.platform;
    // The server side of a connection from 127.0.0.1:40000 to 127.0.0.1:21335.
    const connection = { remoteAddress: '127.0.0.1', localAddress: '127.0.0.1', localPort: 21335 };
    const lsofLine = (command: string, pid: number, name: string) =>
        `${command} ${pid} user 18u IPv4 207199 0t0 TCP ${name}`;

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

    test('attributes the connection to the process at its client end, not to another process using the same port number', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                [
                    'COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME',
                    lsofLine('other-tool', 100, '127.0.0.2:40000 (LISTEN)'),
                    lsofLine(
                        'trezor-suite',
                        process.pid,
                        '127.0.0.1:21335->127.0.0.1:40000 (ESTABLISHED)',
                    ),
                    lsofLine('client', 300, '127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)'),
                ].join('\n'),
            ],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/usr/bin/client');

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        expect(processInfo?.pid).toBe('300');
    });

    test('identifies a Linux process by its executable, not by the argv[0] it was started with', async () => {
        setPlatform('linux');
        mockCommands([
            ['lsof', lsofLine('node', 300, '127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)')],
            ['cat /proc/300/cmdline', '/usr/bin/google-chrome\0script.js\0'],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/usr/local/bin/node');

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        expect(processInfo?.fullPath).toBe('/usr/local/bin/node');
    });

    test('attributes the connection to the process at its client end on Windows', async () => {
        setPlatform('win32');
        mockCommands([
            [
                'netstat',
                [
                    '  TCP    0.0.0.0:40000      0.0.0.0:0          LISTENING       100',
                    '  TCP    127.0.0.1:21335    127.0.0.1:40000    ESTABLISHED     200',
                    '  TCP    127.0.0.1:40000    127.0.0.1:21335    ESTABLISHED     300',
                ].join('\n'),
            ],
            ['powershell', JSON.stringify({ FileName: 'C:\\client.exe', ProductName: 'Client' })],
        ]);

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        expect(processInfo?.pid).toBe('300');
    });
});
