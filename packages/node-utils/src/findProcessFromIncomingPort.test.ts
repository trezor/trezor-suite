import childProcess, { type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { promises as fs, statSync } from 'fs';
import net from 'net';

import {
    MAX_CONCURRENT_PROCESS_LOOKUPS,
    PROCESS_LOOKUP_SAFETY_TIMEOUT_MS,
    findProcessFromIncomingPort,
} from './findProcessFromIncomingPort';
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
    }, 30_000);

    test('if there is nothing running on the port, findProcessFromIncomingPort reports no process', async () => {
        const ports = await getFreePort();
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const [port]: [number] = ports;
        if (process.platform === 'win32') {
            // netstat lists every connection and exits 0, so an absent port is simply no match.
            await expect(findProcessFromIncomingPort(port)).resolves.toBeUndefined();
        } else {
            // lsof exits 1 when it matches nothing.
            await expect(findProcessFromIncomingPort(port)).rejects.toThrow(
                'Command failed with code 1: ',
            );
        }
    });

    test('rejects when the caller aborts the lookup', async () => {
        const ports = await getFreePort();
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const [port]: [number] = ports;
        const controller = new AbortController();

        // The lookup takes its slot before it spawns, so this abort comes first and no command is
        // spawned for it.
        const spawn = jest.spyOn(childProcess, 'spawn');
        const lookup = findProcessFromIncomingPort(port, false, undefined, controller.signal);
        controller.abort();

        await expect(lookup).rejects.toMatchObject({ name: 'AbortError' });
        expect(spawn).not.toHaveBeenCalled();
        spawn.mockRestore();
    });
});

