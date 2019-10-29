module.exports = api => {
    // used only for react-intl messages extraction via the babel plugin
    const plugins = ['@babel/plugin-syntax-dynamic-import'];

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
        presets: ['@babel/preset-typescript'],
        plugins,
    };
};
