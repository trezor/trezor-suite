import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        files: ['**/e2e/**/*'],
        rules: {
            'no-console': 'off', // used in e2e tests
        },
    },
];
