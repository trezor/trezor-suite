import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-shadow': 'off', // Todo: shall be fixed
            'import/no-default-export': 'off', // in scripts this is OK, some of them are expected to work that way
            'import/no-extraneous-dependencies': ['error', { devDependencies: ['**'] }],
        },
    },
];
