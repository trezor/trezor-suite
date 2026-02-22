import { throwError } from './throwError';

type VersionArray = [number, number, number] | [number, number, number, number];
type VersionInput = VersionArray | string;

export const isVersionArray = (arr: unknown): arr is VersionArray =>
    Array.isArray(arr) &&
    (arr.length === 3 || arr.length === 4) &&
    arr.every(number => typeof number === 'number' && number >= 0);

export const tryParse = (version: string): VersionArray | null => {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?([+-].*)?$/);
    if (!match) return null;

    const parts = match.slice(1, 4).map(Number) as [number, number, number];

    return match[4] != null ? [...parts, Number(match[4])] : parts;
};

const validateArray = (version: VersionArray) => (isVersionArray(version) ? version : null);

const ensureArray = (version: VersionInput): VersionArray =>
    (typeof version === 'string' ? tryParse(version) : validateArray(version)) ??
    throwError(`version string is in wrong format: ${version}`);

const compare = (x: VersionArray, y: VersionArray) => {
    const len = Math.max(x.length, y.length);
    for (let i = 0; i < len; i++) {
        const diff = (x[i] ?? 0) - (y[i] ?? 0);
        if (diff !== 0) return diff;
    }

    return 0;
};

/**
 * Is versionX (first arg) newer than versionY (second arg)
 * accepts version in formats:
 * - string: '1.0.0' or '1.0.0.1'
 * - array:  [1, 0, 0] or [1, 0, 0, 1]
 */
export const isNewer = (versionX: VersionInput, versionY: VersionInput) =>
    compare(ensureArray(versionX), ensureArray(versionY)) > 0;

/**
 * Is versionX (first arg) equal versionY (second arg)
 * accepts version in formats:
 * - string: '1.0.0' or '1.0.0.1'
 * - array:  [1, 0, 0] or [1, 0, 0, 1]
 */
export const isEqual = (versionX: VersionInput, versionY: VersionInput) =>
    compare(ensureArray(versionX), ensureArray(versionY)) === 0;

/**
 * Is versionX (first arg) newer or equal than versionY (second arg)
 * accepts version in formats:
 * - string: '1.0.0' or '1.0.0.1'
 * - array:  [1, 0, 0] or [1, 0, 0, 1]
 */
export const isNewerOrEqual = (versionX: VersionInput, versionY: VersionInput) =>
    compare(ensureArray(versionX), ensureArray(versionY)) >= 0;

export const normalizeVersion = (version: string) =>
    // remove any zeros that are not preceded by Latin letters, decimal digits, underscores
    version.replace(/\b0+(\d)/g, '$1');

/**
 * Is version within the range of minVersion and maxVersion (inclusive on both ends)
 */
export const isWithinRange = (
    version: VersionInput,
    minVersion: VersionInput,
    maxVersion: VersionInput,
) => isNewerOrEqual(version, minVersion) && isNewerOrEqual(maxVersion, version);