describe('findProcessFromIncomingPort for an accepted connection', () => {
    const realPlatform = process.platform;
    // The server side of a connection from 127.0.0.1:40000 to 127.0.0.1:21335.
    const connection = { remoteAddress: '127.0.0.1', localAddress: '127.0.0.1', localPort: 21335 };

    // Answers each spawned command with the output of the first matching prefix.
    const mockCommands = (outputs: [string, string][]) =>
        jest.spyOn(childProcess, 'spawn').mockImplementation((...args: unknown[]) => {
            const command = args
                .flat()
                .filter(arg => typeof arg === 'string')
                .join(' ');
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
        // The exe is the resolved binary, so the path carries the version the install puts there:
        // the minor one for a distro Python, whose `python3` is a symlink, the full one for nvm.
        // A change of that version asks such a client again.
        jest.spyOn(fs, 'readlink').mockResolvedValue('/usr/bin/python3.11');

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        // Every script the interpreter runs shares this path, so permissions remembered for one
        // script client cover the next one on the same origin; only the origin tells them apart.
        expect(processInfo?.fullPath).toBe('/usr/bin/python3.11');
    });

    test.each(['/usr/bin/client', '/usr/bin/client (deleted)'])(
        'keeps the installed path %s when a Linux executable is replaced',
        async installedPath => {
            setPlatform('linux');
            mockCommands([
                [
                    'lsof',
                    'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
                ],
            ]);
            jest.spyOn(fs, 'readlink').mockResolvedValue(`${installedPath} (deleted)`);
            jest.spyOn(fs, 'stat').mockImplementation(path =>
                path === '/proc/300/exe'
                    ? Promise.resolve(statSync(__filename, { bigint: true }))
                    : Promise.reject(
                          Object.assign(new Error('File not found'), { code: 'ENOENT' }),
                      ),
            );

            const processInfo = await findProcessFromIncomingPort(40000, true, connection);

            expect(processInfo?.fullPath).toBe(installedPath);
        },
    );

    test('keeps the path of a Linux executable whose own name ends in the deleted marker', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
            ],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/usr/bin/client (deleted)');
        jest.spyOn(fs, 'stat').mockResolvedValue(statSync(__filename, { bigint: true }));

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        // Both paths identify the same file, so stripping its literal suffix would hand this
        // binary whatever is remembered for /usr/bin/client.
        expect(processInfo?.fullPath).toBe('/usr/bin/client (deleted)');
    });

    test.each([
        ['inode', { dev: 1n, ino: 9007199254740993n }],
        ['device', { dev: 2n, ino: 9007199254740992n }],
    ])(
        'does not identify a deleted executable as another file with a different %s',
        async (_, identity) => {
            setPlatform('linux');
            mockCommands([
                [
                    'lsof',
                    'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
                ],
            ]);
            jest.spyOn(fs, 'readlink').mockResolvedValue('/usr/bin/client (deleted)');
            const processStats = Object.assign(statSync(__filename, { bigint: true }), {
                dev: 1n,
                ino: 9007199254740992n,
            });
            const otherStats = Object.assign(statSync(__filename, { bigint: true }), identity);
            jest.spyOn(fs, 'stat').mockImplementation(path =>
                Promise.resolve(path === '/proc/300/exe' ? processStats : otherStats),
            );

            const processInfo = await findProcessFromIncomingPort(40000, true, connection);

            expect(processInfo?.fullPath).toBe('/usr/bin/client');
        },
    );

    test.each([
        ['/proc/300/exe', 'ENOENT'],
        ['/proc/300/exe', 'EACCES'],
        ['/usr/bin/client (deleted)', 'EACCES'],
    ])('reports no path when stat of %s fails with %s', async (failedPath, code) => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
            ],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/usr/bin/client (deleted)');
        jest.spyOn(fs, 'stat').mockImplementation(path =>
            path === failedPath
                ? Promise.reject(Object.assign(new Error('Cannot stat executable'), { code }))
                : Promise.resolve(statSync(__filename, { bigint: true })),
        );

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        expect(processInfo).toEqual({ name: 'client', pid: '300', fullPath: '', warning: true });
    });

    test('reports no path when the executable is unlinked while its literal suffix is being checked', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
            ],
        ]);
        jest.spyOn(fs, 'readlink')
            .mockResolvedValueOnce('/usr/bin/client (deleted)')
            .mockResolvedValue('/usr/bin/client (deleted) (deleted)');
        jest.spyOn(fs, 'stat').mockImplementation(path =>
            path === '/proc/300/exe'
                ? Promise.resolve(statSync(__filename, { bigint: true }))
                : Promise.reject(Object.assign(new Error('File not found'), { code: 'ENOENT' })),
        );

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        expect(processInfo).toEqual({ name: 'client', pid: '300', fullPath: '', warning: true });
    });

    // A snap installed from the store is revisioned by a number, a sideloaded one by `x1`, `x2`.
    test.each(['142', 'x1'])(
        'identifies a snap-packaged Linux process at revision %s by the path its revisions share',
        async revision => {
            setPlatform('linux');
            mockCommands([
                [
                    'lsof',
                    'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
                ],
            ]);
            jest.spyOn(fs, 'readlink').mockResolvedValue(`/snap/client/${revision}/usr/bin/client`);

            const processInfo = await findProcessFromIncomingPort(40000, true, connection);

            // The revision in the path changes with every refresh of the snap, so permissions
            // remembered for the app would not survive its updates.
            expect(processInfo?.fullPath).toBe('/snap/client/current/usr/bin/client');
        },
    );

    // Distros without a real /snap directory mount snaps under /var/lib/snapd/snap, where a
    // classic snap, which runs in the host's mount namespace, is rendered.
    test('identifies a classic snap under the snapd mount dir by the path its revisions share', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
            ],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue(
            '/var/lib/snapd/snap/client/142/usr/bin/client',
        );

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        expect(processInfo?.fullPath).toBe('/var/lib/snapd/snap/client/current/usr/bin/client');
    });

    // The AppImage runtime mounts under `$TMPDIR`, falling back to /tmp when it is unset.
    test.each(['/tmp', '/run/user/1000'])(
        'reports no path for an AppImage Linux process, which runs from a new mountpoint under %s on every launch',
        async tmpDir => {
            setPlatform('linux');
            mockCommands([
                [
                    'lsof',
                    'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
                ],
            ]);
            jest.spyOn(fs, 'readlink').mockResolvedValue(
                `${tmpDir}/.mount_clientAbC123/usr/bin/client`,
            );

            const processInfo = await findProcessFromIncomingPort(40000, true, connection);

            // The mountpoint identifies nothing, so the caller counts as unidentified instead of
            // as a different app on every start.
            expect(processInfo).toEqual({
                name: 'client',
                pid: '300',
                fullPath: '',
                warning: true,
            });
        },
    );

    test('reports no path for a flatpak Linux process, which runs from a path only its own sandbox has', async () => {
        setPlatform('linux');
        mockCommands([
            [
                'lsof',
                'client 300 user 18u IPv4 207199 0t0 TCP 127.0.0.1:40000->127.0.0.1:21335 (ESTABLISHED)',
            ],
        ]);
        jest.spyOn(fs, 'readlink').mockResolvedValue('/app/bin/client');

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        // /app is where the flatpak's own files are mounted, so the path names nothing on the
        // host and every flatpak with a client of this name would be the same app.
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

    // The preamble `netstat -ano` prints above the table, and the trailing newline of its output.
    const netstatOutput = [
        '',
        'Active Connections',
        '',
        '  Proto  Local Address          Foreign Address        State           PID',
        '  TCP    0.0.0.0:40000      0.0.0.0:0          LISTENING       100',
        '  TCP    127.0.0.1:21335    127.0.0.1:40000    ESTABLISHED     200',
        '  TCP    127.0.0.1:40000    127.0.0.1:21335    ESTABLISHED     300',
        '',
    ].join('\n');

    test('attributes the connection to the process at its client end on Windows', async () => {
        setPlatform('win32');
        mockCommands([
            ['netstat', netstatOutput],
            ['powershell', JSON.stringify({ FileName: 'C:\\client.exe', ProductName: 'Client' })],
        ]);

        const processInfo = await findProcessFromIncomingPort(40000, true, connection);

        expect(processInfo?.pid).toBe('300');
    });

    test('reports no process for a port nothing is bound to on Windows', async () => {
        setPlatform('win32');
        mockCommands([['netstat', netstatOutput]]);

        await expect(findProcessFromIncomingPort(40001)).resolves.toBeUndefined();
    });

    describe('under load', () => {
        const flushPendingPromises = () => new Promise(resolve => setImmediate(resolve));

        // Every command stays running until the test finishes it, and dies when its `signal`
        // aborts, as a real child process does.
        const holdCommands = () => {
            const commands: { signal?: AbortSignal; finish: () => void }[] = [];
            jest.spyOn(childProcess, 'spawn').mockImplementation((...args: unknown[]) => {
                const { signal } = (args[2] ?? {}) as { signal?: AbortSignal };
                const child = Object.assign(new EventEmitter(), {
                    stdout: new EventEmitter(),
                    stderr: new EventEmitter(),
                });
                signal?.addEventListener(
                    'abort',
                    () =>
                        child.emit(
                            'error',
                            Object.assign(new Error('The operation was aborted'), {
                                name: 'AbortError',
                            }),
                        ),
                    { once: true },
                );
                commands.push({ signal, finish: () => child.emit('close', 0) });

                return child as unknown as ChildProcess;
            });

            return commands;
        };

        const startLookups = (count: number, signal?: AbortSignal) =>
            Array.from({ length: count }, (_, index) =>
                findProcessFromIncomingPort(40000 + index, false, undefined, signal),
            );

        beforeEach(() => {
            setPlatform('linux');
        });

        test('runs only so many lookups at once, and starts the next as one finishes', async () => {
            const commands = holdCommands();
            const lookups = startLookups(MAX_CONCURRENT_PROCESS_LOOKUPS + 1);
            await flushPendingPromises();

            expect(commands).toHaveLength(MAX_CONCURRENT_PROCESS_LOOKUPS);

            commands[0]?.finish();
            await flushPendingPromises();

            expect(commands).toHaveLength(MAX_CONCURRENT_PROCESS_LOOKUPS + 1);

            commands.forEach(command => command.finish());
            await expect(Promise.all(lookups)).resolves.toEqual(lookups.map(() => undefined));
        });

        test('never spawns for a lookup whose signal aborts while it waits', async () => {
            const commands = holdCommands();
            const running = startLookups(MAX_CONCURRENT_PROCESS_LOOKUPS);
            const controller = new AbortController();
            const [waiting] = startLookups(1, controller.signal);
            await flushPendingPromises();

            controller.abort();

            await expect(waiting).rejects.toMatchObject({ name: 'AbortError' });

            // The slot that frees up has no one waiting for it.
            commands.forEach(command => command.finish());
            await Promise.all(running);
            await flushPendingPromises();

            expect(commands).toHaveLength(MAX_CONCURRENT_PROCESS_LOOKUPS);
        });

        test('kills the command of a running lookup when its signal aborts, and frees the slot', async () => {
            const commands = holdCommands();
            const controller = new AbortController();
            const [aborted] = startLookups(1, controller.signal);
            const others = startLookups(MAX_CONCURRENT_PROCESS_LOOKUPS);
            await flushPendingPromises();

            expect(commands).toHaveLength(MAX_CONCURRENT_PROCESS_LOOKUPS);
            expect(commands[0]?.signal?.aborted).toBe(false);

            controller.abort();

            await expect(aborted).rejects.toMatchObject({ name: 'AbortError' });
            expect(commands[0]?.signal?.aborted).toBe(true);

            // The lookup that waited takes the slot of the killed one.
            await flushPendingPromises();

            expect(commands).toHaveLength(MAX_CONCURRENT_PROCESS_LOOKUPS + 1);

            commands.forEach(command => command.finish());
            await Promise.all(others);
        });

        describe('safety timeout', () => {
            // Every lookup gets a timeout signal of its own, which a test aborts to let it expire.
            const holdTimeouts = () => {
                const timeouts: AbortController[] = [];
                const timeoutSpy = jest.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
                    const timeout = new AbortController();
                    timeouts.push(timeout);

                    return timeout.signal;
                });

                return { timeouts, timeoutSpy };
            };

            const expire = (timeout?: AbortController) =>
                timeout?.abort(new DOMException('The operation timed out', 'TimeoutError'));

            test('kills a command that never exits for a caller without a signal, and frees its slot', async () => {
                const commands = holdCommands();
                const { timeouts, timeoutSpy } = holdTimeouts();
                const hung = startLookups(MAX_CONCURRENT_PROCESS_LOOKUPS).map(lookup =>
                    expect(lookup).rejects.toMatchObject({ name: 'AbortError' }),
                );
                await flushPendingPromises();

                expect(timeoutSpy).toHaveBeenCalledWith(PROCESS_LOOKUP_SAFETY_TIMEOUT_MS);
                expect(commands).toHaveLength(MAX_CONCURRENT_PROCESS_LOOKUPS);

                timeouts.forEach(timeout => expire(timeout));
                await Promise.all(hung);

                expect(commands.every(command => command.signal?.aborted)).toBe(true);

                // Both slots are free again.
                const [next] = startLookups(1);
                await flushPendingPromises();

                expect(commands).toHaveLength(MAX_CONCURRENT_PROCESS_LOOKUPS + 1);

                commands[MAX_CONCURRENT_PROCESS_LOOKUPS]?.finish();
                await expect(next).resolves.toBeUndefined();
            });

            test('rejects a lookup that still waits for its turn when its timeout passes', async () => {
                const commands = holdCommands();
                const { timeouts } = holdTimeouts();
                const running = startLookups(MAX_CONCURRENT_PROCESS_LOOKUPS);
                const [waiting] = startLookups(1);
                await flushPendingPromises();

                expire(timeouts[MAX_CONCURRENT_PROCESS_LOOKUPS]);

                await expect(waiting).rejects.toMatchObject({ name: 'TimeoutError' });

                // The running lookups are not affected, and the one that gave up never spawns.
                commands.forEach(command => command.finish());
                await Promise.all(running);
                await flushPendingPromises();

                expect(commands).toHaveLength(MAX_CONCURRENT_PROCESS_LOOKUPS);
            });
        });
    });
});
