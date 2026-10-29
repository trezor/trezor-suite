import { createRequire } from 'node:module';

// `@trezor/requirements` is CJS: Node cannot detect its named exports from ESM,
// hence `createRequire` plus the type-only import below.
import type * as Requirements from '@trezor/requirements';

const { CONNECT_PUBLISH_ROOTS, collectProdWorkspaceClosure, collectWorkspacePackages } =
    createRequire(import.meta.url)('@trezor/requirements') as typeof Requirements;

// Re-exported so that connect-publish-roots.ts does not need a second `createRequire`.
export { CONNECT_PUBLISH_ROOTS };

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
// `getTrezorPackageRelativePath` maps to `packages/<name>` or `networks/*/*`. The closure walk
// returns every workspace dependency, so a future member from another scope has no such mapping.
export const stripTrezorScope = (name: string): string => {
    if (!name.startsWith('@trezor/')) {
        throw new Error(
            `Publish closure member ${name} is not in the @trezor scope; the connect release scripts cannot resolve its directory.`,
        );
    }

    return name.slice('@trezor/'.length);
};
