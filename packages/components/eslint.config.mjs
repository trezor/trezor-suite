import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

export default [
    ...eslint,
    {
        files: ['**/*.stories.tsx'],
        rules: {
            'no-console': 'off',
            'import/no-default-export': 'off',
        },
    },
    {
        rules: {
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [
                        ...globalNoExtraneousDependenciesDevDependencies,
                        '**/*.stories.*',
                        '**/.storybook/**',
                    ],
                },
            ],
        },
    },
];
