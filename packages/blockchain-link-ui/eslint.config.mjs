import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'import/no-default-export': 'off',
            '@typescript-eslint/no-shadow': 'off',
        },
    },
    {
        files: ['webpack/*.js'],
        rules: {
            'import/no-extraneous-dependencies': 'off',
        },
    },
];
