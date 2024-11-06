import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['files/**/*'],
    },
    {
        rules: {
            'no-console': 'off',
        },
    },
];
