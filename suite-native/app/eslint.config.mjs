import { allowDevDependenciesIn, eslint } from '@trezor/eslint';

export default [
    ...eslint,
    allowDevDependenciesIn(['**/metro.config.js', '**/useRozenitePlugins.ts']),
];
