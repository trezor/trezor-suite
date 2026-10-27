import { type PackageJson, readPackageJson } from '@trezor/node-utils';

import { listAllWorkspaces } from '../workspaces';

export type WorkspacePackage = {
    readonly name: string;
    readonly dir: string;
    readonly packageJson: PackageJson;
};

/**
 * The connect distribution packages 3rd parties install, the roots of the connect publish closure.
 * The `connect-public-dependencies` snapshots and the connect release scripts in `scripts/ci` share
 * this list. The `deploy-npm-connect` matrix in `.github/workflows/release-connect-npm.yml`,
 * `scripts/ci/check-npm-packages-reserved.js`, the shell loops in `test-connect-misc.yml` and the
 * CHANGELOG table in `scripts/ci/connect-bump-versions.ts` cannot import it and repeat it by hand.
 */
export const CONNECT_PUBLISH_ROOTS: ReadonlyArray<string> = [
    '@trezor/connect',
    '@trezor/connect-web',
    '@trezor/connect-mobile',
    '@trezor/connect-webextension',
];

/**
 * Read every workspace's package.json into a name-keyed map. Packages without a
 * `name` are skipped; version-less packages are kept so a closure traversal can
 * still walk through them.
 */
export const collectWorkspacePackages = (repoRoot: string): Map<string, WorkspacePackage> => {
    const packages = new Map<string, WorkspacePackage>();

    for (const workspace of listAllWorkspaces(repoRoot)) {
        const packageJson = readPackageJson<PackageJson>(workspace.dir);
        if (!packageJson.name) continue;

        packages.set(packageJson.name, {
            name: packageJson.name,
            dir: workspace.dir,
            packageJson,
        });
    }

    return packages;
};

/**
 * Compute the production closure of the given root packages: every internal
 * workspace package reachable through `dependencies` and `optionalDependencies`
 * (i.e. what actually ships when the roots are published). `devDependencies` and
 * `peerDependencies` are intentionally not traversed.
 */
export const collectProdWorkspaceClosure = (
    roots: ReadonlyArray<string>,
    packages: ReadonlyMap<string, WorkspacePackage>,
): ReadonlySet<string> => {
    const getProdWorkspaceDeps = (
        deps: Record<string, string> | undefined,
    ): ReadonlyArray<string> =>
        Object.entries(deps ?? {})
            .filter(([name, version]) => version.startsWith('workspace:') && packages.has(name))
            .map(([name]) => name);

    const closure = new Set<string>();
    const queue: string[] = roots.filter(root => packages.has(root));

    for (const root of queue) {
        closure.add(root);
    }

    while (queue.length > 0) {
        const name = queue.shift();
        if (name === undefined) continue;

        const pkg = packages.get(name);
        if (pkg === undefined) continue;

        const nextDeps = [
            ...getProdWorkspaceDeps(pkg.packageJson.dependencies),
            ...getProdWorkspaceDeps(pkg.packageJson.optionalDependencies),
        ];

        for (const dep of nextDeps) {
            if (closure.has(dep)) continue;

            closure.add(dep);
            queue.push(dep);
        }
    }

    return closure;
};
