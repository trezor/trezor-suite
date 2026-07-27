import { publicKey } from './jws';
import { type EnvUtils, type Environment } from './types';

export const isWeb = () => process.env.SUITE_TYPE === 'web';

export const isDesktop = () => process.env.SUITE_TYPE === 'desktop';

export const isNative = () => false;

export const getEnvironment = (): Environment => {
    if (isWeb()) return 'web';

    return 'desktop';
};

/* This way, we can override simple utils, which helps to polyfill methods which are not available in react-native. */
const getUserAgent = () => window.navigator.userAgent;

const isAndroid = () => /Android/.test(getUserAgent());

const isChromeOs = () => /CrOS/.test(getUserAgent());

const getCommitHash = () => process.env.COMMITHASH || '';

const getSuiteVersion = () => process.env.VERSION || '';

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

export const getJWSPublicKey = () => (isCodesignBuild() ? publicKey.codesign : publicKey.dev);

export const envUtils: EnvUtils = {
    isWeb,
    isDesktop,
    isNative,
    getEnvironment,
    getUserAgent,
    isAndroid,
    isChromeOs,
    getCommitHash,
    getSuiteVersion,
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
    getJWSPublicKey,
};
