import { allowTypeOnlyDevDependenciesIn, eslint } from '@trezor/eslint';

export default [
    ...eslint,
    // Connect's published dependency closure is kept deliberately small, so the contracts this
    // package exposes reference sibling packages by type without depending on them at runtime.
    allowTypeOnlyDevDependenciesIn(['**/src/**']),
];
