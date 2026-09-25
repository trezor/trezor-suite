import { allowDevDependenciesIn, eslint } from '@trezor/eslint';

export default [
    {
        ignores: ['src/definitions/*_pb.js'],
    },
    ...eslint,
    allowDevDependenciesIn(['**/scripts/**']),
];
