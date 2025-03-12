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
            preferred: true, // DEB package is the most common
        },
    ],
};

export const suggestUdevInstaller = (platform?: string): UdevInfo => {
    // `platform` is not available on the desktop, in that case we assume the preferred as DEB

    if (platform !== undefined) {
        return {
            packages: info.packages.map(it => ({
                ...it,
                preferred: it.platform.indexOf(platform) >= 0,
            })),
        };
    }

    return info;
};
