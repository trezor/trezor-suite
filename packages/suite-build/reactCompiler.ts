import type { PluginOptions } from 'babel-plugin-react-compiler';
import { statSync } from 'fs';
import path from 'path';

/**
 * React Compiler wiring shared by the webpack build and the Vite dev server.
 * ONCE FULLY MIGRATED TO THE REACT COMPILER, THIS MODULE WILL BE DELETED AS IT WILL NO LONGER BE NEEDED.
 */

const repoRoot = path.resolve(__dirname, '../..');

/**
 * Repo-root-relative directories whose files the React Compiler compiles
 * - E.g. `packages/suite` would cover `packages/suite/src/...`
 * - An entry must be reachable from BOTH the web and the desktop entry graph, which are disjoint
 * (`packages/suite-web/src/index.ts` vs `packages/suite-desktop-ui/src/index.tsx`).
 */
export const REACT_COMPILER_PATHS: readonly string[] = [];

/**
 * Options passed to `babel-plugin-react-compiler`
 */
export const reactCompilerOptions: PluginOptions = {};

const matchedPaths = new Set<string>();

/** `null` when the file lies outside the repo, or is a dependency rather than workspace source. */
const toRepoRelativePath = (filename: string, root: string): string | null => {
    // Rolldown ids may be virtual (`\0...`) or relative; resolving those against `process.cwd()`
    // could land them inside the repo root by accident.
    if (!path.isAbsolute(filename)) return null;

    const relativePath = path.relative(root, filename);

    if (
        relativePath === '' ||
        relativePath === '..' ||
        relativePath.startsWith(`..${path.sep}`) ||
        // A different Windows drive.
        path.isAbsolute(relativePath)
    ) {
        return null;
    }

    const normalizedPath = relativePath.split(path.sep).join('/');

    return normalizedPath.startsWith('node_modules/') || normalizedPath.includes('/node_modules/')
        ? null
        : normalizedPath;
};

/**
 * Anchored at a path separator on both sides, which is what keeps `packages/suite` off
 * `packages/suite-build` and friends.
 */
const isInsideDirectory = (relativePath: string, directory: string) =>
    relativePath.startsWith(`${directory}/`);

/**
 * Returns every `paths` entry the file belongs to. All of them, not just the first: entries may
 * nest (`packages/suite` and `packages/suite/src/hooks`), and recording only the first would leave
 * the inner one looking unmatched forever, failing the build over files that are in fact compiled.
 */
export const matchReactCompilerPaths = (
    filename: string | undefined,
    paths: readonly string[] = REACT_COMPILER_PATHS,
    root: string = repoRoot,
): string[] => {
    // Also the fast path: with no wave enabled, no file is ever touched by the filesystem below.
    if (filename === undefined || paths.length === 0) return [];

    // Rolldown hands the Vite side a module id, which may carry a `?query` suffix or be a virtual
    // module. webpack hands babel-loader a plain absolute path. Normalise to the former's superset.
    const [filePath] = filename.split('?');
    if (filePath === undefined) return [];

    const relativePath = toRepoRelativePath(filePath, root);
    if (relativePath === null) return [];

    return paths.filter(directory => isInsideDirectory(relativePath, directory));
};

/**
 * Babel applicable-test predicate, for the `include` key of an `overrides` entry. Babel types the
 * filename as optionally undefined and Vite may hand over a virtual id, so neither an absolute path
 * nor a path inside this repo can be assumed.
 */
export const shouldCompileWithReactCompiler = (filename: string | undefined): boolean => {
    if (REACT_COMPILER_PATHS.length === 0) return false;

    const matches = matchReactCompilerPaths(filename);
    matches.forEach(directory => matchedPaths.add(directory));

    return matches.length > 0;
};

/**
 * `isInsideDirectory` compares against `${directory}/`, so an entry has to be a bare
 * repo-root-relative, POSIX-spelled directory path to ever match.
 */
const isMatchableDirectory = (directory: string, root: string) => {
    if (directory === '' || path.isAbsolute(directory) || directory.includes('\\')) return false;
    if (directory.startsWith('./') || directory.startsWith('../') || directory.endsWith('/')) {
        return false;
    }

    try {
        return statSync(path.join(root, directory)).isDirectory();
    } catch {
        return false;
    }
};

/**
 * Entries of `REACT_COMPILER_PATHS` that can never match: a typo, a directory that has since been
 * moved or renamed, a file rather than a directory, or a spelling the segment match will not accept.
 */
export const getInvalidReactCompilerPaths = (
    paths: readonly string[] = REACT_COMPILER_PATHS,
    root: string = repoRoot,
): string[] => paths.filter(directory => !isMatchableDirectory(directory, root));

/**
 * Entries of `REACT_COMPILER_PATHS` that no file has matched so far. Meaningful only once a build
 * has walked the whole module graph; a Vite dev server transforms lazily and never reaches that
 * point, so only the webpack build asserts on it.
 *
 * Matches accumulate for the life of the process rather than per compilation, because a watch-mode
 * rebuild only re-runs babel-loader on the files that changed and would otherwise look empty.
 */
export const getUnmatchedReactCompilerPaths = (): string[] =>
    REACT_COMPILER_PATHS.filter(directory => !matchedPaths.has(directory));

/**
 * A filter that silently matches nothing is this rollout's primary failure mode: the build stays
 * green and simply ships uncompiled code. Fail loudly at config load instead.
 */
export const assertReactCompilerPathsAreValid = () => {
    const invalidPaths = getInvalidReactCompilerPaths();

    if (invalidPaths.length > 0) {
        throw new Error(
            `REACT_COMPILER_PATHS contains ${invalidPaths.length} entr${
                invalidPaths.length === 1 ? 'y' : 'ies'
            } that cannot match any file: ${invalidPaths.join(', ')}. ` +
                `Entries must be bare directory paths relative to the repository root ` +
                `(${repoRoot}), with no leading './' and no trailing separator.`,
        );
    }
};

assertReactCompilerPathsAreValid();
