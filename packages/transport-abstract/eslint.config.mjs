import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-shadow': 'off', // Todo: shall be fixed
        },
    },
];
