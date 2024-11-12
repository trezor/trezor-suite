import tseslint from 'typescript-eslint';

export const typescriptStrictConfig = [
    ...tseslint.configs.strict,
    {
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    vars: 'all',
                    args: 'none',
                    ignoreRestSiblings: true,
                    varsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/ban-ts-comment': [
                'error',
                {
                    minimumDescriptionLength: 0,
                },
            ],

            // Offs
            '@typescript-eslint/no-non-null-assertion': 'off', // Todo: we are not ready yet
            '@typescript-eslint/no-explicit-any': 'off', // Todo: we are not ready yet
            '@typescript-eslint/no-require-imports': 'off', // We just use require a lot (mostly for dynamic imports)
            '@typescript-eslint/no-invalid-void-type': 'off', // Todo: shall be fixable
            '@typescript-eslint/no-dynamic-delete': 'off', // Todo: reconsider may be fixable
            '@typescript-eslint/triple-slash-reference': 'off', // Todo: https://github.com/trezor/trezor-suite/issues/15310
        },
    },
];
