module.exports = (api) => {
    api.cache(true);
    const presets = [
        ['@babel/preset-env', {
            useBuiltIns: false,
            loose: true,
        }],
    ];

    const plugins = [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
        ['@babel/plugin-transform-runtime', {
            regenerator: true,
        }],
    ];

    return {
        presets,
        plugins,
    };
};
