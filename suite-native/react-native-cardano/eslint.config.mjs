import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['vendor/**/*'],
    },
];
