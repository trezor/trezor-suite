import { join } from 'node:path';

import { readJson } from './readJson';

/**
 * Structural view of a `package.json`. Only the commonly-read fields are typed
 * explicitly; the trailing index signature keeps arbitrary metadata
 * (`repository`, `bugs`, `author`, …) accessible as `unknown` without every
 * consumer redeclaring its own subset.
 */
export type PackageJson = {
    readonly name?: string;
    readonly version?: string;
    readonly private?: boolean;
    readonly type?: string;
    readonly main?: string;
    readonly files?: ReadonlyArray<string>;
    readonly scripts?: Record<string, string | undefined>;
    readonly workspaces?: { readonly packages?: ReadonlyArray<string> } | ReadonlyArray<string>;
    readonly resolutions?: Record<string, string>;
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
    readonly optionalDependencies?: Record<string, string>;
    readonly peerDependencies?: Record<string, string>;
    readonly peerDependenciesMeta?: Record<string, { readonly optional?: boolean }>;
    readonly [field: string]: unknown;
};

/** Read and parse the `package.json` located directly inside `directory`. */
export const readPackageJson = <T = PackageJson>(directory: string): T =>
    readJson<T>(join(directory, 'package.json'));
