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
