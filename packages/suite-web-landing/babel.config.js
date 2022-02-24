module.exports = api => {
    // The cache only affects in-memory configuration. If you've restarted the process, it'll always call the function at least once.
    api.cache(true);
    const plugins = [
        [
            'babel-plugin-styled-components',
            {
                ssr: true,
                displayName: true,
                preprocess: false,
            },
        ],
    ];

    return {
        presets: ['next/babel'],
        plugins,
    };
};
