type VersionArray = [number, number, number];
type VersionInput = VersionArray | string;

export const isVersionArray = (arr: unknown): arr is VersionArray => {
    // Check if argument is an actual array
    if (!Array.isArray(arr)) {
        return false;
    }

    // Array has invalid length
    if (arr.length !== 3) {
        return false;
    }

    // Check for invalid numbers in the array
    for (let i = 0; i < arr.length; i++) {
        const versionNumber = arr[i];
        if (typeof versionNumber !== 'number' || versionNumber < 0) {
            return false;
        }
    }

    return true;
};

const parse = (versionArr: VersionArray) => ({
    major: versionArr[0],
    minor: versionArr[1],
    patch: versionArr[2],
});

const split = (version: string) => {
    const arr = version.split('.').map(v => Number(v));
    if (!isVersionArray(arr)) {
        throw new Error(`version string is in wrong format: ${version}`);
    }

    return arr;
};

const versionToString = (arr: VersionArray) => `${arr[0]}.${arr[1]}.${arr[2]}`;

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
    const strX = typeof versionX === 'string' ? versionX : versionToString(versionX);
    const strY = typeof versionY === 'string' ? versionY : versionToString(versionY);

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

export const normalizeVersion = (version: string) =>
    // remove any zeros that are not preceded by Latin letters, decimal digits, underscores
    version.replace(/\b0+(\d)/g, '$1');
