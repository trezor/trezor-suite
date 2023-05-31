module.exports = {
    rules: {
        // todo: remove when refactoring transport layer.
        'no-underscore-dangle': 'off',
        'no-restricted-syntax': 'off',
        'no-await-in-loop': 'off',
        '@typescript-eslint/ban-types': 'off', // still one file that needs refactoring
        'react-hooks/rules-of-hooks': 'off', // there is no react here
    },
};
