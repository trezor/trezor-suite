import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['**/build-electron/*', '**/build-renderer/*'],
    },
    {
        rules: {
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [
                        ...globalNoExtraneousDependenciesDevDependencies,
                        '**/src/**',
                        '**/webpack/**',
                    ],
                },
            ],
        },
    },
];
