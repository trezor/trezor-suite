const path = require('path');

jest.mock('@rozenite/metro', () => ({
    withRozenite: config => config,
}));

jest.mock('@sentry/react-native/metro', () => ({
    getSentryExpoConfig: () => ({
        resolver: { sourceExts: [] },
    }),
}));

jest.mock('@storybook/react-native/metro/withStorybook', () => ({
    withStorybook: jest.fn(config => config),
}));

jest.mock('metro-config', () => ({
    mergeConfig: (_, config) => config,
}));

const config = require('../metro.config');

const resolveCryptoFrom = (...originModulePathSegments) => {
    const context = {
        originModulePath: path.join(path.sep, 'workspace', ...originModulePathSegments),
        resolveRequest: jest.fn((_, moduleName) => ({
            filePath: moduleName,
            type: 'sourceFile',
        })),
    };

    return config.resolver.resolveRequest(context, 'crypto', 'android');
};

describe('Metro crypto resolution', () => {
    it('uses react-native-quick-crypto for jwa', () => {
        expect(resolveCryptoFrom('node_modules', 'jwa', 'index.js').filePath).toBe(
            'react-native-quick-crypto',
        );
    });

    it('keeps the default crypto resolution for other packages', () => {
        expect(resolveCryptoFrom('node_modules', 'jws', 'lib', 'verify-stream.js').filePath).toBe(
            'crypto',
        );
        expect(resolveCryptoFrom('node_modules', 'jwa-extra', 'index.js').filePath).toBe('crypto');
        expect(resolveCryptoFrom('packages', 'protocol', 'src', 'tools.ts').filePath).toBe(
            'crypto',
        );
    });
});

describe('Detox Storybook resolution', () => {
    const originalDetoxBuild = process.env.EXPO_PUBLIC_IS_DETOX_BUILD;
    const originalEnvironment = process.env.EXPO_PUBLIC_ENVIRONMENT;

    afterEach(() => {
        if (originalDetoxBuild === undefined) {
            delete process.env.EXPO_PUBLIC_IS_DETOX_BUILD;
        } else {
            process.env.EXPO_PUBLIC_IS_DETOX_BUILD = originalDetoxBuild;
        }

        if (originalEnvironment === undefined) {
            delete process.env.EXPO_PUBLIC_ENVIRONMENT;
        } else {
            process.env.EXPO_PUBLIC_ENVIRONMENT = originalEnvironment;
        }
    });

    it('disables Storybook and resolves its app import to a stub', () => {
        process.env.EXPO_PUBLIC_IS_DETOX_BUILD = 'true';
        process.env.EXPO_PUBLIC_ENVIRONMENT = 'debug';

        jest.isolateModules(() => {
            const detoxConfig = require('../metro.config');
            const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
            const context = {
                originModulePath: path.join(path.sep, 'workspace', 'app', 'index.js'),
                resolveRequest: jest.fn((_, moduleName) => ({
                    filePath: moduleName,
                    type: 'sourceFile',
                })),
            };

            expect(withStorybook).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ enabled: false }),
            );
            expect(
                detoxConfig.resolver.resolveRequest(context, '@suite-native/storybook', 'android')
                    .filePath,
            ).toMatch(/e2e\/mocks\/storybook\.js$/);
        });
    });
});
