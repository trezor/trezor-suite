import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'import/no-default-export': 'off', // Todo: fix and solve
        },
    },
];
