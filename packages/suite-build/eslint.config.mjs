import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-console': 'off',
            'import/no-default-export': 'off',
        },
    },
];
