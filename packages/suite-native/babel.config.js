module.exports = api => {
    api.cache(true);
    return {
        presets: ['module:metro-react-native-babel-preset'],
        plugins: [
            [
                'module-resolver',
                {
                    alias: {
                        '^@suite/actions/RouterActions$':
                            './packages/suite-native/src/actions/RouterActions',
                        '^@suite/(.+)': './packages/suite/src/\\1', // relative to "projectRoot: ../../" defined in package.json
                        'node-fetch': 'whatwg-fetch',
                    },
                },
            ],
        ],
    };
};
