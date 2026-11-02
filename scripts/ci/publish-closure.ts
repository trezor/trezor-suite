import { createRequire } from 'node:module';

// `@trezor/requirements` is CJS: Node cannot detect its named exports from ESM,
// hence `createRequire` plus the type-only import below.
import type * as Requirements from '@trezor/requirements';

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
