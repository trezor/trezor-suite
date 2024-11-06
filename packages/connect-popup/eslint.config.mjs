import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-console': 'off',
            'no-restricted-syntax': 'off', // Todo: fix and solve
        },
    },
];
