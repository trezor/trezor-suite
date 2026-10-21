// Starts trezor-user-env inside WSL from an exported rootfs, runs the desktop e2e tests against it and
// collects its logs. One process for the whole lifetime: on a GitHub runner a process started by a
// step does not survive the step.
import { type ChildProcess, type SpawnOptions, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as http from 'node:http';
import { createRequire } from 'node:module';
import * as os from 'node:os';
import * as path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';

type WindowsE2eOptions = {
    rootfs: string;
    config: string;
    distro: string;
    distroDir: string;
    logDir: string;
    timeoutSeconds: number;
};

type Result<T> = { success: true; value: T } | { success: false; error: string };

type RunParams = { command: string; args: string[]; options?: SpawnOptions };
type RunNodeScriptParams = { script: string; args: string[]; env?: NodeJS.ProcessEnv };
type GetPackageBinParams = { packageName: string; binName: string };
type CollectLogsAndShutdownParams = { options: WindowsE2eOptions; tenv: ChildProcess | undefined };

const e2eDir = path.resolve(__dirname, '..', '..');
const resolveModule = createRequire(__filename).resolve;
const dashboardUrl = 'http://127.0.0.1:9002/';
const wslEnv = { ...process.env, WSL_UTF8: '1' };
const defaults = {
    config: './playwright-config/playwright-desktop-windows.config.ts',
    distro: 'trezor-user-env',
    distroDir: 'D:\\tenv',
    logDir: path.join(e2eDir, 'tenv-logs'),
    timeoutSeconds: 240,
};
const usage =
    'Usage: yarn workspace @trezor/suite-e2e test:e2e:windows --rootfs <tenv-rootfs.tar.gz> [--config <playwright config>] [--distro <name>] [--distro-dir <dir>] [--log-dir <dir>] [--timeout-seconds <n>]';

const parseOptions = (): Result<WindowsE2eOptions> => {
    const { values } = parseArgs({
        options: {
            rootfs: { type: 'string' },
            config: { type: 'string' },
            distro: { type: 'string' },
            'distro-dir': { type: 'string' },
            'log-dir': { type: 'string' },
            'timeout-seconds': { type: 'string' },
        },
    });
    if (values.rootfs === undefined) {
        return { success: false, error: usage };
    }
    const timeoutSeconds =
        values['timeout-seconds'] === undefined
            ? defaults.timeoutSeconds
            : Number(values['timeout-seconds']);
    if (!Number.isInteger(timeoutSeconds) || timeoutSeconds <= 0) {
        return { success: false, error: `--timeout-seconds must be a positive integer\n${usage}` };
    }

    return {
        success: true,
        value: {
            rootfs: values.rootfs,
            config: values.config ?? defaults.config,
            distro: values.distro ?? defaults.distro,
            distroDir: values['distro-dir'] ?? defaults.distroDir,
            logDir: values['log-dir'] ?? defaults.logDir,
            timeoutSeconds,
        },
    };
};

const run = ({ command, args, options = {} }: RunParams) =>
    new Promise<number>((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit', ...options });
        child.on('error', reject);
        child.on('exit', code => resolve(code ?? 1));
    });

const runWsl = async (args: string[]): Promise<Result<void>> => {
    const exitCode = await run({ command: 'wsl', args, options: { env: wslEnv } });
    if (exitCode !== 0) {
        return { success: false, error: `wsl ${args.join(' ')} exited with code ${exitCode}` };
    }

    return { success: true, value: undefined };
};

const runNodeScript = ({ script, args, env = {} }: RunNodeScriptParams) =>
    run({
        command: process.execPath,
        args: [script, ...args],
        options: { cwd: e2eDir, env: { ...process.env, ...env } },
    });

const getPackageBin = ({ packageName, binName }: GetPackageBinParams): Result<string> => {
    const packageJsonPath = resolveModule(`${packageName}/package.json`);
    const { bin } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
        bin?: string | Record<string, string>;
    };
    const binPath = typeof bin === 'string' ? bin : bin?.[binName];
    if (binPath === undefined) {
        return { success: false, error: `${packageName} has no bin named ${binName}` };
    }

    return { success: true, value: path.join(path.dirname(packageJsonPath), binPath) };
};

