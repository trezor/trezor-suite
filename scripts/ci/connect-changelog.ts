// The previous release of a package marks the boundary: everything above it in the
// (reverse-chronological) log is what this release adds. The marker
// `npm-release: @trezor/<pkg> <ver>` is written by this script on every release.
export const getCommitsSinceLastStableRelease = (commitLines: string[], packageName: string) => {
    const boundary = commitLines.findIndex(line =>
        line.includes(`npm-release: @trezor/${packageName}`),
    );

    return boundary === -1 ? commitLines : commitLines.slice(0, boundary);
};
