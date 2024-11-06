import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-nested-ternary': 'off', // useful in tests...
            'no-console': 'off',
        },
    },
];
