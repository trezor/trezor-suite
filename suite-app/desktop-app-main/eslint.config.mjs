import { allowDevDependenciesIn, eslint } from '@trezor/eslint';

export default [
    ...eslint,
    allowDevDependenciesIn([
        '**/webpack/**',
        '**/src/**', // Todo: reconsider, this whole package is probably just "dev"
        '**/scripts/**', // Todo: reconsider, this whole package is probably just "dev"
    ]),
];
