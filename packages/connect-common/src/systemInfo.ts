import { getBrowserName, getBrowserVersion, getDeviceType, getOsFamily } from '@trezor/env-utils';

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
