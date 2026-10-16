import { spawn } from 'child_process';
import { promises as fs } from 'fs';

function spawnAndCollectStdout(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, { shell: true });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', data => {
            stdout += data.toString();
        });
        child.stderr.on('data', data => {
            stderr += data.toString();
        });
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
const DELETED_EXE_SUFFIX = / \(deleted\)$/;

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
): Promise<ProcessInfo | undefined> {
    const endpoints = connection && getEndpoints(port, connection);
    if (connection && !endpoints) {
        // Without both of its endpoints the connection cannot be attributed to a socket.
        return undefined;
    }

    switch (process.platform) {
        case 'darwin':
        case 'linux': {
            const command = `lsof -iTCP:${port} -n -P +c0`;
            const stdout = await spawnAndCollectStdout(command);
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
                    const fullPathCommand = `ps -p ${pid} -o comm=`;
                    const fullPathRaw = await spawnAndCollectStdout(fullPathCommand);
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
                    // with. Reading it needs ptrace-level access to the target, which a process
                    // of another user or a non-dumpable one denies; the socket still belongs to
                    // the process lsof named, only its path stays unknown.
                    const exe = await fs.readlink(`/proc/${pid}/exe`).catch(() => undefined);
                    if (exe === undefined) {
                        return { name: sanitizedName, pid, fullPath: '', warning: true };
                    }

                    // The path is the identity of the app, so a replaced binary keeps the one it
                    // was installed at.
                    const fullPath = exe.replace(DELETED_EXE_SUFFIX, '');
                    // Binaries can be all over the place on Linux, so we don't check the path

                    return { name: sanitizedName, pid, fullPath };
                }
            }

            return undefined;
        }
        case 'win32': {
            const command = `netstat -ano | findstr :${port}`;
            const stdout = await spawnAndCollectStdout(command);
            const lines = stdout.split('\n');
            const record = lines
                .map(line => {
                    const lineParts = line.trim().split(/\s+/);
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
                const appInfoCommand = `powershell -Command "(Get-Item (Get-Process -Id ${record.pid}).Path).VersionInfo | ConvertTo-Json"`;
                const appInfoStdout = await spawnAndCollectStdout(appInfoCommand);
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
