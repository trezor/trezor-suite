import { type ChildProcess, type SpawnOptions, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

type RunParams = { command: string; args: string[]; options?: SpawnOptions };

const e2eDir = path.resolve(__dirname, '..', '..');
const config = './playwright-config/playwright-desktop-windows.config.ts';
const distro = 'trezor-user-env';
// os.tmpdir() is on the small C: drive of the hosted runners, RUNNER_TEMP on D:.
const distroDir = path.join(process.env.RUNNER_TEMP ?? os.tmpdir(), 'tenv');
const logDir = path.join(e2eDir, 'tenv-logs');
const wslEnv = { ...process.env, WSL_UTF8: '1' };
const usage = 'Usage: yarn workspace @trezor/suite-e2e test:e2e:windows <tenv-rootfs.tar.gz>';

const run = ({ command, args, options = {} }: RunParams) =>
    new Promise<number>((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit', ...options });
        child.on('error', reject);
        child.on('exit', code => resolve(code ?? 1));
    });

const runWsl = async (args: string[]) => {
    const exitCode = await run({ command: 'wsl', args, options: { env: wslEnv } });
    if (exitCode !== 0) {
        throw new Error(`wsl ${args.join(' ')} exited with code ${exitCode}`);
    }
};

// Node refuses to spawn yarn.cmd without a shell.
const runYarn = (args: string[]) =>
    run({
        command: 'yarn',
        args: ['workspace', '@trezor/suite-e2e', ...args],
        options: { cwd: e2eDir, shell: true },
    });

const printTenvOutput = () => {
    for (const file of ['tenv.out.log', 'tenv.err.log']) {
        const filePath = path.join(logDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`--- ${file}`);
            console.log(fs.readFileSync(filePath, 'utf8'));
        }
    }
};

const startTenv = async (rootfs: string) => {
    // Fails when the distro is not registered yet, the normal case on a fresh runner.
    await run({
        command: 'wsl',
        args: ['--unregister', distro],
        options: { env: wslEnv, stdio: 'ignore' },
    });
    await runWsl(['--import', distro, distroDir, rootfs, '--version', '2']);
    await runWsl(['-d', distro, '--', 'mkdir', '-p', '/trezor-user-env/logs/screens']);

    fs.mkdirSync(logDir, { recursive: true });
    const tenv = spawn(
        'wsl',
        [
            '-d',
            distro,
            '--cd',
            '/trezor-user-env',
            '--',
            'env',
            'PYTHONUNBUFFERED=1',
            'uv',
            'run',
            'python',
            'src/main.py',
        ],
        {
            env: wslEnv,
            stdio: [
                'ignore',
                fs.openSync(path.join(logDir, 'tenv.out.log'), 'a'),
                fs.openSync(path.join(logDir, 'tenv.err.log'), 'a'),
            ],
        },
    );
    const exited = new Promise<never>((_, reject) => {
        tenv.once('exit', code => reject(new Error(`trezor-user-env exited with code ${code}`)));
    });

    try {
        await Promise.race([TrezorUserEnvLink.connect(), exited]);
    } catch (error) {
        printTenvOutput();
        throw error;
    }
    await TrezorUserEnvLink.disconnect();
    console.log(`trezor-user-env is up (pid ${tenv.pid})`);

    return tenv;
};

const runTests = async () => {
    if (!process.env.CURRENTS_RECORD_KEY) {
        return runYarn(['exec', 'playwright', 'test', `--config=${config}`]);
    }

    const discoveryFile = `"${path.join(os.tmpdir(), `pwc-discovery-${process.pid}.txt`)}"`;
    const discoveryExitCode = await runYarn([
        'test:orchestrated:e2e',
        'discover',
        '--pwc-discovery-file',
        discoveryFile,
        `--config=${config}`,
    ]);
    if (discoveryExitCode !== 0) {
        throw new Error(`Currents discovery exited with code ${discoveryExitCode}`);
    }

    return runYarn([
        'test:orchestrated:e2e',
        'run',
        '--pwc-discovery-file',
        discoveryFile,
        `--config=${config}`,
        '--pwc-cancel-after-failures',
        'false',
        '--pwc-disable-test-tags',
        '--pwc-skip-reporter-injection',
    ]);
};

const collectLogsAndShutdown = async (tenv: ChildProcess | undefined) => {
    const distroLogsDir = path.join(`\\\\wsl.localhost\\${distro}`, 'trezor-user-env', 'logs');
    try {
        fs.cpSync(distroLogsDir, path.join(logDir, 'tenv'), { recursive: true });
    } catch (error) {
        console.error(`Copying trezor-user-env logs from ${distroLogsDir} failed:`, error);
    }
    tenv?.kill();
    await run({ command: 'wsl', args: ['--shutdown'], options: { env: wslEnv } });
};

const main = async () => {
    const [rootfs, ...rest] = process.argv.slice(2);
    if (rootfs === undefined || rest.length > 0) {
        throw new Error(usage);
    }

    let tenv: ChildProcess | undefined;
    try {
        tenv = await startTenv(rootfs);

        return await runTests();
    } finally {
        await collectLogsAndShutdown(tenv);
    }
};

void main().then(
    exitCode => {
        process.exitCode = exitCode;
    },
    error => {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    },
);
