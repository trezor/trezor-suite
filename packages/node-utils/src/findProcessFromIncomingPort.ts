import { spawn } from 'child_process';

/**
 * Runs a command WITHOUT a shell, passing arguments as a discrete array.
 *
 * Using `shell: false` (the default) is a deliberate security choice: several of the
 * values interpolated below (the port, and especially the `pid`/process name parsed out
 * of `lsof`/`netstat` output) are not fully trusted. A local process can name itself with
 * spaces and shell metacharacters, which would shift the whitespace-split columns and push
 * a fragment like `$(...)` into the `pid` token. Under `shell: true` that fragment would be
 * interpreted by the shell (command injection); passing args as an array avoids the shell
 * entirely so each argument reaches the target binary verbatim.
 */
function spawnAndCollectStdout(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { shell: false });
        let stdout = '';
        let stderr = '';
        child.on('error', reject);
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

// A pid parsed from OS command output must be a plain decimal integer. Anything else means the
// output line was malformed (e.g. a process whose COMMAND name contains spaces shifted the
// columns) and must never be interpolated into a follow-up command.
const isNumericId = (value: string) => /^\d+$/.test(value);

export async function findProcessFromIncomingPort(
    port: number,
    filterSelf: boolean = false,
): Promise<ProcessInfo | undefined> {
    // Defense in depth: the callers pass a numeric TCP port, but guard against a non-integer /
    // out-of-range value ever reaching a spawned command argument.
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        return undefined;
    }

    switch (process.platform) {
        case 'darwin':
        case 'linux': {
            const stdout = await spawnAndCollectStdout('lsof', [
                `-iTCP:${port}`,
                '-n',
                '-P',
                '+c0',
            ]);
            const lines = stdout.split('\n');
            const processLine = lines.find(
                line =>
                    line.includes(`:${port}`) && // Filter for the target port
                    (!filterSelf || !line.includes(` ${process.pid} `)), // Filter out self
            );
            if (processLine) {
                const parts = processLine.split(/\s+/);
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const name: string = parts[0];
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const pid: string = parts[1];
                const sanitizedName = name.replace(/\\x\d{2}/g, ' ');

                // A non-numeric pid means the line was malformed/tampered with; bail out rather
                // than feeding it into the follow-up lookup command.
                if (!isNumericId(pid)) {
                    return undefined;
                }

                if (process.platform === 'darwin') {
                    const fullPathRaw = await spawnAndCollectStdout('ps', [
                        '-p',
                        pid,
                        '-o',
                        'comm=',
                    ]);
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
                    const fullPathRaw = await spawnAndCollectStdout('cat', [
                        `/proc/${pid}/cmdline`,
                    ]);
                    const fullPath = fullPathRaw.split('\0')[0] ?? '';
                    const trimmedFullPath = fullPath.trim();
                    // Binaries can be all over the place on Linux, so we don't check the path

                    return { name: sanitizedName, pid, fullPath: trimmedFullPath };
                }
            }

            return undefined;
        }
        case 'win32': {
            // `netstat -ano` is filtered in JS below instead of piping through `findstr`, which
            // also removes the need for a shell.
            const stdout = await spawnAndCollectStdout('netstat', ['-ano']);
            const lines = stdout.split('\n');
            const record = lines
                .map(line => {
                    const lineParts = line.trim().split(/\s+/);
                    // @ts-expect-error: indexing with noUncheckedIndexedAccess
                    const pid: string = lineParts[lineParts.length - 1];
                    // @ts-expect-error: indexing with noUncheckedIndexedAccess
                    const local: string = lineParts[1];

                    return { pid, local };
                })
                .find(({ local, pid }) => local?.endsWith(`:${port}`) && isNumericId(pid));
            if (record) {
                // Extract the app name from the full path on Windows
                const appInfoStdout = await spawnAndCollectStdout('powershell', [
                    '-Command',
                    `(Get-Item (Get-Process -Id ${record.pid}).Path).VersionInfo | ConvertTo-Json`,
                ]);
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
