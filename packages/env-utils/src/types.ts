export interface EnvUtils {
    getUserAgent: () => string;
    isAndroid: () => boolean;
    isChromeOs: () => boolean;
    getBrowserVersion: () => string;
    getOsVersion: () => string;
    getBrowserName: () => string;
    isFirefox: () => boolean;
    getPlatform: () => string;
    getPlatformLanguages: () => readonly string[];
    getScreenWidth: () => number;
    getScreenHeight: () => number;
    getWindowWidth: () => number;
    getWindowHeight: () => number;
    getLocationOrigin: () => string;
    getLocationHostname: () => string;
    getProcessPlatform: () => string;
    isMacOs: () => boolean | undefined;
    isWindows: () => boolean | undefined;
    isIOs: () => boolean;
    isLinux: () => boolean | undefined;
    getOsName: () => string;
}
