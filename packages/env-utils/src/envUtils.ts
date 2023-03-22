import UAParser from 'ua-parser-js';

import { EnvUtils } from './types';

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

/* Not correct for Linux as there is many different distributions in different versions */
const getOsVersion = () => getUserAgentParser().getOS().version || '';

const getBrowserName = () => {
    const browserName = getUserAgentParser().getBrowser().name;
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
    if (typeof window === 'undefined') return;

    return getPlatform().startsWith('Mac');
};

const isWindows = () => {
    if (getProcessPlatform() === 'win32') return true;
    if (typeof window === 'undefined') return;

    return getPlatform().startsWith('Win');
};

const isIOs = () => ['iPhone', 'iPad', 'iPod'].includes(getPlatform());

const isLinux = () => {
    if (getProcessPlatform() === 'linux') return true;
    if (typeof window === 'undefined') return;

    // exclude Android and Chrome OS as window.navigator.platform of those OS is Linux
    if (isAndroid() || isChromeOs()) return false;

    return getPlatform().startsWith('Linux');
};

const getOsName = () => {
    if (isWindows()) return 'windows';
    if (isMacOs()) return 'macos';
    if (isAndroid()) return 'android';
    if (isChromeOs()) return 'chromeos';
    if (isLinux()) return 'linux';
    if (isIOs()) return 'ios';

    return '';
};

const getOsNameWeb = () => getUserAgentParser().getOS().name;

const getOsFamily = () => {
    const osName = getUserAgentParser().getOS().name;

    if (osName === 'Windows') {
        return 'Windows';
    }
    if (osName === 'Mac OS') {
        return 'MacOS';
    }
    return 'Linux';
};

const getDeviceType = () => getUserAgentParser().getDevice().type;

export const envUtils: EnvUtils = {
    getUserAgent,
    isAndroid,
    isChromeOs,
    getOsVersion,
    getBrowserName,
    getBrowserVersion,
    getDeviceType,
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
    getOsName,
    getOsNameWeb,
    getOsFamily,
};
