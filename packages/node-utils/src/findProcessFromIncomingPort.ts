import { spawn } from 'child_process';
import { promises as fs } from 'fs';

function spawnAndCollectStdout(
    command: string,
    args: string[],
    signal?: AbortSignal,
): Promise<string> {
    return new Promise((resolve, reject) => {
        // `signal` kills the child, so an abandoned command does not outlive its caller. The
        // command is spawned without a shell, because the signal would otherwise only reach the
        // `sh -c` (or `cmd /c`) wrapper and leave the command it started running.
        const child = spawn(command, args, { signal });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', data => {
            stdout += data.toString();
        });
        child.stderr.on('data', data => {
            stderr += data.toString();
        });
        // A failed spawn and the kill above are reported here, and an unhandled `error` throws.
        child.on('error', reject);
        child.on('close', code => {
            if (code !== 0) {
                reject(new Error(`Command failed with code ${code}: ${stderr}`));
            } else {
                resolve(stdout);
            }
        });
    });
}

export type ProcessInfo = {
    name: string;
    pid: string;
    fullPath: string;
    warning?: boolean;
};

/**
 * Server side of an accepted connection, e.g. `req.socket`.
 */
type IncomingConnection = {
    remoteAddress?: string;
    remotePort?: number;
    localAddress?: string;
    localPort?: number;
};

// IPv4 address mapped into IPv6, which lsof and netstat print in its plain IPv4 form.
const IPV4_MAPPED_IPV6 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/;

// How the kernel renders /proc/<pid>/exe of a process whose executable has been unlinked or
// replaced, as an upgrade of a running app does.
const DELETED_EXE_SUFFIX = ' (deleted)';

// Packaging formats that put a component into the exe path which does not identify the app: a
// snap's path carries the revision it was last refreshed to, a number from the store and `x1`,
// `x2`, ... for a sideloaded snap, and an AppImage runs from a mountpoint made up anew on every
// launch. The mountpoint is matched on its `.mount_<name>XXXXXX` component rather than on a
// /tmp prefix, because the AppImage runtime mounts under `$TMPDIR` and falls back to /tmp only
// when it is unset: a sandboxed or systemd-started client would otherwise have its per-launch
// path pass as an identity.
//
// A strictly confined snap is rendered as its own mount namespace sees it, under /snap on every
// distro. A classic snap runs in the host's namespace, where distros without a real /snap
// directory (Fedora, Arch) mount snaps under /var/lib/snapd/snap: the /snap symlink that classic
// snaps require there is resolved, so the kernel renders the snapd mount dir.
const SNAP_REVISION_PATH = /^((?:\/var\/lib\/snapd)?\/snap\/[^/]+)\/x?\d+\//;
const APPIMAGE_MOUNT_PATH = /(^|\/)\.mount_[^/]+\//;

// Where a flatpak runs from: /app is where its own files are mounted inside the sandbox, with
// its runtime at /usr, so the whole path is local to that namespace instead of naming a
// component of it.
const FLATPAK_APP_PREFIX = '/app/';

// A literal "... (deleted)" must refer to the running executable itself. A different file can
// exist at that path while the kernel is marking an unlinked executable.
const resolveExePath = async (exe: string, processExePath: string): Promise<string | undefined> => {
    if (!exe.endsWith(DELETED_EXE_SUFFIX)) {
        return exe;
    }

    const [processStats, literalStats] = await Promise.all([
        fs.stat(processExePath, { bigint: true }).catch(() => undefined),
        fs.stat(exe, { bigint: true }).catch((error: NodeJS.ErrnoException) =>
            // Only ENOENT establishes absence; a permission error leaves the identity unknown.
            error.code === 'ENOENT' ? null : undefined,
        ),
    ]);
    if (!processStats || literalStats === undefined) {
        return undefined;
    }

    // Unlinking a literal "... (deleted)" during the checks adds another marker. Do not strip
    // its actual filename using the stale path read before the unlink.
    if ((await fs.readlink(processExePath).catch(() => undefined)) !== exe) {
        return undefined;
    }

    const isSameFile =
        literalStats?.dev === processStats.dev && literalStats?.ino === processStats.ino;

    return isSameFile ? exe : exe.slice(0, -DELETED_EXE_SUFFIX.length);
};

