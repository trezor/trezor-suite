import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

export default [
    ...eslint,
    { ignores: ['**/.build-storybook/*'] },
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
    {
        rules: {
            '@typescript-eslint/no-restricted-imports': [
                'error',
                {
                    paths: [{ name: '.' }, { name: '..' }, { name: '../..' }],
                    patterns: [
                        '@trezor/*/lib',
                        '@trezor/*/lib/**',
                        '@trezor/*/libDev',
                        '@trezor/*/libDev/**',
                        '@suite-common/**',
                        '@suite-native/**',
                    ],
                },
            ],
        },
    },
];
