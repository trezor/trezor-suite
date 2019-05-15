module.exports = api => {
    api.cache(true);
    const presets = [
        [
            '@babel/preset-env',
            {
                useBuiltIns: false,
                loose: true,
            },
        ],
        '@babel/preset-react',
        '@babel/preset-typescript',
    ];

    const plugins = [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
        'babel-plugin-styled-components',
        [
            '@babel/plugin-transform-runtime',
            {
                regenerator: true,
            },
        ],
        [
            'module-resolver',
            {
                extensions: [
                    '.js',
                    '.jsx',
                    '.ts',
                    '.tsx',
                    '.android.js',
                    '.android.tsx',
                    '.ios.js',
                    '.ios.tsx',
                ],
                root: ['./src'],
            },
        ],
    ];

    return {
        presets,
        plugins,
    };
};
