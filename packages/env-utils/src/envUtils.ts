import UAParser from 'ua-parser-js';

let userAgentParser: UAParser;

/* This way, we can override simple utils, which helps to polyfill methods which are not available in react-native. */
export const getUserAgent = () => window.navigator.userAgent;

const getUserAgentParser = () => {
    if (!userAgentParser) {
        const ua = getUserAgent();
        userAgentParser = new UAParser(ua);
    }
    return userAgentParser;
};

export const isAndroid = () => /Android/.test(getUserAgent());

export const isChromeOs = () => /CrOS/.test(getUserAgent());

export const getBrowserVersion = () => getUserAgentParser().getBrowser().version || '';

/* Not correct for Linux as there is many different distributions in different versions */
export const getOsVersion = () => getUserAgentParser().getOS().version || '';

export const getBrowserName = () => {
    const browserName = getUserAgentParser().getBrowser().name;
    return browserName?.toLowerCase() || '';
};

export const isFirefox = () => getBrowserName() === 'firefox';

// List of platforms https://docker.apachezone.com/blog/74
export const getPlatform = () => window.navigator.platform;

export const getPlatformLanguages = () => window.navigator.languages;

export const getScreenWidth = () => window.screen.width;

export const getScreenHeight = () => window.screen.height;

export const getWindowWidth = () => window.innerWidth;

export const getWindowHeight = () => window.innerHeight;

export const getLocationOrigin = () => window.location.origin;

export const getLocationHostname = () => window.location.hostname;

export const getProcessPlatform = () => process.platform;

export const isMacOs = () => {
    if (getProcessPlatform() === 'darwin') return true;
    if (typeof window === 'undefined') return;

    return getPlatform().startsWith('Mac');
};

export const isWindows = () => {
    if (getProcessPlatform() === 'win32') return true;
    if (typeof window === 'undefined') return;

    return getPlatform().startsWith('Win');
};

export const isIOs = () => ['iPhone', 'iPad', 'iPod'].includes(getPlatform());

export const isLinux = () => {
    if (getProcessPlatform() === 'linux') return true;
    if (typeof window === 'undefined') return;

    // exclude Android and Chrome OS as window.navigator.platform of those OS is Linux
    if (isAndroid() || isChromeOs()) return false;

    return getPlatform().startsWith('Linux');
};

export const getOsName = () => {
    if (isWindows()) return 'windows';
    if (isMacOs()) return 'macos';
    if (isAndroid()) return 'android';
    if (isChromeOs()) return 'chromeos';
    if (isLinux()) return 'linux';
    if (isIOs()) return 'ios';

    return '';
};
