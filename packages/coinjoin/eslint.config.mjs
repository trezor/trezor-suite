import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-bitwise': 'off',
            'no-console': 'warn',
        },
    },
];
