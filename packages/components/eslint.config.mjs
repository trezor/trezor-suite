import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        files: ['**/*.stories.tsx'],
        rules: {
            'no-console': 'off',
            'import/no-default-export': 'off',
        },
    },
];
