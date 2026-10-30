// Throwaway experiment: Docker engine inside a stock Ubuntu WSL distro, tenv started with the
// shared compose file instead of the exported rootfs. Everything stays in one process.
import { type ChildProcess, type SpawnOptions, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

type RunParams = { command: string; args: string[]; options?: SpawnOptions };

const e2eDir = path.resolve(__dirname, '..', '..');
const repoDir = path.resolve(e2eDir, '..', '..');
const composeFile = 'docker/docker-compose.suite-ci-e2e.yml';
const config = './playwright-config/playwright-desktop-windows.config.ts';
const distro = 'tenv-docker';
const distroDir = path.join(process.env.RUNNER_TEMP ?? os.tmpdir(), 'tenv-docker');
const logDir = path.join(e2eDir, 'tenv-logs');
const wslEnv = { ...process.env, WSL_UTF8: '1' };
const usage =
    'Usage: yarn workspace @trezor/suite-e2e exec tsx ./scripts/windows/run-e2e-docker.ts <ubuntu-rootfs.tar.gz>';

const dockerSetupScript = `#!/bin/bash
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive
printf '#!/bin/sh\\nexit 101\\n' > /usr/sbin/policy-rc.d
chmod +x /usr/sbin/policy-rc.d
apt-get update -qq
apt-get install -y -qq docker.io docker-compose-v2 iptables
update-alternatives --set iptables /usr/sbin/iptables-legacy
update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy
docker --version
docker compose version
`;

const toWslPath = (windowsPath: string) => {
    const match = /^([A-Za-z]):(.*)$/.exec(windowsPath);
    if (match === null) {
        throw new Error(`Not an absolute Windows path: ${windowsPath}`);
    }
    const [, drive, rest] = match;

    return `/mnt/${drive?.toLowerCase()}${rest?.replace(/\\/g, '/')}`;
};

const run = ({ command, args, options = {} }: RunParams) =>
    new Promise<number>((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit', ...options });
        child.on('error', reject);
        child.on('exit', code => resolve(code ?? 1));
    });

const asRoot = (args: string[]) => ['-d', distro, '-u', 'root', ...args];

const runWsl = async (args: string[]) => {
    const exitCode = await run({ command: 'wsl', args, options: { env: wslEnv } });
    if (exitCode !== 0) {
        throw new Error(`wsl ${args.join(' ')} exited with code ${exitCode}`);
    }
};

const runYarn = (args: string[]) =>
    run({
        command: 'yarn',
        args: ['workspace', '@trezor/suite-e2e', ...args],
        options: { cwd: e2eDir, shell: true },
    });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const waitForDockerd = async (dockerd: ChildProcess) => {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
        if (dockerd.exitCode !== null) {
            throw new Error(`dockerd exited with code ${dockerd.exitCode}`);
        }
        const exitCode = await run({
            command: 'wsl',
            args: asRoot(['--', 'docker', 'info']),
            options: { env: wslEnv, stdio: 'ignore' },
        });
        if (exitCode === 0) {
            return;
        }
        await sleep(2000);
    }
    throw new Error('dockerd did not become ready in 120 s');
};

const logFile = (name: string) => fs.openSync(path.join(logDir, name), 'a');

const startTenv = async (rootfs: string) => {
    await run({
        command: 'wsl',
        args: ['--unregister', distro],
        options: { env: wslEnv, stdio: 'ignore' },
    });
    await runWsl(['--import', distro, distroDir, rootfs, '--version', '2']);

    fs.mkdirSync(logDir, { recursive: true });
    const setupScript = path.join(logDir, 'docker-setup.sh');
    fs.writeFileSync(setupScript, dockerSetupScript);
    await runWsl(asRoot(['--', 'bash', toWslPath(setupScript)]));

    const dockerd = spawn('wsl', asRoot(['--', 'dockerd']), {
        env: wslEnv,
        stdio: ['ignore', logFile('dockerd.out.log'), logFile('dockerd.err.log')],
    });
    await waitForDockerd(dockerd);
    console.log(`dockerd is up (wsl pid ${dockerd.pid})`);

    const compose = ['--cd', toWslPath(repoDir), '--', 'docker', 'compose', '-f', composeFile];
    await runWsl(asRoot([...compose, 'up', '-d', '--quiet-pull', 'trezor-user-env-unix']));
    await runWsl(asRoot([...compose, 'ps']));

    const exited = new Promise<never>((_, reject) => {
        dockerd.once('exit', code => reject(new Error(`dockerd exited with code ${code}`)));
    });
    await Promise.race([TrezorUserEnvLink.connect(), exited]);
    await TrezorUserEnvLink.disconnect();
    console.log('trezor-user-env is up');

    return dockerd;
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

const collectLogsAndShutdown = async (dockerd: ChildProcess | undefined) => {
    if (dockerd !== undefined) {
        const compose = ['--cd', toWslPath(repoDir), '--', 'docker', 'compose', '-f', composeFile];
        await run({
            command: 'wsl',
            args: asRoot([...compose, 'logs', '--no-color']),
            options: {
                env: wslEnv,
                stdio: ['ignore', logFile('compose.log'), logFile('compose.log')],
            },
        });
        await run({ command: 'wsl', args: asRoot([...compose, 'down']), options: { env: wslEnv } });
        dockerd.kill();
    }
    await run({ command: 'wsl', args: ['--shutdown'], options: { env: wslEnv } });
};

const main = async () => {
    const [rootfs, ...rest] = process.argv.slice(2);
    if (rootfs === undefined || rest.length > 0) {
        throw new Error(usage);
    }

    let dockerd: ChildProcess | undefined;
    try {
        dockerd = await startTenv(rootfs);

        return await runTests();
    } finally {
        await collectLogsAndShutdown(dockerd);
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
