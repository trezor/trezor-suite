module.exports = {
    env: {
        production: {
            plugins: ['transform-remove-console', '@babel/plugin-proposal-export-namespace-from'],
        },
    },
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
        ['@babel/plugin-proposal-decorators', { version: '2023-05' }],
        ['@babel/plugin-transform-class-static-block'],
        '@babel/plugin-proposal-export-namespace-from',
        // react-native-reanimated plugin has to be listed last
        ['react-native-reanimated/plugin', { globals: ['__scanCodes'] }],
    ],
};
