import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const TREZOR_USER_ENV_CONTAINER = 'trezor-user-env.unix';
const REGTEST_CONTAINER = 'trezor-user-env-regtest';

const TREZOR_USER_ENV_FILES = [
    '/trezor-user-env/logs/debugging.log',
    '/trezor-user-env/logs/emulator_bridge.log',
    '/trezor-user-env/logs/tropic_model.log',
];

const runDocker = (args: string[]): Buffer | undefined => {
    try {
        return execFileSync('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
        console.warn(`Failed to run "docker ${args.join(' ')}":`, error);

        return undefined;
    }
};

export const extractTrezorUserEnvLogs = (destinationDir: string): string[] => {
    fs.mkdirSync(destinationDir, { recursive: true });

    const copiedFiles = TREZOR_USER_ENV_FILES.flatMap(containerPath => {
        const destination = path.join(destinationDir, path.basename(containerPath));

        return runDocker(['cp', `${TREZOR_USER_ENV_CONTAINER}:${containerPath}`, destination])
            ? [destination]
            : [];
    });

    const regtestLogs = runDocker(['logs', REGTEST_CONTAINER]);
    if (regtestLogs) {
        const destination = path.join(destinationDir, 'electrum-regtest.txt');
        fs.writeFileSync(destination, regtestLogs);
        copiedFiles.push(destination);
    }

    return copiedFiles;
};
