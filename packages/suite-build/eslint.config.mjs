import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-console': 'off',
            'import/no-default-export': 'off',
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [
                        ...globalNoExtraneousDependenciesDevDependencies,
                        '**/webpack/**',
                        '**/builds/**',
                        '**/configs/**',
                    ],
                },
            ],
        },
    },
];