// Endpoint as lsof and netstat print it, with IPv6 addresses in brackets.
const formatEndpoint = (address: string, port: number) => {
    const printedAddress = address.replace(IPV4_MAPPED_IPV6, '$1');

    return printedAddress.includes(':')
        ? `[${printedAddress}]:${port}`
        : `${printedAddress}:${port}`;
};

// Both endpoints of the connection as the keys to match against, or undefined when the socket
// does not name them.
const getEndpoints = (
    port: number,
    { remoteAddress, remotePort, localAddress, localPort }: IncomingConnection,
) =>
    remoteAddress && localAddress && localPort
        ? {
              // The connection names the client port itself, so it cannot disagree with `port`.
              client: formatEndpoint(remoteAddress, remotePort ?? port),
              server: formatEndpoint(localAddress, localPort),
          }
        : undefined;

/**
 * Finds the process holding a socket on `port`. When `connection` is given, only the socket at the
 * client end of that connection counts, so that another process using the same port number on
 * a different address is never reported instead; `port` then only selects what to ask lsof or
 * netstat about.
 */
export async function findProcessFromIncomingPort(
    port: number,
    filterSelf: boolean = false,
    connection?: IncomingConnection,
    signal?: AbortSignal,
): Promise<ProcessInfo | undefined> {
    const endpoints = connection && getEndpoints(port, connection);
    if (connection && !endpoints) {
        // Without both of its endpoints the connection cannot be attributed to a socket.
        return undefined;
    }

    switch (process.platform) {
        case 'darwin':
        case 'linux': {
            const stdout = await spawnAndCollectStdout(
                'lsof',
                [`-iTCP:${port}`, '-n', '-P', '+c0'],
                signal,
            );
            const lines = stdout.split('\n');
            const processLine = lines.find(line => {
                const columns = line.trim().split(/\s+/);
                const isTargetSocket = endpoints
                    ? // The NAME column of the client end, followed by the connection state.
                      columns[columns.length - 2] === `${endpoints.client}->${endpoints.server}`
                    : line.includes(`:${port}`);
                // Suite's own socket is the other end of the connection, so it can never match
                // the client endpoint; this unanchored test could only drop the right line.
                const isSelf = filterSelf && !endpoints && line.includes(` ${process.pid} `);

                return isTargetSocket && !isSelf;
            });
            if (processLine) {
                const parts = processLine.split(/\s+/);
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const name: string = parts[0];
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const pid: string = parts[1];
                const sanitizedName = name.replace(/\\x\d{2}/g, ' ');

                if (process.platform === 'darwin') {
                    const fullPathRaw = await spawnAndCollectStdout(
                        'ps',
                        ['-p', pid, '-o', 'comm='],
                        signal,
                    );
                    const fullPath = fullPathRaw.trim();
                    const appPathRegex = /^(\/Users\/[^/]*)?\/Applications\/([^/]*)\.app\//;
                    const appPathMatch = fullPath.match(appPathRegex);
                    if (appPathMatch) {
                        // @ts-expect-error: indexing with noUncheckedIndexedAccess
                        const appName: string = appPathMatch[2];
                        const appPathPrefix = appPathMatch[0];

                        return { name: appName, pid, fullPath: appPathPrefix };
                    } else {
                        // Binary in unusual location, show warning
                        return { name: sanitizedName, pid, fullPath, warning: true };
                    }
                } else {
                    // The executable the kernel runs, not the argv[0] the process was started
                    // with. Reading it fails when the process exited since lsof listed it, or
                    // when ptrace-level access to it is denied; the socket still belonged to the
                    // process lsof named, only its path stays unknown.
                    const processExePath = `/proc/${pid}/exe`;
                    const exe = await fs.readlink(processExePath).catch(() => undefined);
                    if (exe === undefined) {
                        return { name: sanitizedName, pid, fullPath: '', warning: true };
                    }

                    // The path is the identity of the app, so a replaced binary keeps the one it
                    // was installed at.
                    const fullPath = await resolveExePath(exe, processExePath);
                    if (fullPath === undefined) {
                        return { name: sanitizedName, pid, fullPath: '', warning: true };
                    }

                    if (APPIMAGE_MOUNT_PATH.test(fullPath)) {
                        // An AppImage runs from a mountpoint made anew on every launch. Its name
                        // does carry the basename of the .AppImage, but truncated and with six
                        // random characters appended, so it is neither a path nor reliably the
                        // name of the app; reported as it is, such a caller would be a different
                        // app every time.
                        return { name: sanitizedName, pid, fullPath: '', warning: true };
                    }

                    if (fullPath.startsWith(FLATPAK_APP_PREFIX)) {
                        // Such a path resolves to nothing on the host and carries no application
                        // id, so it is neither something the user could act on nor an identity:
                        // two flatpaks whose entry binaries share a name would be one app.
                        return { name: sanitizedName, pid, fullPath: '', warning: true };
                    }

                    // A snap's revision changes with every refresh, while `current` is the
                    // symlink snapd keeps pointing at the active one, so permissions remembered
                    // for the app survive its updates.
                    const installedPath = fullPath.replace(SNAP_REVISION_PATH, '$1/current/');
                    // Binaries can be all over the place on Linux, so we don't check the path

                    // A client started by an interpreter reports the interpreter, so the path
                    // identifies the runtime and not the app: every Node-based client shares the
                    // path of node. The origin it connects from is then the only thing left to
                    // tell two of them apart, and for MCP not even that, because its origin is
                    // one constant for every caller; see `isSameConnectApp`, which compares the
                    // source type, the origin and this path, and never the declared manifest.
                    return { name: sanitizedName, pid, fullPath: installedPath };
                }
            }

            return undefined;
        }
        case 'win32': {
            // All connections, filtered by the matcher below: piping netstat into findstr would
            // need a shell, and the signal would not reach either half of the pipeline.
            const stdout = await spawnAndCollectStdout('netstat', ['-ano'], signal);
            const lines = stdout.split('\n');
            const record = lines
                .map(line => line.trim().split(/\s+/))
                // Drop the blank and header lines netstat prints above the table: a connection
                // row has at least a protocol, both addresses and a pid.
                .filter(lineParts => lineParts.length >= 4)
                .map(lineParts => {
                    // @ts-expect-error: indexing with noUncheckedIndexedAccess
                    const pid: string = lineParts[lineParts.length - 1];
                    // @ts-expect-error: indexing with noUncheckedIndexedAccess
                    const local: string = lineParts[1];
                    // @ts-expect-error: indexing with noUncheckedIndexedAccess
                    const foreign: string = lineParts[2];

                    return { pid, local, foreign };
                })
                .find(({ local, foreign }) =>
                    endpoints
                        ? local === endpoints.client && foreign === endpoints.server
                        : local.endsWith(`:${port}`),
                );
            if (record) {
                // Extract the app name from the full path on Windows
                // Do not load the user profile. A slow profile delays the connect-ws handshake past the client timeout.
                const appInfoStdout = await spawnAndCollectStdout(
                    'powershell',
                    [
                        '-NoProfile',
                        '-NonInteractive',
                        '-Command',
                        `(Get-Item (Get-Process -Id ${record.pid}).Path).VersionInfo | ConvertTo-Json`,
                    ],
                    signal,
                );
                const appInfo = JSON.parse(appInfoStdout);
                const fullPath = appInfo['FileName'];
                const appName = appInfo['ProductName'];
                const appPathRegex =
                    /^(?:[A-Z]:\\(?:Program Files(?: \(x86\))?|Windows(?:\\(?:System32|SysWOW64))?|Users\\[^\\]+\\AppData\\(?:Local(?:\\Programs)?|Roaming))\\[^:*?"<>|\r\n]+\.exe)$/;
                const appPathMatch = fullPath.match(appPathRegex);
                if (appPathMatch) {
                    return { name: appName, pid: record.pid, fullPath };
                } else {
                    // Binary in unusual location, show warning
                    return { name: appName, pid: record.pid, fullPath, warning: true };
                }
            }

            return undefined;
        }
    }
}
