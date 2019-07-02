module.exports = api => {
    const presets = [
        [
            '@babel/preset-env',
            {
                useBuiltIns: false,
                loose: true,
            },
        ],
        '@babel/preset-typescript',
    ];

    const plugins = [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
        [
            '@babel/plugin-transform-runtime',
            {
                regenerator: true,
            },
        ],
    ];

    if (api.env('test')) {
        // api.cache(true);
        presets.push('jest');
    }

    return {
        presets,
        plugins,
        sourceType: 'unambiguous',
    };
};
