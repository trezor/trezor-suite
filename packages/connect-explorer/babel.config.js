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
        '@babel/typescript',
    ];

    const plugins = ['react-hot-loader/babel'];

    if (process.env.LOCAL) {
        plugins.shift();
    }

    return {
        presets,
        plugins,
    };
};
