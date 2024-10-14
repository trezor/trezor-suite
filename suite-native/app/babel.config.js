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
            '@babel/plugin-syntax-import-attributes',
            // For Kysely to work with Hermes
            ['@babel/plugin-transform-private-methods', { loose: true }],
            // For Kysely to work with Hermes
            '@babel/plugin-transform-dynamic-import',
            [
                'module-resolver',
                {
                    alias: {
                        crypto: 'crypto-browserify',
                        vm: 'vm-browserify',
                    },
                },
            ],
            // ['@babel/plugin-transform-private-methods', { loose: true }],
            // ['@babel/plugin-transform-modules-commonjs', { loose: true }],
        ],
    };
};
