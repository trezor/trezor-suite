/* eslint-disable import/no-default-export */
/* eslint-disable import/no-anonymous-default-export */
import { ExpoConfig, ConfigContext } from 'expo/config';

import { suiteNativeVersion } from './package.json';

type BuildType = 'debug' | 'develop' | 'production';

const bundleIdentifiers = {
    debug: 'io.trezor.suite.debug',
    develop: 'io.trezor.suite.develop',
    production: 'io.trezor.suite',
} as const satisfies Record<BuildType, string>;

const appIconsIos = {
    debug: './assets/debug/appIcon.png',
    develop: './assets/develop/appIcon.png',
    production: './assets/production/appIcon.png',
} as const satisfies Record<BuildType, string>;

const appIconsAndroid = {
    debug: {
        backgroundColor: '#2587A5',
    },
    develop: {
        backgroundColor: '#900B0B',
    },
    production: {
        backgroundColor: '#0F6148',
    },
} as const;

const appNames = {
    debug: 'Trezor Suite Debug',
    develop: 'Trezor Suite Develop',
    production: 'Trezor Suite',
} as const satisfies Record<BuildType, string>;

const projectIds = {
    develop: '3e4ea82b-6c9f-4cd3-8975-54bddda3ec2d',
    production: 'b9bbf16c-3d44-4d58-8f0c-ba9e6265276a',
    debug: '',
} as const satisfies Record<BuildType, string>;

export default ({ config }: ConfigContext): ExpoConfig => {
    const buildType = (process.env.ENVIRONMENT_EXPO as BuildType) ?? 'debug';
    const name = appNames[buildType];
    const slug = appNames[buildType].toLowerCase().split(' ').join('-');
    const bundleIdentifier = bundleIdentifiers[buildType];
    const projectId = projectIds[buildType];
    const appIconIos = appIconsIos[buildType];
    const appIconAndroid = appIconsAndroid[buildType];

    if (!process.env.SENTRY_AUTH_TOKEN && buildType !== 'debug') {
        throw new Error('Missing SENTRY_AUTH_TOKEN env variable');
    }

    return {
        ...config,
        name,
        slug,
        version: suiteNativeVersion,
        splash: {
            image: './assets/splash_icon.png',
            backgroundColor: '#25292E',
            resizeMode: 'contain',
        },
        android: {
            package: bundleIdentifier,
            adaptiveIcon: {
                foregroundImage: './assets/appIcon_android.png',
                monochromeImage: './assets/appIcon_android.png',
                ...appIconAndroid,
            },
        },
        ios: {
            bundleIdentifier,
            icon: appIconIos,
            infoPlist: {
                NSCameraUsageDescription:
                    '$(PRODUCT_NAME) needs access to your Camera to scan your XPUB.',
                NSFaceIDUsageDescription:
                    '$(PRODUCT_NAME) needs Face ID and Touch ID to keep sensitive data about your portfolio private.',
                NSMicrophoneUsageDescription: 'This app does not require access to the microphone.',
                ITSAppUsesNonExemptEncryption: false,
                UISupportedInterfaceOrientations: [
                    'UIInterfaceOrientationPortrait',
                    'UIInterfaceOrientationPortraitUpsideDown',
                ],
                NSAppTransportSecurity: {
                    NSAllowsArbitraryLoads: true,
                    NSExceptionDomains: {
                        localhost: {
                            NSExceptionAllowsInsecureHTTPLoads: true,
                        },
                        'data.trezor.io': {
                            NSExceptionAllowsInsecureHTTPLoads: true,
                            NSIncludesSubdomains: true,
                        },
                    },
                },
            },
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
                    cameraPermission:
                        'Allow $(PRODUCT_NAME) to access camera for QR code scanning.',
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
                        flipper: 'true',
                    },
                },
            ],
            '@trezor/react-native-usb/plugins/withUSBDevice.js',
            // Define FLIPPER_VERSION
            './plugins/withGradleProperties.js',
            // These should come last
            './plugins/withRemoveXcodeLocalEnv.js',
            ['./plugins/withEnvFile.js', { buildType }],
        ],
        extra: {
            commitHash: process.env.EAS_BUILD_GIT_COMMIT_HASH?.substring(-6) || '',
            eas: {
                projectId,
            },
        },
        owner: 'trezorcompany',
    };
};
