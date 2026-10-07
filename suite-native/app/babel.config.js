module.exports = function (api) {
    // Part of the cache key rather than `api.cache(true)`: that would freeze the first answer and
    // hand it to every later worker, test build or not.
    const isDetoxBuild = api.cache.using(() => process.env.EXPO_PUBLIC_IS_DETOX_BUILD === 'true');

    return {
        env: {
            production: {
                // A Detox build keeps its console. The screen performance instrumentation writes
                // each sample as one console.log line, and the device log is the only channel
                // Detox gives the test, so stripping it leaves a run with logs and no samples.
                // The bundle is always built with `--dev false`, which babel resolves as the
                // production env whatever NODE_ENV says — without this a test build is stripped
                // like any release.
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
