import { execSync } from 'child_process';
import { app } from 'electron';
import os from 'os';

import { isDevEnv } from '@suite-common/suite-utils';
import { bytesToHumanReadable, capitalizeFirstLetter } from '@trezor/utils';

import { b2t } from './utils';

const getCPUInfo = () => {
    const cpus = os.cpus();
    const cores = cpus.length;
    const model = cpus[0]?.model.trim() ?? 'Unknown CPU';

    const maxSpeedMHz = Math.max(...cpus.map(cpu => cpu.speed));
    const speedGHz = isNaN(maxSpeedMHz) ? 'Unknown CPU speed' : (maxSpeedMHz / 1000).toFixed(2);

    return {
        model,
        cores,
        speedGHz,
    };
};

export const getBuildInfo = () => [
    'Info:',
    `- Version: ${app?.getVersion()}`,
    `- Electron: ${process.versions.electron}`,
    `- Node: ${process.version}`,
    `- Commit: ${process.env.COMMITHASH}`,
    `- Dev: ${b2t(isDevEnv)}`,
    `- Args: ${process.argv.slice(1).join(' ')}`,
    `- CWD: ${process.cwd()}`,
];

/**
 * This information is currently used *only* in Debug mode, goes to stdout and local files, see logger.ts.
 * It is neither sent to analytics (but a similar info is queried in the renderer process for consistency with Web),
 * nor offered in the UI "Application logs" section (those are redux logs, nothing from nodeJS process).
 */
export const getComputerInfo = () => {
    const cpu = getCPUInfo();

    return [
        'Info:',
        `- Platform: ${os.platform()} ${os.arch()}`,
        `- OS release: ${os.release()}`,
        `- OS version: ${os.version()}`,
        `- CPU: ${cpu.model}`,
        `- Cores: ${cpu.cores} @ ${cpu.speedGHz} GHz`,
        `- RAM: ${bytesToHumanReadable(os.totalmem())}`,
    ];
};

export const getComputerName = () => {
    try {
        let name;
        switch (process.platform) {
            case 'win32':
                name = process.env.COMPUTERNAME;
                break;
            case 'darwin':
                name = execSync('scutil --get ComputerName').toString().trim();
                break;
            case 'linux':
                name = execSync('hostnamectl --pretty').toString().trim();
                break;
        }

        return name || os.hostname();
    } catch {
        // Fallback - executed binaries might not be available
        return os.hostname() || capitalizeFirstLetter(process.platform);
    }
};
