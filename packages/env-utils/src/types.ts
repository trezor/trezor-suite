export type Environment = 'desktop' | 'web' | 'mobile';

export interface EnvUtils {
    isWeb: () => boolean;
    isDesktop: () => boolean;
    isNative: () => boolean;
    getEnvironment: () => Environment;
    getUserAgent: () => string;
    isAndroid: () => boolean;
    isChromeOs: () => boolean;
    getBrowserName: () => string;
    getBrowserVersion: () => string;
    getCommitHash: () => string;
    getDeviceType: () => string | undefined;
    getOsVersion: () => Promise<string>;
    getDeprecatedOsVersion: () => string;
    getCpuArch: () => Promise<string>;
    getSuiteVersion: () => string;
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
    isMacOs: () => boolean;
    isWindows: () => boolean;
    isIOs: () => boolean;
    isLinux: () => boolean;
    isCodesignBuild: () => boolean;
    getOsName: () => '' | 'android' | 'linux' | 'windows' | 'macos' | 'chromeos' | 'ios';
    getOsNameWeb: () => string | undefined;
    getOsFamily: () => 'Windows' | 'MacOS' | 'Linux';
    getJWSPublicKey: () => string;
}
