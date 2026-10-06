import { allowDevDependenciesIn, eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['files/**/*'],
    },
    {
        rules: {
            'no-console': 'off',
        },
    },
    allowDevDependenciesIn([
        '**/postcss.config.js',
        '**/src/**', // Todo: reconsider, this whole package is probably just "dev"
    ]),
];
