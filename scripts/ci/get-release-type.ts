import semver from 'semver';

export type ReleaseType = 'stable' | 'canary' | 'alpha';

// Maps a semver string to a connect release channel: a plain version is stable, an
// `alpha` prerelease is alpha, and any other prerelease (e.g. `beta`) is canary.
export const getReleaseType = (version: string): ReleaseType => {
    const prerelease = semver.prerelease(version);
    if (!prerelease) {
        return 'stable';
    }

    return prerelease[0] === 'alpha' ? 'alpha' : 'canary';
};
