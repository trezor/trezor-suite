/* eslint-disable import/no-extraneous-dependencies -- react-native and expo-localization have been excluded from the package.json file as a workaround, ensuring that they are not bundled with the suite-desktop app  */

import { Dimensions, Platform } from 'react-native';

import { getLocales } from 'expo-localization';

import { EnvUtils } from './types';

const getUserAgent = () => '';

const isChromeOs = () => false;

const getBrowserName = () => '';

const getBrowserVersion = () => '';

const getDeviceType = () => '';

const getOsVersion = () => `${Platform.Version}`;

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

const getOsNameWeb = () => '';

const getOsFamily = (): 'Linux' => 'Linux';

export const envUtils: EnvUtils = {
    getUserAgent,
    isAndroid,
    isChromeOs,
    getBrowserName,
    getBrowserVersion,
    getDeviceType,
    getOsVersion,
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
