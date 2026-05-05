/* eslint-disable require-await */

const { withRozenite } = require('@rozenite/metro');
const { withRozeniteReduxDevTools } = require('@rozenite/redux-devtools-plugin/metro');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
const { mergeConfig } = require('metro-config');
const path = require('path');

const { metroSecureResolver } = require('@trezor/bundler-security/src/metroSecureResolver');

// Metro recursively follows nested node_modules symlinks and gets stuck
// We need to ignore nested monorepo dependencies
const monorepoRoot = path.resolve(__dirname, '../..');
const escRoot = monorepoRoot.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
const NESTED_WORKSPACE_NM = new RegExp(
    `^${escRoot}/(?!suite-native/app/).+/node_modules/(?:@suite-native|@suite-common|@trezor)/`,
);

// Learn more https://docs.expo.io/guides/customizing-metro

const jsonExpoConfig = getSentryExpoConfig(__dirname);
const defaultSourceExts = jsonExpoConfig.resolver.sourceExts;
const additionalSourceExts = process.env.RN_SRC_EXT ? process.env.RN_SRC_EXT.split(',') : [];
const sourceExts = [...additionalSourceExts, ...defaultSourceExts];

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    transformer: {
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: true,
            },
        }),
    },
    resolver: {
        unstable_enablePackageExports: false,
        blockList: [/libDev/, NESTED_WORKSPACE_NM],
        extraNodeModules: {
            // modules needed for trezor-connect
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            https: require.resolve('https-browserify'),
            http: require.resolve('stream-http'),
            zlib: require.resolve('browserify-zlib'),
            vm: require.resolve('vm-browserify'),
            // modules needed by ElectrumWorker
            net: require.resolve('react-native-tcp-socket'),
            tls: require.resolve('react-native-tcp-socket'),
        },
        sourceExts,
        resolveRequest: (context, moduleName, platform) => {
            metroSecureResolver({
                moduleName,
                originModulePath: context.originModulePath,
            });

            const rootNodeModulesPath = context.nodeModulesPaths[1];
            const getSourceFile = filePath => ({
                filePath: require.resolve(filePath),
                type: 'sourceFile',
            });

            const overrides = {
                // TODO: unstable_enablePackageExports: true
                // See: https://github.com/trezor/trezor-suite/issues/20733
                // modules exports defined in the package `exports` map.
                '@bufbuild/protobuf/codegenv2': `${rootNodeModulesPath}/@bufbuild/protobuf/dist/cjs/codegenv2/index.js`,
                '@bufbuild/protobuf/wire': `${rootNodeModulesPath}/@bufbuild/protobuf/dist/cjs/wire/index.js`,
                '@bufbuild/protobuf/wkt': `${rootNodeModulesPath}/@bufbuild/protobuf/dist/cjs/wkt/index.js`,
                '@evolu/react-native': `${rootNodeModulesPath}/@evolu/react-native/dist/src/index.js`,
                '@evolu/react-native/expo-sqlite': `${rootNodeModulesPath}/@evolu/react-native/dist/src/exports/expo-sqlite.js`,
                '@evolu/common': `${rootNodeModulesPath}/@evolu/common/dist/src/index.js`,
                '@evolu/common/evolu': `${rootNodeModulesPath}/@evolu/common/dist/src/Evolu/Internal.js`,
                '@evolu/common/local-first': `${rootNodeModulesPath}/@evolu/common/dist/src/local-first/index.js`,
                '@evolu/common/polyfills': `${rootNodeModulesPath}/@evolu/common/dist/src/Polyfills.js`,
                '@evolu/react-native/polyfills': `${rootNodeModulesPath}/@evolu/react-native/dist/src/Polyfills.js`,
                uuid: `${rootNodeModulesPath}/uuid/dist/index.js`,

                // tiny-secp256k1 used by @trezor/utxo-lib is terribly slow because WASM is not supported.
                // @bitcoinerlab/secp256k1 is approximately 5× faster but requires additional tweaking.
                'tiny-secp256k1': './secp256k1Shim.js',

                // web3-validator package is by default trying to use non-existing minified index file. This fixes that.
                // Can be removed once web3-validator fixup PR is merged: https://github.com/web3/web3.js/pull/7016.
                'web3-validator': `${rootNodeModulesPath}/web3-validator/lib/commonjs/index.js`,
            };

            if (overrides[moduleName]) {
                return getSourceFile(overrides[moduleName]);
            }

            if (moduleName.startsWith('@emurgo/cardano')) {
                // Cardano libs doesn't have main field in package.json which will cause error in metro
                // Also they use WASM which doesn't work in RN so we polyfill it with empty file to build errors
                // In future we will need JS implementation of Cardano libs or C++ implementation
                return getSourceFile('./cardanoPolyfills.js');
            }

            if (process.env.EXPO_PUBLIC_IS_DETOX_BUILD && moduleName === '@trezor/connect') {
                // Mock some Trezor Connect methods to avoid network flakiness during e2e tests.
                return getSourceFile('./e2e/mocks/trezor-connect.js');
            }

            // Optionally, chain to the standard Metro resolver.
            return context.resolveRequest(context, moduleName, platform);
        },
    },
};

const configWithStorybook = mergeConfig(
    jsonExpoConfig,
    withStorybook(config, {
        enabled: process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production',
        configPath: './../storybook/.rnstorybook',
    }),
);

if (
    process.env.EXPO_PUBLIC_IS_DETOX_BUILD !== 'true' &&
    process.env.EXPO_PUBLIC_ENVIRONMENT === 'debug'
) {
    // enable Rozenite plugins only in debug build
    module.exports = withRozenite(configWithStorybook, {
        enhanceMetroConfig: originalConfig => withRozeniteReduxDevTools(originalConfig),
        enabled: true,
    });
} else {
    module.exports = configWithStorybook;
}
