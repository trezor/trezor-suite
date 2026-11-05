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
    withStorybook: config => config,
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
