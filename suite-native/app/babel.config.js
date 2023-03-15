module.exports = {
    env: {
        production: {
            plugins: ['transform-remove-console', '@babel/plugin-proposal-export-namespace-from'],
        },
    },
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
        ['react-native-reanimated/plugin', { globals: ['__scanCodes'] }],
        '@babel/plugin-proposal-export-namespace-from',
    ],
};
