import { Dimensions, Platform } from 'react-native';

import { getLocales } from 'expo-localization';

import { EnvUtils } from './types';

const getUserAgent = () => '';

const isChromeOs = () => false;

const getBrowserVersion = () => '';

const getOsVersion = () => Platform.Version;

const getBrowserName = () => '';

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

const getPlatformLanguages = () => getLocales().map(language => language.languageTag);

const getOsName = () => {
    if (isAndroid()) return 'android';
    if (isIOs()) return 'ios';

    return '';
};

export const envUtils: EnvUtils = {
    getUserAgent,
    isAndroid,
    isChromeOs,
    getBrowserVersion,
    getOsVersion,
    getBrowserName,
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
};
