type VersionArray = [number, number, number];
type VersionInput = VersionArray | string;

const parse = (versionArr: VersionArray) => ({
    major: versionArr[0],
    minor: versionArr[1],
    patch: versionArr[2],
});

const split = (version: string) => {
    const arr = version.split('.');
    if (arr.length !== 3) {
        throw new Error('version string is in wrong format');
    }
    return arr as unknown as VersionArray;
};

const toString = (arr: VersionArray) => `${arr[0]}.${arr[1]}.${arr[2]}`;

/**
 * Is versionX (first arg) newer than versionY (second arg)
 * accepts version in two formats:
 * - string: '1.0.0'
 * - array:  [1, 0, 0]
 */
export const isNewer = (versionX: VersionInput, versionY: VersionInput) => {
    const parsedX = parse(typeof versionX === 'string' ? split(versionX) : versionX);
    const parsedY = parse(typeof versionY === 'string' ? split(versionY) : versionY);

    if (parsedX.major - parsedY.major !== 0) {
        return parsedX.major > parsedY.major;
    }
    if (parsedX.minor - parsedY.minor !== 0) {
        return parsedX.minor > parsedY.minor;
    }
    if (parsedX.patch - parsedY.patch !== 0) {
        return parsedX.patch > parsedY.patch;
    }

    return false;
};

/**
 * Is versionX (first arg) equal versionY (second arg)
 * accepts version in two formats:
 * - string: '1.0.0'
 * - array:  [1, 0, 0]
 */
export const isEqual = (versionX: VersionInput, versionY: VersionInput) => {
    const strX = typeof versionX === 'string' ? versionX : toString(versionX);
    const strY = typeof versionY === 'string' ? versionY : toString(versionY);
    return strX === strY;
};

/**
 * Is versionX (first arg) newer or equal than versionY (second arg)
 * accepts version in two formats:
 * - string: '1.0.0'
 * - array:  [1, 0, 0]
 */
export const isNewerOrEqual = (versionX: VersionInput, versionY: VersionInput) =>
    isNewer(versionX, versionY) || isEqual(versionX, versionY);
