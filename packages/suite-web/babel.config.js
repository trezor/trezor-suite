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
                        '^@c/(.+)': '../../packages/components/src/\\1', 
                    },
                },
            ],
        ],
    };
};
