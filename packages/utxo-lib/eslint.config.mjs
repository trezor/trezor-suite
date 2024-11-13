import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-bitwise': 'off', // airbnb-base: used in hardending
            'prefer-object-spread': 'off', // prefer Object.assign
            'no-underscore-dangle': 'off', // underscore is used
            'no-console': 'warn',
            '@typescript-eslint/no-shadow': 'off', // Todo: shall be fixed
        },
    },
];
