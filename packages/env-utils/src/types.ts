export type Environment = 'desktop' | 'web' | 'mobile';

export interface EnvUtils {
    isWeb: () => boolean;
    isDesktop: () => boolean;
    getEnvironment: () => Environment;
    getUserAgent: () => string;
    isAndroid: () => boolean;
    isChromeOs: () => boolean;
    getBrowserName: () => string;
    getBrowserVersion: () => string;
    getDeviceType: () => string | undefined;
    getOsVersion: () => string;
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
    getOsName: () => '' | 'android' | 'linux' | 'windows' | 'macos' | 'chromeos' | 'ios';
    getOsNameWeb: () => string | undefined;
    getOsFamily: () => 'Windows' | 'MacOS' | 'Linux';
}
