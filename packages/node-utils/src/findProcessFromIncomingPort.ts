import { spawn } from 'child_process';

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

export async function findProcessFromIncomingPort(
    port: number,
    filterSelf: boolean = false,
): Promise<ProcessInfo | undefined> {
    switch (process.platform) {
        case 'darwin':
        case 'linux': {
            const command = `lsof -iTCP:${port} -n -P +c0`;
            const stdout = await spawnAndCollectStdout(command);
            const lines = stdout.split('\n');
            const processLine = lines.find(
                line =>
                    line.includes(`:${port}`) && // Filter for the target port
                    (!filterSelf || !line.includes(` ${process.pid} `)), // Filter out self
            );
            if (processLine) {
                const name = processLine.split(/\s+/)[0].replace(/\\x\d{2}/g, ' ');
                const pid = processLine.split(/\s+/)[1];

                if (process.platform === 'darwin') {
                    const fullPathCommand = `ps -p ${pid} -o comm=`;
                    const fullPathRaw = await spawnAndCollectStdout(fullPathCommand);
                    const fullPath = fullPathRaw.trim();
                    const appPathRegex = /^(\/Users\/[^/]*)?\/Applications\/([^/]*)\.app\//;
                    const appPathMatch = fullPath.match(appPathRegex);
                    if (appPathMatch) {
                        const appName = appPathMatch[2];

                        return { name: appName, pid, fullPath: appPathMatch[0] };
                    } else {
                        // Binary in unusual location, show warning
                        return { name, pid, fullPath, warning: true };
                    }
                } else {
                    const fullPathCommand = `cat /proc/${pid}/cmdline`;
                    const fullPathRaw = await spawnAndCollectStdout(fullPathCommand);
                    const fullPath = fullPathRaw.split('\0')[0].trim();
                    // Binaries can be all over the place on Linux, so we don't check the path

                    return { name, pid, fullPath };
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
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    const local = parts[1];

                    return { pid, local };
                })
                .find(({ local }) => local.endsWith(`:${port}`));
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
