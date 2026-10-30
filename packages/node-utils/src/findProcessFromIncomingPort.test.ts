import childProcess, { type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { type Stats, promises as fs } from 'fs';
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

describe('findProcessFromIncomingPort for an accepted connection', () => {
    const realPlatform = process.platform;
    // The server side of a connection from 127.0.0.1:40000 to 127.0.0.1:21335.
    const connection = { remoteAddress: '127.0.0.1', localAddress: '127.0.0.1', localPort: 21335 };

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
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/usr/bin/client');

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        expect(processInfo?.pid).toBe('300');
    });

    test('identifies a Linux process by its executable, not by the argv[0] it was started with', async () => {
        setPlatform('linux');
        const spawn = mockCommands([
            [
                'lsof',
                'node 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
            ],
            // Answered so that an implementation reading argv[0] reports a different path
            // instead of failing to spawn at all.
            ['cat /proc/300/cmdline', '/usr/bin/google-chrome\0script.js\0'],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/usr/local/bin/node');

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        expect(processInfo?.fullPath).toBe('/usr/local/bin/node');
        // Only lsof is asked, so argv[0] is never consulted.
        expect(spawn).toHaveBeenCalledTimes(1);
    });

    test('reports the interpreter of a script client, which identifies the runtime not the app', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                'python3 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
            ],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/usr/bin/python3');

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        // Every script the interpreter runs shares this path, so permissions remembered for one
        // script client cover the next one on the same origin; only the origin tells them apart.
        expect(processInfo?.fullPath).toBe('/usr/bin/python3');
    });

    test('identifies a Linux process whose executable was replaced by the path it was installed at', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
            ],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/usr/bin/client (deleted)');
        // Nothing is at the path the kernel printed, which is what the marker means.
        jest.spyOn(fs, 'stat').mockRejectedValue(
            new Error("ENOENT: no such file or directory, stat '/usr/bin/client (deleted)'"),
        );

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        expect(processInfo?.fullPath).toBe('/usr/bin/client');
    });

    test('keeps the path of a Linux executable whose own name ends in the deleted marker', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
            ],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/usr/bin/client (deleted)');
        jest.spyOn(fs, 'stat').mockResolvedValue({} as Stats);

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        // The file exists at the path as printed, so the suffix is part of its name; stripping
        // it would hand this binary whatever is remembered for /usr/bin/client.
        expect(processInfo?.fullPath).toBe('/usr/bin/client (deleted)');
    });

    test('identifies a snap-packaged Linux process by the path its revisions share', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
            ],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/snap/client/142/usr/bin/client');

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        // The revision in the path changes with every refresh of the snap, so permissions
        // remembered for the app would not survive its updates.
        expect(processInfo?.fullPath).toBe('/snap/client/current/usr/bin/client');
    });

    test('reports no path for an AppImage Linux process, which runs from a new mountpoint on every launch', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
            ],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/tmp/.mount_clientAbC123/usr/bin/client');

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        // The mountpoint identifies nothing, so the caller counts as unidentified instead of as
        // a different app on every start.
        expect(processInfo).toEqual({
            name: 'client',
            pid: '300',
            fullPath: '',
            warning: true,
        });
    });

    test('keeps the Linux process lsof named when its executable cannot be read', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
            ],
        ]);
        jest.spyOn(fs, 'readlink').mockRejectedValue(
            new Error("EACCES: permission denied, readlink '/proc/300/exe'"),
        );

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        expect(processInfo).toEqual({
            name: 'client',
            pid: '300',
            fullPath: '',
            warning: true,
        });
    });

    test('matches an IPv4-mapped IPv6 address as the plain IPv4 form lsof prints', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                [
                    'COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME',
                    'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
                ].join('\n'),
            ],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/usr/bin/client');

        const processInfo = await findProcessFromIncomingPort(40000, true, {
            remoteAddress: '::ffff:127.0.0.1',
            localAddress: '::ffff:127.0.0.1',
            localPort: 21335,
        });

        expect(processInfo?.pid).toBe('300');
    });

    test('matches a connection over IPv6 loopback', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                [
                    'COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME',
                    'client 300 user 18u IPv6 207199 0t0 TCP [::1]:40000->[::1]:21335 (ESTABLISHED)',
                ].join('\n'),
            ],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/usr/bin/client');

        const processInfo = await findProcessFromIncomingPort(40000, true, {
            remoteAddress: '::1',
            localAddress: '::1',
            localPort: 21335,
        });

        expect(processInfo?.pid).toBe('300');
    });

    test('reports no process when no socket is at the client end of the connection', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                [
                    'COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME',
                    // Only Suite's own end of the connection is visible.
                    `suite ${process.pid} user 18u IPv4 207199 0t0 TCP 127.0.0.1:21335->127.0.0.1:40000 (ESTABLISHED)`,
                ].join('\n'),
            ],
        ]);

        await expect(findProcessFromIncomingPort(40000, true, connection)).resolves.toBeUndefined();
    });

    test('reports no process for a socket that does not name both endpoints', async () => {
        setPlatform('linux');
        const spawn = mockCommands([]);

        await expect(
            findProcessFromIncomingPort(40000, true, { localAddress: '127.0.0.1' }),
        ).resolves.toBeUndefined();
        expect(spawn).not.toHaveBeenCalled();
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
