module.exports = api => {
    // api.cache(true);

    const plugins = [
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
    ];

    if (api.env('translations')) {
        plugins.push([
            'react-intl',
            {
                messagesDir: './translations/extractedMessages/',
                extractSourceLocation: true,
            },
        ]);
    }

    return {
        presets: ['next/babel', '@zeit/next-typescript/babel'],
        plugins,
    };
};
