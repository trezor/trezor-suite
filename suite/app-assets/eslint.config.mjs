import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['files/**/*'],
    },
    {
        rules: {
            'no-console': 'off',
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [
                        ...globalNoExtraneousDependenciesDevDependencies,
                        '**/postcss.config.js',
                        '**/src/**', // Todo: reconsider, this whole package is probably just "dev"
                    ],
                },
            ],
        },
    },
];
