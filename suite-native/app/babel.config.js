module.exports = function (api) {
    // In the cache key: `api.cache(true)` would reuse the first answer for every build.
    const isDetoxBuild = api.cache.using(() => process.env.EXPO_PUBLIC_IS_DETOX_BUILD === 'true');

    return {
        env: {
            production: {
                // Detox builds (always `--dev false`, so production env) keep console.log: the
                // screen performance samples reach the test only through the device log.
                plugins: isDetoxBuild ? [] : [['transform-remove-console', { exclude: ['error'] }]],
            },
        },
        presets: [['babel-preset-expo', { transformImportMeta: true }]],
        plugins: [
            ['@babel/plugin-transform-class-static-block'],
            ['inline-import', { extensions: ['.md'] }],
            // react-native-reanimated plugin has to be listed last
            ['react-native-worklets/plugin', { globals: ['__scanCodes'] }],
        ],
    };
};
