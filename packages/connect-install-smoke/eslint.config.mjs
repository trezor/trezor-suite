import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['fixtures/**'],
    },
    {
        rules: {
            'no-console': 'off',
        },
    },
];
