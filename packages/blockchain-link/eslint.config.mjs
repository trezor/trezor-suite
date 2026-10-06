import { allowDevDependenciesIn, eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            camelcase: 'off',
            'no-underscore-dangle': 'off',
            'no-console': 'warn',
            'import/no-default-export': 'off',
            '@typescript-eslint/no-shadow': 'off', // Todo: shall be fixed
        },
    },
    allowDevDependenciesIn(['**/tests/**', '**/webpack/**']),
];
