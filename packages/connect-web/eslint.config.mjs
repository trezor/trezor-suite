import {
    eslint,
    globalNoExtraneousDependenciesDevDependencies,
    playwrightEslint,
} from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-underscore-dangle': 'off', // underscore is used
            camelcase: 'off', // camelcase is used
            'jest/valid-expect': 'off', // because of playwright tests
            'import/no-default-export': 'off', // Todo: shall be fixed
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [
                        ...globalNoExtraneousDependenciesDevDependencies,
                        '**/webpack/**',
                    ],
                },
            ],
        },
    },
    playwrightEslint,
];
