export type Environment = 'desktop' | 'web' | 'mobile';

export interface EnvUtils {
    isWeb: () => boolean;
    isDesktop: () => boolean;
    isNative: () => boolean;
    getEnvironment: () => Environment;
    getUserAgent: () => string;
    isAndroid: () => boolean;
    isChromeOs: () => boolean;
    getCommitHash: () => string;
    getSuiteVersion: () => string;
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
    getJWSPublicKey: () => string;
}
