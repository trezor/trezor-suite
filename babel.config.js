module.exports = {
    presets: [
        '@babel/preset-env',
        'stage-0'
    ],
    plugins: [
        ['module-resolver', {
            root: ['./src'],
        }],
    ],
};