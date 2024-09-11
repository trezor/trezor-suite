import { throwError } from './throwError';

type VersionArray = [number, number, number];
type VersionInput = VersionArray | string;

export const isVersionArray = (arr: unknown): arr is VersionArray =>
    Array.isArray(arr) &&
    arr.length === 3 &&
    arr.every(number => typeof number === 'number' && number >= 0);

const tryParse = (version: string): VersionArray | null =>
    version
        .match(/^(\d+)\.(\d+)\.(\d+)([+-].*)?$/) // three groups of digits separated by dot, optionally ending with '-whatever.123.@' or '+anything.456.#'
        ?.slice(1, 4)
        .map(n => Number(n)) as VersionArray;

const validateArray = (version: VersionArray) => (isVersionArray(version) ? version : null);

const ensureArray = (version: VersionInput): VersionArray =>
    (typeof version === 'string' ? tryParse(version) : validateArray(version)) ??
    throwError(`version string is in wrong format: ${version}`);

const compare = ([majorX, minorX, patchX]: VersionArray, [majorY, minorY, patchY]: VersionArray) =>
    majorX - majorY || minorX - minorY || patchX - patchY;

/**
 * Is versionX (first arg) newer than versionY (second arg)
 * accepts version in two formats:
 * - string: '1.0.0'
 * - array:  [1, 0, 0]
 */
export const isNewer = (versionX: VersionInput, versionY: VersionInput) =>
    compare(ensureArray(versionX), ensureArray(versionY)) > 0;

/**
 * Is versionX (first arg) equal versionY (second arg)
 * accepts version in two formats:
 * - string: '1.0.0'
 * - array:  [1, 0, 0]
 */
export const isEqual = (versionX: VersionInput, versionY: VersionInput) =>
    compare(ensureArray(versionX), ensureArray(versionY)) === 0;

/**
 * Is versionX (first arg) newer or equal than versionY (second arg)
 * accepts version in two formats:
 * - string: '1.0.0'
 * - array:  [1, 0, 0]
 */
export const isNewerOrEqual = (versionX: VersionInput, versionY: VersionInput) =>
    compare(ensureArray(versionX), ensureArray(versionY)) >= 0;

export const normalizeVersion = (version: string) =>
    // remove any zeros that are not preceded by Latin letters, decimal digits, underscores
    version.replace(/\b0+(\d)/g, '$1');
