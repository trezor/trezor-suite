// Starts trezor-user-env inside WSL from its rootfs, runs the desktop e2e tests against it and collects
// its logs. One process for the whole lifetime: on a GitHub runner a process started by a step does not
// survive the step.
import { type ChildProcess, type SpawnOptions, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as http from 'node:http';
import { createRequire } from 'node:module';
import * as os from 'node:os';
import * as path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';

type RunParams = { command: string; args: string[]; options?: SpawnOptions };
type RunNodeScriptParams = { script: string; args: string[]; env?: NodeJS.ProcessEnv };
type GetPackageBinParams = { packageName: string; binName: string };

const e2eDir = path.resolve(__dirname, '..', '..');
const resolveModule = createRequire(__filename).resolve;
const dashboardUrl = 'http://127.0.0.1:9002/';
const distro = 'trezor-user-env';
// os.tmpdir() is on the small C: drive of the hosted runners, RUNNER_TEMP on D:.
const distroDir = path.join(process.env.RUNNER_TEMP ?? os.tmpdir(), 'tenv');
const logDir = path.join(e2eDir, 'tenv-logs');
const startTimeoutMs = 240_000;
const wslEnv = { ...process.env, WSL_UTF8: '1' };
const usage =
    'Usage: yarn workspace @trezor/suite-e2e test:e2e:windows <tenv-rootfs.tar.gz> [--config <playwright config>]';

const parseOptions = () => {
    const { values, positionals } = parseArgs({
        options: { config: { type: 'string' } },
        allowPositionals: true,
    });
    if (positionals.length !== 1) {
        throw new Error(usage);
    }

    return {
        rootfs: positionals[0],
        config: values.config ?? './playwright-config/playwright-desktop-windows.config.ts',
    };
};

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

const runNodeScript = ({ script, args, env = {} }: RunNodeScriptParams) =>
    run({
        command: process.execPath,
        args: [script, ...args],
        options: { cwd: e2eDir, env: { ...process.env, ...env } },
    });

const getPackageBin = ({ packageName, binName }: GetPackageBinParams) => {
    const packageJsonPath = resolveModule(`${packageName}/package.json`);
    const { bin } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
        bin?: string | Record<string, string>;
    };
    const binPath = typeof bin === 'string' ? bin : bin?.[binName];
    if (binPath === undefined) {
        throw new Error(`${packageName} has no bin named ${binName}`);
    }

    return path.join(path.dirname(packageJsonPath), binPath);
};

const printTenvOutput = () => {
    for (const file of ['tenv.out.log', 'tenv.err.log']) {
        const filePath = path.join(logDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`--- ${file}`);
            console.log(fs.readFileSync(filePath, 'utf8'));
        }
    }
};

// A kept-alive socket to the dashboard crashes Node when WSL is shut down, so no keep-alive agent.
const isDashboardUp = () =>
    new Promise<boolean>(resolve => {
        const request = http.get(dashboardUrl, { agent: false, timeout: 3000 }, response => {
            response.resume();
            resolve(response.statusCode === 200);
        });
        request.on('timeout', () => request.destroy());
        request.on('error', () => resolve(false));
    });

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

    const deadline = Date.now() + startTimeoutMs;
    while (Date.now() < deadline) {
        if (tenv.exitCode !== null) {
            printTenvOutput();
            throw new Error(`trezor-user-env exited with code ${tenv.exitCode}`);
        }
        if (await isDashboardUp()) {
            console.log(`trezor-user-env is reachable on ${dashboardUrl} (pid ${tenv.pid})`);

            return tenv;
        }
        await sleep(3000);
    }

    printTenvOutput();
    throw new Error(
        `trezor-user-env dashboard not reachable on ${dashboardUrl} within ${startTimeoutMs / 1000} s`,
    );
};

const runTests = async (config: string) => {
    if (!process.env.CURRENTS_RECORD_KEY) {
        const playwright = getPackageBin({
            packageName: '@playwright/test',
            binName: 'playwright',
        });

        return runNodeScript({ script: playwright, args: ['test', `--config=${config}`] });
    }

    const pwc = getPackageBin({ packageName: '@currents/playwright', binName: 'pwc-p' });
    const env = { NODE_OPTIONS: '--no-warnings=DEP0040' };
    const discoveryFile = path.join(os.tmpdir(), `pwc-discovery-${process.pid}.txt`);
    const discoveryExitCode = await runNodeScript({
        script: pwc,
        args: ['discover', '--pwc-discovery-file', discoveryFile, `--config=${config}`],
        env,
    });
    if (discoveryExitCode !== 0) {
        throw new Error(`Currents discovery exited with code ${discoveryExitCode}`);
    }

    return runNodeScript({
        script: pwc,
        args: [
            'run',
            '--pwc-discovery-file',
            discoveryFile,
            `--config=${config}`,
            '--pwc-cancel-after-failures',
            'false',
            '--pwc-disable-test-tags',
            '--pwc-skip-reporter-injection',
        ],
        env,
    });
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
    const { rootfs, config } = parseOptions();
    let tenv: ChildProcess | undefined;
    try {
        tenv = await startTenv(rootfs);

        return await runTests(config);
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
        process.exitCode = 1;
    },
);
