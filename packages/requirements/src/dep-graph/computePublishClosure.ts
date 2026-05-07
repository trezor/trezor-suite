// Pure BFS over the @trezor/* workspace publish dependency graph.
//
// Filesystem-agnostic — pass a `getDeps` resolver that returns each package's
// `dependencies` + `peerDependencies` (NOT `devDependencies`, that is the
// publish boundary). The default filesystem-backed resolver lives in
// `./readWorkspaceDeps`. Splitting them keeps this module purely in-memory
// so it can be unit-tested without filesystem fixtures.
//
// Single source of truth for the publish dep graph. Consumers:
// - scripts/ci/gen-workflow-paths.ts (workflow path filters)
// - scripts/ci/get-connect-dependencies-to-release.ts (release detection)
// Future: pack-packages.ts, a custom eslint rule for missing-runtime-deps,
// and consolidation with `requireConnectPublicDependencies` (which currently
// implements the same BFS shape against `dependencies + optionalDependencies`).

export type PackageDepsResolver = (packageName: string) => string[];

export const computePublishClosure = (
    roots: string[],
    getDeps: PackageDepsResolver,
): Set<string> => {
    const visited = new Set<string>();
    const queue: string[] = [...roots];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) {
            continue;
        }
        visited.add(current);

        for (const dependency of getDeps(current)) {
            if (!visited.has(dependency)) {
                queue.push(dependency);
            }
        }
    }

    return visited;
};
