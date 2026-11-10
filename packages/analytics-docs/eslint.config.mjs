import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        // The package documents the Suite analytics events, so it reads them from @suite-common/analytics.
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
                    ],
                },
            ],
        },
    },
];
