import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'import/no-default-export': 'off',
            '@typescript-eslint/no-shadow': 'off', // Todo: shall be fixed
        },
    },
];
