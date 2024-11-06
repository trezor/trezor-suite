import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'jest/valid-expect': 'off', // because of cypress tests
            'import/no-default-export': 'off', // Todo: fix and solve
            'no-console': 'off', // It's used in cypress tests
        },
    },
];
