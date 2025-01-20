import { spawn } from 'child_process';

export function spawnAndCollectStdout(command: string): Promise<string> {
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

export async function findProcessFromIncomingPort(port: number) {
    switch (process.platform) {
        case 'darwin':
        case 'linux': {
            const command = `lsof -iTCP:${port} -sTCP:ESTABLISHED -n -P +c0`;
            const stdout = await spawnAndCollectStdout(command);
            const lines = stdout.split('\n');
            const process = lines.find(line => line.includes(`:${port}->`));
            if (process) {
                const name = process.split(/\s+/)[0].replace(/\\x\d{2}/g, ' ');
                const pid = process.split(/\s+/)[1];
                const user = process.split(/\s+/)[2];

                return { name, pid, user };
            }

            return undefined;
        }
        case 'win32': {
            const command = `netstat -ano | findstr :${port} | findstr ESTABLISHED`;
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
                const processInfo = await spawnAndCollectStdout(
                    `tasklist /FI "PID eq ${record.pid}" | findstr ${record.pid}`,
                );
                const parts = processInfo.split(/\s+/);
                const name = parts[0];
                const user = parts[2];

                return { name, pid: record.pid, user };
            }

            return undefined;
        }
    }
}
