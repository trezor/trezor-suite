import { allowDevDependenciesIn, eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['**/.build-storybook/*'],
    },
    {
        files: ['**/*.stories.tsx'],
        rules: {
            'no-console': 'off',
            'import/no-default-export': 'off',
        },
    },
    allowDevDependenciesIn(['**/*.stories.*', '**/.storybook/**']),
];
