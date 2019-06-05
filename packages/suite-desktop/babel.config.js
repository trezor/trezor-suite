module.exports = api => {
    api.cache(true);
    return {
        presets: ['next/babel', '@zeit/next-typescript/babel'],
        plugins: [
            [
                'module-resolver',
                {
                    alias: {
                        '^@suite/actions/(.+).useNative$': './src/actions/\\1', // every action file in suite/actions with .useNative extension will be replaced by a file in suite-native/actions directory
                        '^react-native$': 'react-native-web',
                        '^@suite/(.+)': '../../packages/suite/src/\\1', // relative to this project
                    },
                },
            ],
        ],
    };
};
