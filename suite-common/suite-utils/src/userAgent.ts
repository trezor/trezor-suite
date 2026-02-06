import { UAParser } from 'ua-parser-js';

let userAgentParser: UAParser;

export const getUserAgent = () => window.navigator.userAgent;

export const getUserAgentParser = () => {
    if (!userAgentParser) {
        const ua = getUserAgent();
        userAgentParser = new UAParser(ua);
    }

    return userAgentParser;
};

/**
 * .getOS() without `.withClientHints()` is sync and uses only `userAgent`, which is insufficient
 * to distinguish macOS >= 11 (Big Sur and above) and Windows 10 | 11, so we need the async `.withClientHints()`.
 * FYI it uses `getHighEntropyValues` under the hood (works only on Chromium-based browsers).
 */
export const getOsVersion = async () => {
    const { version } = await getUserAgentParser().getOS().withClientHints();

    return version ?? '';
};

/**
 * Similar to `getOsVersion`. Here, the sync fn works everywhere but macOS, hence we use async.
 */
export const getCpuArch = async () => {
    const { architecture } = await getUserAgentParser().getCPU().withClientHints();

    return architecture ?? '';
};
export const getBrowserName = () => {
    const browserName = getUserAgentParser().getBrowser().name?.replace(' ', '');

    return browserName?.toLowerCase() || '';
};

export const getBrowserVersion = () => getUserAgentParser().getBrowser().version || '';

// generally works the same as `getOsName`, just with different information source, but does not work in some specific iOS cases
export const getOsNameWeb = () => getUserAgentParser().getOS().name?.replaceAll(' ', '');

export const getOsFamily = () => {
    const osName = getUserAgentParser().getOS().name?.toLowerCase().replaceAll(' ', '');

    if (osName === 'windows') {
        return 'Windows';
    }
    if (osName === 'macos') {
        return 'MacOS';
    }

    return 'Linux';
};

export const getDeviceType = () => getUserAgentParser().getDevice().type;
