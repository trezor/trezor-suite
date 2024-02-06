/* eslint-disable import/no-default-export */
/* eslint-disable import/no-anonymous-default-export */
import { ExpoConfig, ConfigContext } from 'expo/config';

import { suiteNativeVersion } from './package.json';

type BuildType = 'debug' | 'develop' | 'staging' | 'production';

const getBuildType = (): BuildType => {
    if (process.env.ENVIRONMENT === 'production') return 'production';
    if (process.env.ENVIRONMENT === 'staging') return 'staging';
    if (process.env.ENVIRONMENT === 'develop') return 'develop';
    return 'debug';
};
const buildType = getBuildType();

const bundleIdentifiers = {
    debug: 'io.trezor.suite.debug',
    develop: 'io.trezor.suite.develop',
    staging: 'io.trezor.suite.staging',
    production: 'io.trezor.suite',
} as const satisfies Record<BuildType, string>;
const bundleIdentifier = bundleIdentifiers[buildType];

const appIconsIos = {
    debug: './assets/debug/appIcon.png',
    develop: './assets/develop/appIcon.png',
    staging: './assets/staging/appIcon.png',
    production: './assets/production/appIcon.png',
} as const satisfies Record<BuildType, string>;
const appIconIos = appIconsIos[buildType];

const appIconsAndroid = {
    debug: {
        backgroundColor: '#2587A5',
    },
    develop: {
        backgroundColor: '#900B0B',
    },
    staging: {
        backgroundColor: '#E49C18',
    },
    production: {
        backgroundColor: '#0F6148',
    },
} as const;
const appIconAndroid = appIconsAndroid[buildType];

const appNames = {
    debug: 'Trezor Suite Debug',
    develop: 'Trezor Suite Develop',
    staging: 'Trezor Suite Staging',
    production: 'Trezor Suite',
} as const satisfies Record<BuildType, string>;
const appName = appNames[buildType];
const appSlug = appName.replace(/\s/g, '');

if (!process.env.SENTRY_AUTH_TOKEN && buildType !== 'debug') {
    throw new Error('Missing SENTRY_AUTH_TOKEN env variable');
}

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: appName,
    slug: appSlug,
    version: suiteNativeVersion,
    splash: {
        image: './assets/splash_icon.png',
        backgroundColor: '#25292E',
        resizeMode: 'contain',
    },
    android: {
        package: bundleIdentifier,
        versionCode: 1,
        adaptiveIcon: {
            foregroundImage: './assets/appIcon_android.png',
            monochromeImage: './assets/appIcon_android.png',
            ...appIconAndroid,
        },
    },
    ios: {
        bundleIdentifier,
        icon: appIconIos,
    },
    plugins: [
        [
            'expo-font',
            {
                fonts: [
                    '../../packages/theme/fonts/TTSatoshi-Medium.otf',
                    '../../packages/theme/fonts/TTSatoshi-DemiBold.otf',
                ],
            },
        ],
        [
            '@sentry/react-native/expo',
            {
                url: 'https://sentry.io/',
                authToken: process.env.SENTRY_AUTH_TOKEN,
                project: 'suite-native',
                organization: 'satoshilabs',
            },
        ],
        [
            'expo-barcode-scanner',
            {
                cameraPermission: 'Allow $(PRODUCT_NAME) to access camera for QR code scanning.',
            },
        ],
        [
            'expo-build-properties',
            {
                android: {
                    minSdkVersion: 28,
                },
                ios: {
                    deploymentTarget: '14.0',
                },
            },
        ],
        '@trezor/react-native-usb/plugins/withUSBDevice.js',
        // Define FLIPPER_VERSION
        './plugins/withGradleProperties.js',
        // These should come last
        './plugins/withRemoveXcodeLocalEnv.js',
        ['./plugins/withEnvFile.js', { buildType }],
        // This plugin must be removed once we use EAS
        './plugins/withAndroidSigningConfig.js',
    ],
});
