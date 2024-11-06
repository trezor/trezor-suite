import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-console': 'warn',
        },
    },
];
