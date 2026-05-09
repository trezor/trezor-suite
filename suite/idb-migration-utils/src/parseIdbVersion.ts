import * as semver from 'semver';

export interface VersionInfo {
    semver: semver.SemVer;
    revision: number;
    versionString: string;
}

const inByteRange = (raw: string) => /^(0|[1-9]\d{0,2})$/.test(raw) && Number(raw) <= 255;

/**
 * Parses and validates an IndexedDB migration version string.
 * Accepts "x.y.z" or "x.y.z.r".
 * Throws on invalid format or out-of-range values.
 */
export const parseIdbVersion = (raw: string): VersionInfo => {
    const parts = raw
        .trim()
        .split('.')
        .map(part => part.trim());

    if ((parts.length !== 3 && parts.length !== 4) || parts.includes('')) {
        throw new Error(
            `Invalid IDB version: "${raw}". Expected "major.minor.patch" or "major.minor.patch.revision".`,
        );
    }

    if (parts.some(part => !inByteRange(part))) {
        throw new Error(
            `Invalid IDB version: "${raw}". Each part must be a decimal integer in 0–255`,
        );
    }

    const core = parts.slice(0, 3).join('.');
    const semverVersion = new semver.SemVer(core);

    if (semverVersion.prerelease.length > 0) {
        throw new Error(`Invalid IDB version: "${raw}". Prerelease tags are not allowed`);
    }

    const revision = parts.length === 4 ? Number(parts[3]) : 0;

    const versionString =
        revision === 0 ? semverVersion.version : `${semverVersion.version}.${revision}`;

    return { semver: semverVersion, revision, versionString };
};
