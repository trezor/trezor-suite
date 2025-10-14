import { parseIdbVersion } from './parseIdbVersion';

export const encodeIDBVersion = (rawVersion: string): number => {
    const { semver, revision } = parseIdbVersion(rawVersion);

    const { major, minor, patch } = semver;

    return ((major << 24) | (minor << 16) | (patch << 8) | revision) >>> 0;
};

export const idbVersionToString = (version: number): string => {
    if (!Number.isInteger(version) || version < 0 || version > 0xffffffff) {
        throw new RangeError(`Invalid IDB version: ${version} (must be an integer 0–0xFFFFFFFF)`);
    }

    const unsignedIntVersion = version >>> 0;

    if (unsignedIntVersion < 0x01000000) {
        const major = (unsignedIntVersion >>> 16) & 0xff;
        const minor = (unsignedIntVersion >>> 8) & 0xff;
        const patch = unsignedIntVersion & 0xff;

        return `${major}.${minor}.${patch}`;
    }

    const major = (unsignedIntVersion >>> 24) & 0xff;
    const minor = (unsignedIntVersion >>> 16) & 0xff;
    const patch = (unsignedIntVersion >>> 8) & 0xff;
    const rev = unsignedIntVersion & 0xff;

    return rev ? `${major}.${minor}.${patch}.${rev}` : `${major}.${minor}.${patch}`;
};
