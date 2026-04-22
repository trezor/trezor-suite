import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: [
            // src/ is still JS (migration to TS in progress); skip linting JS sources.
            'src/**/*.js',
        ],
    },
];
