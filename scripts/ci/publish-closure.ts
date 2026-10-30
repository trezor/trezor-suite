import { createRequire } from 'node:module';
import path from 'node:path';

// `@trezor/requirements` is CJS: Node cannot detect its named exports from ESM,
// hence `createRequire` plus the type-only import below.
import type * as Requirements from '@trezor/requirements';

import { getTrezorPackageRelativePath } from './trezor-package-path';

const { collectProdWorkspaceClosure, collectWorkspacePackages } = createRequire(import.meta.url)(
    '@trezor/requirements',
) as typeof Requirements;

export const collectPublishClosure = (
    repoRoot: string,
    roots: ReadonlyArray<string>,
): ReadonlyArray<Requirements.WorkspacePackage> => {
    const packages = collectWorkspacePackages(repoRoot);

    // The closure walk skips unknown roots, so a renamed or removed root would silently drop
    // every package behind it.
    const missingRoots = roots.filter(root => !packages.has(root));
    if (missingRoots.length > 0) {
        throw new Error(
            `Not workspace packages: ${missingRoots.join(', ')}. Was a root renamed or removed?`,
        );
    }

    return [...collectProdWorkspaceClosure(roots, packages)].flatMap(
        name => packages.get(name) ?? [],
    );
};

// The connect release scripts address packages by their unscoped name, which
// `getTrezorPackageRelativePath` maps back to a directory. The closure walk returns every
// workspace dependency, so compare that mapping with the workspace it actually found: a member
// the scripts cannot address then fails here instead of half-way through the bump loop.
export const toReleaseScriptName = (
    repoRoot: string,
    { name, dir }: Requirements.WorkspacePackage,
): string => {
    if (!name.startsWith('@trezor/')) {
        throw new Error(
            `Publish closure member ${name} is not in the @trezor scope; the connect release scripts cannot resolve its directory.`,
        );
    }

    const unscopedName = name.slice('@trezor/'.length);
    const scriptsRelativePath = getTrezorPackageRelativePath(unscopedName);
    const workspaceRelativePath = path.relative(repoRoot, dir).replaceAll(path.sep, '/');

    if (scriptsRelativePath !== workspaceRelativePath) {
        throw new Error(
            `Publish closure member ${name} lives in ${workspaceRelativePath}, but the connect release scripts resolve it to ${scriptsRelativePath}.`,
        );
    }

    return unscopedName;
};
