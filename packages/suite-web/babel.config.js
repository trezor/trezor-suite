module.exports = api => {
    // api.cache(true);

    const plugins = [
        [
            'module-resolver',
            {
                alias: {
                    '^react-native$': 'react-native-web',
                    '^@suite/(.+)': '../../packages/suite/src/\\1',
                    '^@suiteComponents/(.+)': '../../packages/suite/src/components/suite/\\1',
                    '^@suiteViews/(.+)': '../../packages/suite/src/views/suite/\\1',
                    '^@walletComponents/(.+)': '../../packages/suite/src/components/wallet/\\1',
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
