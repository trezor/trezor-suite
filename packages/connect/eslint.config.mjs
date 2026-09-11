import { eslint, restrictedImportsPatterns } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'import/no-default-export': 'off', // TrezorConnect is the package's default export
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
            ],
            '@typescript-eslint/no-restricted-imports': [
                'error',
                {
                    paths: [{ name: '.' }, { name: '..' }, { name: '../..' }],
                    patterns: [...restrictedImportsPatterns, { group: ['**/exports'] }],
                },
            ],
        },
    },
];