const printTenvOutput = (logDir: string) => {
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

const startTenv = async ({
    rootfs,
    distro,
    distroDir,
    logDir,
    timeoutSeconds,
}: WindowsE2eOptions): Promise<Result<ChildProcess>> => {
    const imported = await runWsl(['--import', distro, distroDir, rootfs, '--version', '2']);
    if (!imported.success) {
        return imported;
    }
    const screensDirCreated = await runWsl([
        '-d',
        distro,
        '--',
        'mkdir',
        '-p',
        '/trezor-user-env/logs/screens',
    ]);
    if (!screensDirCreated.success) {
        return screensDirCreated;
    }

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

    const deadline = Date.now() + timeoutSeconds * 1000;
    while (Date.now() < deadline) {
        if (tenv.exitCode !== null) {
            printTenvOutput(logDir);

            return { success: false, error: `trezor-user-env exited with code ${tenv.exitCode}` };
        }
        if (await isDashboardUp()) {
            console.log(`trezor-user-env is reachable on ${dashboardUrl} (pid ${tenv.pid})`);

            return { success: true, value: tenv };
        }
        await sleep(3000);
    }

    printTenvOutput(logDir);

    return {
        success: false,
        error: `trezor-user-env dashboard not reachable on ${dashboardUrl} within ${timeoutSeconds} s`,
    };
};

// Resolves to the test run's exit code; a failing test is a value, not an error.
const runTests = async ({ config }: WindowsE2eOptions): Promise<Result<number>> => {
    if (!process.env.CURRENTS_RECORD_KEY) {
        const playwright = getPackageBin({
            packageName: '@playwright/test',
            binName: 'playwright',
        });
        if (!playwright.success) {
            return playwright;
        }

        return {
            success: true,
            value: await runNodeScript({
                script: playwright.value,
                args: ['test', `--config=${config}`],
            }),
        };
    }

    const pwc = getPackageBin({ packageName: '@currents/playwright', binName: 'pwc-p' });
    if (!pwc.success) {
        return pwc;
    }
    const env = { NODE_OPTIONS: '--no-warnings=DEP0040' };
    const discoveryFile = path.join(os.tmpdir(), `pwc-discovery-${process.pid}.txt`);
    const discoveryExitCode = await runNodeScript({
        script: pwc.value,
        args: ['discover', '--pwc-discovery-file', discoveryFile, `--config=${config}`],
        env,
    });
    if (discoveryExitCode !== 0) {
        return {
            success: false,
            error: `Currents discovery exited with code ${discoveryExitCode}`,
        };
    }
    if (fs.readFileSync(discoveryFile, 'utf8').includes('Total: 0 tests')) {
        console.log('Discovery selected 0 tests, nothing to run.');

        return { success: true, value: 0 };
    }

    return {
        success: true,
        value: await runNodeScript({
            script: pwc.value,
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
        }),
    };
};

const collectLogsAndShutdown = async ({ options, tenv }: CollectLogsAndShutdownParams) => {
    const distroLogsDir = path.join(
        `\\\\wsl.localhost\\${options.distro}`,
        'trezor-user-env',
        'logs',
    );
    try {
        fs.cpSync(distroLogsDir, path.join(options.logDir, 'tenv'), { recursive: true });
    } catch (error) {
        console.error(`Copying trezor-user-env logs from ${distroLogsDir} failed:`, error);
    }
    tenv?.kill();
    await run({ command: 'wsl', args: ['--shutdown'], options: { env: wslEnv } });
};

const main = async (): Promise<number> => {
    const parsed = parseOptions();
    if (!parsed.success) {
        console.error(parsed.error);

        return 1;
    }
    const options = parsed.value;

    let tenv: ChildProcess | undefined;
    try {
        const started = await startTenv(options);
        if (!started.success) {
            console.error(started.error);

            return 1;
        }
        tenv = started.value;

        const tests = await runTests(options);
        if (!tests.success) {
            console.error(tests.error);

            return 1;
        }

        return tests.value;
    } finally {
        await collectLogsAndShutdown({ options, tenv });
    }
};

void main().then(exitCode => {
    process.exitCode = exitCode;
});
