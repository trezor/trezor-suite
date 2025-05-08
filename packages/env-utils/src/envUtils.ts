import { UAParser } from 'ua-parser-js';

import { firmwareConfigPublicKey, publicKey } from './jws';
import { EnvUtils, Environment, JWSPublicKeyUse } from './types';

export const isWeb = () => process.env.SUITE_TYPE === 'web';

export const isDesktop = () => process.env.SUITE_TYPE === 'desktop';

export const isNative = () => false;

export const getEnvironment = (): Environment => {
    if (isWeb()) return 'web';

    return 'desktop';
};

let userAgentParser: UAParser;

/* This way, we can override simple utils, which helps to polyfill methods which are not available in react-native. */
const getUserAgent = () => window.navigator.userAgent;

const getUserAgentParser = () => {
    if (!userAgentParser) {
        const ua = getUserAgent();
        userAgentParser = new UAParser(ua);
    }

    return userAgentParser;
};

const isAndroid = () => /Android/.test(getUserAgent());

const isChromeOs = () => /CrOS/.test(getUserAgent());

const getBrowserVersion = () => getUserAgentParser().getBrowser().version || '';

const getCommitHash = () => process.env.COMMITHASH || '';

/**
 * .getOS() without `.withClientHints()` is sync and uses only `userAgent`, which is insufficient
 * to distinguish macOS >= 11 (Big Sur and above) and Windows 10 | 11, so we need the async `.withClientHints()`.
 * FYI it uses `getHighEntropyValues` under the hood (works only on Chromium-based browsers).
 */
const getOsVersion = async () => {
    const { version } = await getUserAgentParser().getOS().withClientHints();

    return version ?? '';
};
/** @deprecated: Use the async getOsVersion instead. */
const getDeprecatedOsVersion = () => getUserAgentParser().getOS().version || '';

/**
 * Similar to `getOsVersion`. Here, the sync fn works everywhere but macOS, hence we use async.
 */
const getCpuArch = async () => {
    const { architecture } = await getUserAgentParser().getCPU().withClientHints();

    return architecture ?? '';
};

const getSuiteVersion = () => process.env.VERSION || '';

const getBrowserName = () => {
    const browserName = getUserAgentParser().getBrowser().name?.replace(' ', '');

    return browserName?.toLowerCase() || '';
};

const isFirefox = () => getBrowserName() === 'firefox';

// List of platforms https://docker.apachezone.com/blog/74
const getPlatform = () => window.navigator.platform;

const getPlatformLanguages = () => window.navigator.languages;

const getScreenWidth = () => window.screen.width;

const getScreenHeight = () => window.screen.height;

const getWindowWidth = () => window.innerWidth;

const getWindowHeight = () => window.innerHeight;

const getLocationOrigin = () => window.location.origin;

const getLocationHostname = () => window.location.hostname;

const getProcessPlatform = () => (typeof process !== 'undefined' ? process.platform : '');

const isMacOs = () => {
    if (getProcessPlatform() === 'darwin') return true;
    if (typeof window === 'undefined') return false;

    return getPlatform().toLowerCase().startsWith('mac');
};

const isWindows = () => {
    if (getProcessPlatform() === 'win32') return true;
    if (typeof window === 'undefined') return false;

    return getPlatform().toLowerCase().startsWith('win');
};

const isIOs = () => ['iPhone', 'iPad', 'iPod'].includes(getPlatform());

const isLinux = () => {
    if (getProcessPlatform() === 'linux') return true;
    if (typeof window === 'undefined') return false;

    // exclude Android and Chrome OS as window.navigator.platform of those OS is Linux
    if (isAndroid() || isChromeOs()) return false;

    return getPlatform().toLowerCase().startsWith('linux');
};

const isCodesignBuild = () => process.env.IS_CODESIGN_BUILD === 'true';

const getOsName = () => {
    if (isWindows()) return 'windows';
    if (isMacOs()) return 'macos';
    if (isAndroid()) return 'android';
    if (isChromeOs()) return 'chromeos';
    if (isLinux()) return 'linux';
    if (isIOs()) return 'ios';

    return '';
};

const getOsNameWeb = () => getUserAgentParser().getOS().name?.replaceAll(' ', '');

const getOsFamily = () => {
    const osName = getUserAgentParser().getOS().name?.toLowerCase().replaceAll(' ', '');

    if (osName === 'windows') {
        return 'Windows';
    }
    if (osName === 'macos') {
        return 'MacOS';
    }

    return 'Linux';
};

const getDeviceType = () => getUserAgentParser().getDevice().type;

export const getJWSPublicKey = (use: JWSPublicKeyUse) => {
    if (['message-system', 'token-definitions'].includes(use)) {
        return isCodesignBuild() ? publicKey.codesign : publicKey.dev;
    }

    return isCodesignBuild() ? firmwareConfigPublicKey.codesign : firmwareConfigPublicKey.dev;
};
export const envUtils: EnvUtils = {
    isWeb,
    isDesktop,
    isNative,
    getEnvironment,
    getUserAgent,
    isAndroid,
    isChromeOs,
    getOsVersion,
    getDeprecatedOsVersion,
    getCpuArch,
    getBrowserName,
    getBrowserVersion,
    getCommitHash,
    getDeviceType,
    getSuiteVersion,
    isFirefox,
    getPlatform,
    getPlatformLanguages,
    getScreenWidth,
    getScreenHeight,
    getWindowWidth,
    getWindowHeight,
    getLocationOrigin,
    getLocationHostname,
    getProcessPlatform,
    isMacOs,
    isWindows,
    isIOs,
    isLinux,
    isCodesignBuild,
    getOsName,
    getOsNameWeb,
    getOsFamily,
    getJWSPublicKey,
};
