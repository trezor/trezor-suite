import { type SpawnOptions, spawn, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

type RunParams = { command: string; args: string[]; options?: SpawnOptions };

const repoDir = path.resolve(__dirname, '..', '..', '..', '..');
const composeFile = 'docker/docker-compose.suite-ci-e2e.yml';
const distro = 'trezor-user-env';
// os.tmpdir() is on the small C: drive of the hosted runners, RUNNER_TEMP on D:.
const distroDir = path.join(process.env.RUNNER_TEMP ?? os.tmpdir(), distro);
const dockerHost = 'tcp://127.0.0.1:2375';
const wslEnv = { ...process.env, WSL_UTF8: '1' };
const resetFlag = '--reset';
const usage = `Usage: yarn workspace @trezor/suite-e2e test-env:windows [${resetFlag}] <ubuntu-wsl-image.wsl> <compose-service>...`;

// WSL forwards only IPv4 listeners to Windows localhost, so the daemon must not bind the dual-stack wildcard.
const dockerSetupScript = [
    '#!/bin/bash',
    'set -euxo pipefail',
    'export DEBIAN_FRONTEND=noninteractive',
    'apt-get update -qq',
    'apt-get install -y -qq docker.io docker-compose-v2',
    'mkdir -p /etc/systemd/system/docker.service.d',
    `printf '[Service]\\nExecStart=\\nExecStart=%s -H fd:// -H tcp://127.0.0.1:2375\\n' "$(command -v dockerd)" > /etc/systemd/system/docker.service.d/tcp.conf`,
    'systemctl daemon-reload',
    'systemctl restart docker',
    '',
].join('\n');

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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isDistroRegistered = () => {
    const { status, stdout } = spawnSync('wsl', ['--list', '--quiet'], {
        env: wslEnv,
        encoding: 'utf8',
    });

    return status === 0 && stdout.split(/\r?\n/).some(name => name.trim() === distro);
};

const unregisterExistingDistro = async (shouldReset: boolean) => {
    if (!isDistroRegistered()) {
        return;
    }

    if (!shouldReset) {
        throw new Error(
            `WSL distro ${distro} already exists. Pass ${resetFlag} to delete it, with all its files and Docker volumes, and set it up again.`,
        );
    }

    await runWsl(['--unregister', distro]);
};

const installDocker = async (image: string) => {
    await runWsl(['--import', distro, distroDir, image, '--version', '2']);

    const setupScript = path.join(distroDir, 'docker-setup.sh');
    fs.writeFileSync(setupScript, dockerSetupScript);
    await runWsl(asRoot(['--', 'bash', toWslPath(setupScript)]));

    // WSL drops the distro seconds after its last session ends; the runner kills a step's process
    // tree by parent pid, so a session detached from this process survives the step.
    spawn('wsl', asRoot(['--', 'sleep', 'infinity']), {
        env: wslEnv,
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
    }).unref();
};

const waitForDocker = async () => {
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
        const exitCode = await run({
            command: 'docker',
            args: ['info'],
            options: { env: { ...process.env, DOCKER_HOST: dockerHost }, stdio: 'ignore' },
        });
        if (exitCode === 0) {
            return;
        }
        await sleep(2000);
    }
    await run({ command: 'wsl', args: asRoot(['--', 'journalctl', '-u', 'docker', '--no-pager']) });
    throw new Error('Docker in WSL is not reachable from Windows after 60 s');
};

// Bind mount paths resolve on the client, so compose up runs inside WSL, where the checkout is under /mnt.
const composeUp = (services: string[]) =>
    runWsl(
        asRoot([
            '--cd',
            toWslPath(repoDir),
            '--',
            'docker',
            'compose',
            '-f',
            composeFile,
            'up',
            '-d',
            '--quiet-pull',
            ...services,
        ]),
    );

const main = async () => {
    const args = process.argv.slice(2);
    const [image, ...services] = args.filter(arg => arg !== resetFlag);
    if (image === undefined || services.length === 0) {
        throw new Error(usage);
    }

    await unregisterExistingDistro(args.includes(resetFlag));
    await installDocker(image);
    await waitForDocker();
    await composeUp(services);

    if (process.env.GITHUB_ENV) {
        fs.appendFileSync(process.env.GITHUB_ENV, `DOCKER_HOST=${dockerHost}\n`);
    }
    console.log(`Test environment is up in WSL distro ${distro}, Docker at ${dockerHost}`);
};

void main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
