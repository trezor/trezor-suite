module.exports = api => {
    api.cache(true);
    return {
        presets: ['next/babel', '@zeit/next-typescript/babel'],
        plugins: [
            [
                'module-resolver',
                {
                    alias: {
                        '^react-native$': 'react-native-web',
                        '^@suite/(.+)': './src/\\1',
                    },
                },
            ],
        ],
    };
};
