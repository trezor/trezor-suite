import {
    getBrowserVersion,
    getBrowserName,
    getDeviceType,
    getUserAgent,
    getOsFamily,
} from '@trezor/env-utils';

export type InstallerPackage = 'rpm32' | 'rpm64' | 'deb32' | 'deb64' | 'mac' | 'win32' | 'win64';

export interface SystemInfo {
    os: {
        family?: 'Linux' | 'MacOS' | 'Windows';
        mobile: boolean;
    };
    browser: {
        supported: boolean;
        outdated: boolean;
    };
}

export const getInstallerPackage = (): InstallerPackage | undefined => {
    const agent = getUserAgent();

    switch (getOsFamily()) {
        case 'MacOS':
            return 'mac';
        case 'Windows': {
            const arch = agent.match(/(Win64|WOW64)/) ? '64' : '32';

            return `win${arch}`;
        }
        case 'Linux': {
            const isRpm = agent.match(/CentOS|Fedora|Mandriva|Mageia|Red Hat|Scientific|SUSE/)
                ? 'rpm'
                : 'deb';
            const is64x = agent.match(/Linux i[3456]86/) ? '32' : '64';

            return `${isRpm}${is64x}`;
        }
        default:
        // no default, type safe
    }
};

export const getSystemInfo = (supportedBrowsers: {
    [key: string]: { version: number };
}): SystemInfo => {
    const browserName = getBrowserName();
    const browserVersion = getBrowserVersion();
    const supportedBrowser = browserName ? supportedBrowsers[browserName.toLowerCase()] : undefined;
    const outdatedBrowser = supportedBrowser
        ? supportedBrowser.version > parseInt(browserVersion, 10)
        : false;
    const mobile = getDeviceType() === 'mobile';
    const supportedMobile = mobile ? 'usb' in navigator : true;
    const supported = !!(supportedBrowser && !outdatedBrowser && supportedMobile);

    return {
        os: {
            family: getOsFamily(),
            mobile,
        },
        browser: {
            supported,
            outdated: outdatedBrowser,
        },
    };
};
