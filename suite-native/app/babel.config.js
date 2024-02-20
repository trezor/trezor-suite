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
            ['@babel/plugin-proposal-decorators', { version: '2023-05' }],
            ['@babel/plugin-transform-class-static-block'],
            // react-native-reanimated plugin has to be listed last
            ['react-native-reanimated/plugin', { globals: ['__scanCodes'] }],
        ],
    };
};
