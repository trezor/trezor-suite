import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-shadow': 'off', // Todo: shall be fixed
            'no-restricted-syntax': 'off', // Todo: this should be fixed in codebase and this line removed
            'import/no-default-export': 'off', // Todo: shall be solved one day, usually its legacy Components
        },
    },
];
