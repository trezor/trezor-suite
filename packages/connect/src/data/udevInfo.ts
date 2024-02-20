// origin: https://github.com/trezor/connect/blob/develop/src/js/data/UdevInfo.js

// This file is using format of ./data/bridge/releases.json
// udev rules are changed occasionally and since there is no releases.json for udev rules its ok to make it hardcoded here

import type { UdevInfo } from '../events/transport';

const info: UdevInfo = {
    directory: '',
    packages: [
        {
            name: 'RPM package',
            platform: ['rpm32', 'rpm64'],
            url: '/udev/trezor-udev-2-1.noarch.rpm',
        },
        {
            name: 'DEB package',
            platform: ['deb32', 'deb64'],
            url: '/udev/trezor-udev_2_all.deb',
        },
    ],
};

export const getUdevInfo = () => info;

export const suggestUdevInstaller = (platform?: string) => {
    const info = getUdevInfo();
    // check if preferred field was already added
    if (!info.packages.find(p => p.preferred)) {
        if (platform) {
            // override UdevInfo packages, add preferred field
            info.packages = info.packages.map(p => ({
                ...p,
                preferred: p.platform.indexOf(platform) >= 0,
            }));
        }
    }

    return info;
};
