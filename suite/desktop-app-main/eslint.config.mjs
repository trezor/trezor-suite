import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [
                        ...globalNoExtraneousDependenciesDevDependencies,
                        '**/webpack/**',
                        '**/src/**', // Todo: reconsider, this whole package is probably just "dev"
                        '**/scripts/**', // Todo: reconsider, this whole package is probably just "dev"
                    ],
                },
            ],
        },
    },
];
