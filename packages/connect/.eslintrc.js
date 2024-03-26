module.exports = {
    parserOptions: {
        tsconfigRootDir: __dirname,
    },
    rules: {
        'no-bitwise': 'off', // airbnb-base: used in hardending
        'no-underscore-dangle': 'off', // underscore is used
        camelcase: 'off', // camelcase is used
        'no-console': 'warn',
        'no-await-in-loop': 'off', // used in legacy trezor-connect codebase
    },
};
