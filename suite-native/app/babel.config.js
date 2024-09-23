module.exports = function (api) {
    api.cache(true);

    return {
        env: {
            production: {
                plugins: ['transform-remove-console'],
            },
        },
        presets: ['babel-preset-expo'],
        plugins: [
            ['@babel/plugin-transform-class-static-block'],
            // react-native-reanimated plugin has to be listed last
            ['react-native-reanimated/plugin', { globals: ['__scanCodes'] }],
        ],
    };
};
