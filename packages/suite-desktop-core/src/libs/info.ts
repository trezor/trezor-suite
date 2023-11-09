import { app } from 'electron';
import { exec } from 'child_process';
import si from 'systeminformation';

import { bytesToHumanReadable } from '@trezor/utils';
import { isDevEnv } from '@suite-common/suite-utils';

import { b2t } from './utils';

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

export const getComputerInfo = async () => {
    const { system, cpu, mem, osInfo } = await si.get({
        system: 'manufacturer, model, virtual',
        cpu: 'manufacturer, brand, processors, physicalCores, cores, speed',
        mem: 'total',
        osInfo: 'platform, arch, distro, release',
    });

    const ldd = await new Promise(resolve => {
        exec('ldd --version', (error: any, stdout: any, stderr: any) => {
            if (error) {
                resolve(`LDD VERSION: ${error.message}`);
                return;
            }
            if (stderr) {
                resolve(`LDD VERSION: ${stderr}`);
                return;
            }
            resolve(`LDD VERSION: ${stdout}`);
        });
    });

    return [
        'Info:',
        `- Platform: ${osInfo.platform} ${osInfo.arch}`,
        `- LDD: ${ldd}`,
        `- OS: ${osInfo.distro} ${osInfo.release}`,
        `- Manufacturer: ${system.manufacturer}`,
        `- Model: ${system.model}`,
        `- Virtual: ${b2t(system.virtual)}`,
        `- CPU: ${cpu.manufacturer} ${cpu.brand}`,
        `- Cores: ${cpu.processors}x${cpu.physicalCores}(+${cpu.cores - cpu.physicalCores}) @ ${
            cpu.speed
        }GHz`,
        `- RAM: ${bytesToHumanReadable(mem.total)}`,
    ];
};
