import { allowDevDependenciesIn, eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-console': 'off',
        },
    },
    allowDevDependenciesIn([
        '**/src/**', // Examples are just for development
        '**/webpack.config.js',
    ]),
];
