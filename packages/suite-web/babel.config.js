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
                        '^@suite/(.+)': '../../packages/suite/src/\\1', // relative to this project
                    },
                },
            ],
            [
                'styled-components',
                {
                    ssr: true,
                    displayName: true,
                    preprocess: false,
                },
            ],
        ],
    };
};
