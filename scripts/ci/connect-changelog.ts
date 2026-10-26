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
const USER_FACING_COMMIT = /^-\s+(?:feat|fix|perf|refactor|revert)(?:\([^)]*\))?:|^-\s+Revert "/;
export const filterChangelogCommits = (commitLines: string[]) =>
    commitLines.filter(line => USER_FACING_COMMIT.test(line));
