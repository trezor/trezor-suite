import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-shadow': 'off', // Todo: shall be fixed
            'import/no-default-export': 'off', // Todo: shall be solved one day, usually its legacy Components
        },
    },
];
