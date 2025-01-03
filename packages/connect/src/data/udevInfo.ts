// origin: https://github.com/trezor/connect/blob/develop/src/js/data/UdevInfo.js

import type { UdevInfo } from '../events/transport';

const info: UdevInfo = {
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

export const suggestUdevInstaller = (platform?: string) => {
    const info2 = info;
    // check if preferred field was already added
    if (!info2.packages.find(p => p.preferred)) {
        if (platform) {
            // override UdevInfo packages, add preferred field
            info2.packages = info2.packages.map(p => ({
                ...p,
                preferred: p.platform.indexOf(platform) >= 0,
            }));
        }
    }

    return info2;
};
