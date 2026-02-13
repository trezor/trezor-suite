import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-console': 'off',

            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [
                        ...globalNoExtraneousDependenciesDevDependencies,
                        '**/src/**', // Examples are just for development
                        '**/webpack.config.js',
                    ],
                },
            ],
        },
    },
];
