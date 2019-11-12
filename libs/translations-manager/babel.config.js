module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: '8.6.0',
                },
            },
        ],
    ],
    plugins: [
        ['module-resolver', {
            root: ['./src'],
        }],
    ],
};
