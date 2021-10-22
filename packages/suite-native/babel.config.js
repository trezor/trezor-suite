module.exports = api => {
    api.cache(false);
    return {
        presets: ['module:metro-react-native-babel-preset'],
        plugins: [
            [
                'module-resolver',
                {
                    alias: {
                        'node-fetch': 'whatwg-fetch',

                        // === Custom overrides ===

                        // web and desktop use next.js router
                        '@suite-actions/routerActions':
                            './packages/suite-native/src/actions/suite/routerActions',
                        // unlike on web, messages and locales are bundled with application and might be simply required
                        '@suite-actions/languageActions':
                            './packages/suite-native/src/actions/suite/languageActions',
                        '@suite-hooks/useLocales':
                            './packages/suite-native/src/hooks/suite/useLocales',

                        // react-native env utils
                        '^@suite-utils/env': './packages/suite-native/src/utils/suite/env',

                        // relative to "projectRoot: ../../" defined in package.json
                        '^@suite/(.+)': './packages/suite/src/\\1',

                        // === Views - no reuse at all ===
                        // exclude .messages.*
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-views/(?!.*[.]messages)(.+)':
                            './packages/suite-native/src/views/\\1/\\2',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-views$':
                            './packages/suite-native/src/views/\\1/index',

                        '^@native/(.+)': './packages/suite-native/src/\\1',
                        '^@native-components/(.+)': './packages/suite-native/src/components/\\1',

                        // === Standard resolvers ===
                        // to find something.messages from suite core
                        // '^@(.+)-views/(.+)': './packages/suite/src/views/\\1/\\2',
                        // '^@(.+)-components/(.+)': './packages/suite/src/components/\\1/\\2',

                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-components/(.+)':
                            './packages/suite/src/components/\\1/\\2',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-components':
                            './packages/suite/src/components/\\1/index',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-support/(.+)':
                            '../../packages/suite/src/support/\\1/\\2',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-support':
                            '../../packages/suite/src/support/\\1/index',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-actions/(.+)':
                            './packages/suite/src/actions/\\1/\\2',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-actions':
                            './packages/suite/src/actions/\\1/index',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-reducers/(.+)':
                            './packages/suite/src/reducers/\\1/\\2',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-reducers':
                            './packages/suite/src/reducers/\\1/index',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-config/(.+)':
                            './packages/suite/src/config/\\1/\\2',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-config':
                            './packages/suite/src/config/\\1/index',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-constants/(.+)':
                            './packages/suite/src/constants/\\1/\\2',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-constants':
                            './packages/suite/src/constants/\\1/index',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-utils/(.+)':
                            './packages/suite/src/utils/\\1/\\2',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-utils':
                            './packages/suite/src/utils/\\1/index',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-types/(.+)':
                            './packages/suite/src/types/\\1/\\2',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-types':
                            './packages/suite/src/types/\\1/index',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-middlewares/(.+)':
                            './packages/suite/src/middlewares/\\1/\\2',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-middlewares':
                            './packages/suite/src/middlewares/\\1/index',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-services/(.+)':
                            './packages/suite/src/services/\\1/\\2',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-services':
                            './packages/suite/src/services/\\1/index',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-hooks/(.+)':
                            './packages/suite/src/hooks/\\1/\\2',
                        '^@(suite|dashboard|onboarding|wallet|passwords|exchange|settings|firmware|backup|recovery)-hooks':
                            './packages/suite/src/hooks/\\1/index',

                        // ??????
                        '^@trezor/components$': './packages/components',
                        '^@trezor/suite-data$': './packages/suite-data',
                        '^@trezor/blockchain-link$': './packages/blockchain-link', // maybe not necessary, since blockchain-link is declared as extra node_modules in metro.config.js
                    },
                },
            ],
        ],
    };
};
