module.exports = {
    presets: [
        '@babel/preset-env',
    ],
    plugins: [
        ['module-resolver', {
            root: ['./src'],
        }],
    ],
};
