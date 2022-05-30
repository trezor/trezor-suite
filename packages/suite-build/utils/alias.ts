import * as path from 'path';
import { A, D, pipe, S } from '@mobily/ts-belt';
// we should not import files outside rootDir in TS composite project
// @ts-ignore
import tsConfig from '../../../tsconfig.aliases.json';

const {
    compilerOptions: { paths },
} = tsConfig;

// Webpack resolve all aliases with wildcard automatically so we should remove /* and /index from end of paths
const replacePathWildcard = S.replaceByRe(/(\/\*|\/index)$/, '');
export const resolvePath = (relativePath: string) =>
    path.resolve(__dirname, '..', '..', '..', relativePath);

export const prepareAliases = (aliasesPaths: Record<string, string[]>) =>
    pipe(
        aliasesPaths,
        D.map(A.last),
        D.toPairs,
        A.map(value => {
            const alias = replacePathWildcard(value[0]);
            const aliasPath = pipe(value[1]!, replacePathWildcard, resolvePath);

            return [alias, aliasPath] as const;
        }),
        // removing wildcard could result to duplicate entries but that will be solved by converting from pairs to object
        D.fromPairs,
    );

const aliases = prepareAliases(paths);

export default aliases;
