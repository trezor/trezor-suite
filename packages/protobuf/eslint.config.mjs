import { allowDevDependenciesIn, eslint } from '@trezor/eslint';

export default [...eslint, allowDevDependenciesIn(['**/scripts/**'])];
