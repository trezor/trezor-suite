module.exports = api => {
    // used only for react-intl messages extraction via the babel plugin
    const plugins = [
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
