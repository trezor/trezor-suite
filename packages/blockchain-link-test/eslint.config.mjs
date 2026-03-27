import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'import/no-default-export': 'off',
            'no-nested-ternary': 'off',
            'no-console': 'off',
        },
    },
];
