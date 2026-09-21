import { allowDevDependenciesIn, eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['**/build-electron/*'],
    },
    allowDevDependenciesIn(['**/src/**']),
];
