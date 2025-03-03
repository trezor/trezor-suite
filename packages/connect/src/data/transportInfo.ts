// origin: https://github.com/trezor/connect/blob/develop/src/js/data/TransportInfo.js

import type { BridgeInfo } from '../events/transport';

const info: BridgeInfo = {
    version: [2, 0, 27],
    packages: [
        {
            name: 'Linux 64-bit (deb)',
            platform: ['deb64'],
            url: 'bridge/2.0.27/trezor-bridge_2.0.27_amd64.deb',
        },
        {
            name: 'Linux 64-bit (rpm)',
            platform: ['rpm64'],
            url: 'bridge/2.0.27/trezor-bridge-2.0.27-1.x86_64.rpm',
        },
        {
            name: 'Linux 32-bit (deb)',
            platform: ['deb32'],
            url: 'bridge/2.0.27/trezor-bridge_2.0.27_i386.deb',
        },
        {
            name: 'Linux 32-bit (rpm)',
            platform: ['rpm32'],
            url: 'bridge/2.0.27/trezor-bridge-2.0.27-1.i386.rpm',
        },
        {
            name: 'macOS',
            platform: ['mac'],
            signature: 'bridge/2.0.27/trezor-bridge-2.0.27.pkg.asc',
            url: 'bridge/2.0.27/trezor-bridge-2.0.27.pkg',
        },
        {
            name: 'Windows',
            platform: ['win32', 'win64'],
            signature: 'bridge/2.0.27/trezor-bridge-2.0.27-win32-install.exe.asc',
            url: 'bridge/2.0.27/trezor-bridge-2.0.27-win32-install.exe',
        },
    ],
    changelog: '',
};

const getBridgeInfo = (): BridgeInfo => info;

export const suggestBridgeInstaller = (platform?: string): BridgeInfo => {
    const info2 = getBridgeInfo();
    // check if preferred field was already added
    if (platform) {
        // override BridgeInfo packages, add preferred field
        info2.packages = info2.packages.map(p => ({
            ...p,
            preferred: p.platform.indexOf(platform) >= 0,
        }));
    }

    return info2;
};
