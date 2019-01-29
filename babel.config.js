module.exports = {
    presets: [
        '@babel/preset-env',
        'babel-preset-stage-0',
        'babel-preset-es2015'
    ],
    plugins: [
        ['module-resolver', {
            root: ['./src'],
        }],
    ],
};