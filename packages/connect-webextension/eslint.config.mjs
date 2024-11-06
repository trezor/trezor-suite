import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-underscore-dangle': 'off', // underscore is used
        },
    },
];
