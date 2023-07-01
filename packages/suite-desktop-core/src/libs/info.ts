import { app } from 'electron';
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

    return [
        'Info:',
        `- Platform: ${osInfo.platform} ${osInfo.arch}`,
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
