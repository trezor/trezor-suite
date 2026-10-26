// Release markers in the log (`-   <subject> (<hash>)`, quotes stripped). Only a plain x.y.z version is
// a stable release; prereleases (`-beta.N`, also committed as `npm-release:` for connect itself and in
// older per-package releases) are intentionally not boundaries: a stable changelog spans the whole
// range since the last STABLE release.
const STABLE_VERSION = String.raw`\d+\.\d+\.\d+(?=\s)`;
const isPackageStableRelease = (commitLine: string, packageName: string) =>
    new RegExp(String.raw`^-\s+npm-release: @trezor/${packageName} ${STABLE_VERSION}`).test(
        commitLine,
    );
const isConnectStableRelease = (commitLine: string) =>
    new RegExp(
        String.raw`^-\s+(?:npm-release|release): (?:@trezor/)?connect ${STABLE_VERSION}`,
    ).test(commitLine);

// The previous stable release marks the boundary: everything above it in the (reverse-chronological)
// log is what this release adds. Two kinds of marker record one, and the NEAREST of either kind
// wins — the boundary is the most recent stable release of this package, whatever commit recorded
// it, so preferring a kind could reach back past a release and re-list it. The per-package marker
// `npm-release: @trezor/<pkg> <ver>` is written by this script on every stable release, so it
// self-heals after a package's first stable cut. The connect-wide marker covers a package's very
// first stable release under this scheme — 9.x used connect-wide `npm-release: @trezor/connect
// <ver>` (and legacy `release: [@trezor/]connect <ver>`), which is why the first v10 stable dumped
// a package's entire history.
export const getCommitsSinceLastStableRelease = (commitLines: string[], packageName: string) => {
    const markers = [
        commitLines.findIndex(line => isPackageStableRelease(line, packageName)),
        commitLines.findIndex(isConnectStableRelease),
    ].filter(index => index !== -1);
    const boundary = markers.length ? Math.min(...markers) : -1;

    if (boundary === -1) {
        // Expected only for a package's first release; otherwise it means the markers this relies on
        // are missing, so make the full-log fallback visible in the release job instead of silent.
        console.warn(
            `No stable release marker found for @trezor/${packageName}; falling back to all ${commitLines.length} commits read from the path-scoped log.`,
        );
    }

    return boundary === -1 ? commitLines : commitLines.slice(0, boundary);
};

// Keep only user-facing commit types so a package changelog reads as a list of actual changes rather
// than every commit that happened to touch its directory (the git log is path-scoped, so repo-wide
// mechanical sweeps leak in). An allow-list drops release bookkeeping (`npm-release:`,
// `npm-prerelease(connect):`, `release:`) and non-user-facing churn (chore/test/ci/build/style/docs)
// with or without a scope, and is self-limiting: a bookkeeping type added later cannot leak in.
// git's own `Revert "<subject>"` is the one non-conventional subject the repo's commit lint exempts
// (see COMMITS.md), so the same allow-list is applied to the reverted subject: a revert of a chore
// or docs commit is no more user-facing than the commit it reverts.
const USER_FACING_TYPE = String.raw`(?:feat|fix|perf|refactor|revert)(?:\([^)]*\))?:`;
const USER_FACING_COMMIT = new RegExp(
    String.raw`^-\s+(?:${USER_FACING_TYPE}|Revert "${USER_FACING_TYPE})`,
);

// The connect entry points are thin wrappers around `@trezor/connect`, so a repo-wide sweep that
// happened to touch only their package manifest or tsconfig (e.g. `fix: add TON of missing
// dependecies in package.json`) survives the type filter and reads as a real change to their
// consumers. For them, a commit has to look like their own change in one of two ways: a matching
// scope (connect or the package itself), or a diff that reached the package's own source. A sweep
// that did reach their `src` is kept on purpose — see below. The generic dependency packages stay
// on the type-only filter: there a foreign scope is not a reliable signal, since their changes are
// routinely committed under the scope of the feature that needed them.
const CHANGELOG_SCOPES: Record<string, string[]> = {
    'connect-web': ['connect', 'connect-web'],
    'connect-webextension': ['connect', 'connect-webextension'],
    'connect-mobile': ['connect', 'connect-mobile'],
};
const COMMIT_SCOPE = /^-\s+(?:Revert ")?\w+\(([^)]*)\):/;

// Whether `filterChangelogCommits` needs `commitsTouchingSrc` for this package, so the caller can
// skip the extra src-scoped git log for the packages that do not use the scope allow-list.
export const hasChangelogScopes = (packageName: string) => packageName in CHANGELOG_SCOPES;

export const filterChangelogCommits = (
    commitLines: string[],
    packageName: string,
    // Lines of the same log scoped to the package's `src`, to be matched by identity.
    commitsTouchingSrc?: ReadonlySet<string>,
) => {
    const scopes = CHANGELOG_SCOPES[packageName];

    return commitLines.filter(line => {
        if (!USER_FACING_COMMIT.test(line)) {
            return false;
        }
        if (!scopes) {
            return true;
        }

        // A comma-separated scope (`fix(connect, connect-web): ...`) counts when any part matches.
        const scope = line.match(COMMIT_SCOPE)?.[1];
        if (scope?.split(',').some(part => scopes.includes(part.trim()))) {
            return true;
        }

        // A foreign- or unscoped commit can still be a real change to the entry point: it is
        // routine here to change one package under another's scope (e.g. `feat(suite-web): make
        // permissions query in init optional ...`, whose whole diff is in `connect-web/src`). The
        // scope rule alone would drop it, and a dropped change is invisible — the changelog is the
        // only artifact these packages ship — so a commit that touched the package's own source
        // counts whatever its scope says. A sweep that only touched the package's config or
        // manifest still does not.
        return !!commitsTouchingSrc?.has(line);
    });
};
