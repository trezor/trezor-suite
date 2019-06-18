module.exports = api => {
    const plugins = [];
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
