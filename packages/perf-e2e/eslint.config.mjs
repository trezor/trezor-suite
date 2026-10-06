import { allowDevDependenciesIn, eslint } from '@trezor/eslint';

// The whole package is a private test suite, so every file may use devDependencies.
export default [...eslint, allowDevDependenciesIn(['**'])];
