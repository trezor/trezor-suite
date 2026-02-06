import { envUtils } from './envUtils';

export type { Environment, EnvUtils } from './types';

export const {
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
} = envUtils;

export { resolveStaticPath, resolveConnectPath } from './resolveStaticPath';
