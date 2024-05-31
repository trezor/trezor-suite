jest.mock('expo-localization', () => {
    const Localization = {
        getLocales: () => [
            {
                languageTag: 'pl-PL',
                languageCode: 'pl',
                textDirection: 'ltr',
                digitGroupingSeparator: ' ',
                decimalSeparator: ',',
                measurementSystem: 'metric',
                currencyCode: 'PLN',
                currencySymbol: 'zł',
                regionCode: 'PL',
                temperatureUnit: 'celsius',
            },
        ],
    };

    return Localization;
});

jest.mock('expo-constants', () => {
    const Constants = {
        AppOwnership: {
            Expo: 'expo',
        },
        ExecutionEnvironment: {
            Bare: 'bare',
            Standalone: 'standalone',
            StoreClient: 'storeClient',
        },
        UserInterfaceIdiom: {
            Handset: 'handset',
            Tablet: 'tablet',
            Desktop: 'desktop',
            TV: 'tv',
            Unsupported: 'unsupported',
        },
        default: {
            sessionId: '6DBC68D3-4E59-4B4D-9B1F-067947CA4956',
            debugMode: true,
            statusBarHeight: 54,
            platform: {
                ios: {
                    buildNumber: '1',
                },
            },
            executionEnvironment: 'bare',
            deviceName: 'iPhone 14 Pro',
            manifest: null,
            systemFonts: [],
            isHeadless: false,
            appOwnership: null,
            manifest2: {
                assets: [],
                createdAt: '2024-05-31T09:17:29.550Z',
                metadata: {},
                runtimeVersion: 'exposdk:51.0.0',
                id: '907c2109-b4f8-4683-8a69-5f4e00408969',
                launchAsset: {
                    key: 'bundle',
                    contentType: 'application/javascript',
                    url: 'http://127.0.0.1:8081/index.bundle?platform=ios&dev=true&hot=false&transform.engine=hermes&transform.bytecode=true&transform.routerRoot=app',
                },
                extra: {
                    eas: {
                        projectId: '',
                    },
                    scopeKey: '@anonymous/trezor-suite-debug-ed3e86b2-17a1-43f5-8f9d-1bea5bfc9120',
                    expoClient: {
                        extra: {
                            eas: {
                                projectId: '',
                            },
                            commitHash: '',
                            isDetoxTestBuild: false,
                        },
                        orientation: 'portrait',
                        version: '24.6.0',
                        userInterfaceStyle: 'automatic',
                        _internal: {
                            packageJsonPath:
                                '/Users/danielsuchy/javascript/trezor-suite/suite-native/app/package.json',
                            projectRoot:
                                '/Users/danielsuchy/javascript/trezor-suite/suite-native/app',
                            staticConfigPath: {},
                            pluginHistory: {
                                detox: {
                                    name: 'detox',
                                    version: '20.18.4',
                                },
                                'expo-font': {
                                    name: 'expo-font',
                                    version: '12.0.6',
                                },
                                'expo-barcode-scanner': {
                                    name: 'expo-barcode-scanner',
                                    version: '13.0.1',
                                },
                            },
                            isDebug: false,
                            dynamicConfigPath:
                                '/Users/danielsuchy/javascript/trezor-suite/suite-native/app/app.config.ts',
                        },
                        owner: 'trezorcompany',
                        ios: {
                            infoPlist: {
                                UIRequiredDeviceCapabilities: ['armv7'],
                                NSCameraUsageDescription:
                                    '$(PRODUCT_NAME) needs access to your Camera to scan your XPUB.',
                                ITSAppUsesNonExemptEncryption: false,
                                NSMicrophoneUsageDescription:
                                    'This app does not require access to the microphone.',
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
                                NSFaceIDUsageDescription:
                                    '$(PRODUCT_NAME) needs Face ID and Touch ID to keep sensitive data about your portfolio private.',
                            },
                            icon: './assets/debug/appIcon.png',
                            supportsTablet: true,
                            iconUrl: 'http://127.0.0.1:8081/assets/./assets/debug/appIcon.png',
                            bundleIdentifier: 'io.trezor.suite.debug',
                        },
                        hostUri: '127.0.0.1:8081',
                        android: {
                            package: 'io.trezor.suite.debug',
                            permissions: ['android.permission.CAMERA'],
                            adaptiveIcon: {
                                monochromeImageUrl:
                                    'http://127.0.0.1:8081/assets/./assets/appIcon_android.png',
                                backgroundColor: '#2587A5',
                                monochromeImage: './assets/appIcon_android.png',
                                foregroundImage: './assets/appIcon_android.png',
                                foregroundImageUrl:
                                    'http://127.0.0.1:8081/assets/./assets/appIcon_android.png',
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
                                    },
                                },
                            ],
                            '@trezor/react-native-usb/plugins/withUSBDevice.js',
                            [
                                './plugins/withAndroidMainActivityAttributes.js',
                                {
                                    'android:allowBackup': false,
                                },
                            ],
                            './plugins/withGradleProperties.js',
                            [
                                '@config-plugins/detox',
                                {
                                    subdomains: '*',
                                },
                            ],
                            './plugins/withRemoveXcodeLocalEnv.js',
                            [
                                './plugins/withEnvFile.js',
                                {
                                    buildType: 'debug',
                                },
                            ],
                            './plugins/withRemoveiOSNotificationEntitlement.js',
                        ],
                        slug: 'trezor-suite-debug',
                        splash: {
                            resizeMode: 'contain',
                            backgroundColor: '#25292E',
                            image: './assets/splash_icon.png',
                            imageUrl: 'http://127.0.0.1:8081/assets/./assets/splash_icon.png',
                        },
                        platforms: ['ios', 'android'],
                        sdkVersion: '51.0.0',
                        name: 'Trezor Suite Lite Debug',
                    },
                    expoGo: {
                        developer: {
                            projectRoot:
                                '/Users/danielsuchy/javascript/trezor-suite/suite-native/app',
                            tool: 'expo-cli',
                        },
                        __flipperHack: 'React Native packager is running',
                        mainModuleName: 'index',
                        packagerOpts: {
                            dev: true,
                        },
                        debuggerHost: '127.0.0.1:8081',
                    },
                },
            },
            expoConfig: {
                extra: {
                    eas: {
                        projectId: '',
                    },
                    commitHash: '',
                    isDetoxTestBuild: false,
                },
                orientation: 'portrait',
                version: '24.6.0',
                userInterfaceStyle: 'automatic',
                _internal: {
                    packageJsonPath:
                        '/Users/danielsuchy/javascript/trezor-suite/suite-native/app/package.json',
                    projectRoot: '/Users/danielsuchy/javascript/trezor-suite/suite-native/app',
                    staticConfigPath: {},
                    pluginHistory: {
                        detox: {
                            name: 'detox',
                            version: '20.18.4',
                        },
                        'expo-font': {
                            name: 'expo-font',
                            version: '12.0.6',
                        },
                        'expo-barcode-scanner': {
                            name: 'expo-barcode-scanner',
                            version: '13.0.1',
                        },
                    },
                    isDebug: false,
                    dynamicConfigPath:
                        '/Users/danielsuchy/javascript/trezor-suite/suite-native/app/app.config.ts',
                },
                owner: 'trezorcompany',
                ios: {
                    infoPlist: {
                        UIRequiredDeviceCapabilities: ['armv7'],
                        NSCameraUsageDescription:
                            '$(PRODUCT_NAME) needs access to your Camera to scan your XPUB.',
                        ITSAppUsesNonExemptEncryption: false,
                        NSMicrophoneUsageDescription:
                            'This app does not require access to the microphone.',
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
                        NSFaceIDUsageDescription:
                            '$(PRODUCT_NAME) needs Face ID and Touch ID to keep sensitive data about your portfolio private.',
                    },
                    icon: './assets/debug/appIcon.png',
                    supportsTablet: true,
                    iconUrl: 'http://127.0.0.1:8081/assets/./assets/debug/appIcon.png',
                    bundleIdentifier: 'io.trezor.suite.debug',
                },
                hostUri: '127.0.0.1:8081',
                android: {
                    package: 'io.trezor.suite.debug',
                    permissions: ['android.permission.CAMERA'],
                    adaptiveIcon: {
                        monochromeImageUrl:
                            'http://127.0.0.1:8081/assets/./assets/appIcon_android.png',
                        backgroundColor: '#2587A5',
                        monochromeImage: './assets/appIcon_android.png',
                        foregroundImage: './assets/appIcon_android.png',
                        foregroundImageUrl:
                            'http://127.0.0.1:8081/assets/./assets/appIcon_android.png',
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
                            },
                        },
                    ],
                    '@trezor/react-native-usb/plugins/withUSBDevice.js',
                    [
                        './plugins/withAndroidMainActivityAttributes.js',
                        {
                            'android:allowBackup': false,
                        },
                    ],
                    './plugins/withGradleProperties.js',
                    [
                        '@config-plugins/detox',
                        {
                            subdomains: '*',
                        },
                    ],
                    './plugins/withRemoveXcodeLocalEnv.js',
                    [
                        './plugins/withEnvFile.js',
                        {
                            buildType: 'debug',
                        },
                    ],
                    './plugins/withRemoveiOSNotificationEntitlement.js',
                ],
                slug: 'trezor-suite-debug',
                splash: {
                    resizeMode: 'contain',
                    backgroundColor: '#25292E',
                    image: './assets/splash_icon.png',
                    imageUrl: 'http://127.0.0.1:8081/assets/./assets/splash_icon.png',
                },
                platforms: ['ios', 'android'],
                sdkVersion: '51.0.0',
                name: 'Trezor Suite Lite Debug',
            },
            expoGoConfig: {
                developer: {
                    projectRoot: '/Users/danielsuchy/javascript/trezor-suite/suite-native/app',
                    tool: 'expo-cli',
                },
                __flipperHack: 'React Native packager is running',
                mainModuleName: 'index',
                packagerOpts: {
                    dev: true,
                },
                debuggerHost: '127.0.0.1:8081',
            },
            easConfig: {
                projectId: '',
            },
        },
    };

    return Constants;
});
