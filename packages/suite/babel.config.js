module.exports = api => {
    // used only for react-intl messages extraction via the babel plugin
    const plugins = [
        [
            'styled-components',
            {
                ssr: true,
                displayName: true,
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
        // transformIgnorePatterns: ['<rootDir>/node_modules/'],
        presets: ['next/babel'],
        plugins,
    };
};
