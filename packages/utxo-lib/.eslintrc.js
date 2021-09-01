module.exports = {
    extends: '../../.eslintrc.js',
    parserOptions: {
        project: './tsconfig.json',
    },
    rules: {
        'no-bitwise': 'off', // airbnb-base: used in hardending
    },
};
