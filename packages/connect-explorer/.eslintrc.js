module.exports = {
    rules: {
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'import/no-default-export': 'off',
        '@typescript-eslint/no-restricted-imports': 'off',
        '@typescript-eslint/no-shadow': 'off',
        'no-console': 'off',
        'no-restricted-syntax': 'off',
        'react/jsx-filename-extension': [
            'error',
            {
                extensions: ['.tsx', '.mdx'],
            },
        ],
        'local-rules/no-override-ds-component': 'off', // To not show errors in *.mdx example files
    },
    extends: ['plugin:mdx/recommended'],
};
