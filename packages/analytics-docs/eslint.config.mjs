import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        files: ['scripts/buildData.ts'],
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
