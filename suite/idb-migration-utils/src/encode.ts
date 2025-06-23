import * as semver from 'semver';

export const semverToIDBVersion = (rawVersion: string | undefined): number => {
    const version = semver.parse(rawVersion);

    if (!version) {
        throw new Error(`Invalid version: ${rawVersion}`);
    }

    if (version.prerelease.length > 0) {
        throw new Error(`Prerelease versions are not supported: ${rawVersion}`);
    }

    const { major, minor, patch } = version;

    if ([major, minor, patch].some(v => v > 255)) {
        throw new Error(`Version ${rawVersion} is too large to be encoded`);
    }

    return (major << 16) | (minor << 8) | patch;
};

export const idbVersionToSemver = (version: number): semver.SemVer => {
    if (version < 0 || version > 0xffffff) {
        throw new RangeError(`Value is out of 24-bit range: ${version}`);
    }

    const patch = version & 0xff;
    const minor = (version >>> 8) & 0xff;
    const major = (version >>> 16) & 0xff;

    return new semver.SemVer(`${major}.${minor}.${patch}`);
};
