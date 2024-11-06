import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['**/__snapshots__/**/*'],
    },
    {
        rules: {
            'no-console': 'warn',
        },
    },
];
