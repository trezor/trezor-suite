import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-bitwise': 'off', // airbnb-base: used in hardending
            'no-underscore-dangle': 'off', // underscore is used
            camelcase: 'off', // camelcase is used
            'no-console': 'warn',
            'no-await-in-loop': 'off', // used in legacy trezor-connect codebase
            'jest/no-standalone-expect': [
                'error',
                { additionalTestBlockFunctions: ['conditionalTest'] },
            ],
            'import/no-default-export': 'off', // Todo: shall be solved one day, but now its heavily used
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
                        '**/exports',
                    ],
                },
            ],
        },
    },
];
