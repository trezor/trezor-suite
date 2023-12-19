import { Dimensions, Platform } from 'react-native';
import Config from 'react-native-config';

import { getLocales } from 'expo-localization';

import { EnvUtils } from './types';

const isWeb = () => false;

const isDesktop = () => false;

const isNative = () => true;

const getEnvironment = () => 'mobile' as const;

const getUserAgent = () => '';

const isChromeOs = () => false;

const getBrowserName = () => '';

const getBrowserVersion = () => '';

const getDeviceType = () => '';

const getOsVersion = () => `${Platform.Version}`;

const getSuiteVersion = () => Config.VERSION || '';

const getCommitHash = () => Config.COMMIT_HASH || '';

const isFirefox = () => false;

const getPlatform = () => Platform.OS;

// Size of the visible Application window
const getWindowWidth = () => Dimensions.get('window').width;

const getWindowHeight = () => Dimensions.get('window').height;

// Size of the device's screen
const getScreenWidth = () => Dimensions.get('screen').width;

const getScreenHeight = () => Dimensions.get('screen').height;

const getLocationOrigin = () => '';

// can be used e.g. by deep linking
const getLocationHostname = () => 'trezorsuiteapp';

const getProcessPlatform = () => '';

const isMacOs = () => false;

const isWindows = () => false;

const isIOs = () => getPlatform() === 'ios';

const isAndroid = () => getPlatform() === 'android';

const isLinux = () => false;

const isCodesignBuild = () => Config.CODESIGN_BUILD === 'true';

const getPlatformLanguages = () => getLocales().map(language => language.languageTag);

const getOsName = () => {
    if (isAndroid()) return 'android';
    if (isIOs()) return 'ios';

    return '';
};

const getOsNameWeb = () => '';

const getOsFamily = (): 'Linux' => 'Linux';

export const envUtils: EnvUtils = {
    isWeb,
    isDesktop,
    isNative,
    getEnvironment,
    getUserAgent,
    isAndroid,
    isChromeOs,
    getBrowserName,
    getBrowserVersion,
    getCommitHash,
    getDeviceType,
    getOsVersion,
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
};
