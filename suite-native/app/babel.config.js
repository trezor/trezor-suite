// We don't use babel-preset-expo which takes care of including environment variables in the build, so we have to include them manually in babel.config.js.
// This could be removed once we use babel-preset-expo.
const envVarsToInclude = Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC_'));

module.exports = function (api) {
    api.cache(true);

    return {
        env: {
            production: {
                plugins: ['transform-remove-console'],
            },
        },
        // TODO: use babel-presets-expo once @babel/plugin-proposal-decorators is removed from this preset (it conflicts with our settings of this plugin)
        presets: ['module:@react-native/babel-preset'],
        plugins: [
            // @babel/plugin-transform-export-namespace-from could be removed once we use babel-preset-expo ^^
            '@babel/plugin-transform-export-namespace-from',
            ['@babel/plugin-proposal-decorators', { version: '2023-05' }],
            ['@babel/plugin-transform-class-static-block'],
            [
                'transform-inline-environment-variables',
                {
                    include: ['NODE_ENV', ...envVarsToInclude],
                },
            ],
            // react-native-reanimated plugin has to be listed last
            ['react-native-reanimated/plugin', { globals: ['__scanCodes'] }],
        ],
    };
};
