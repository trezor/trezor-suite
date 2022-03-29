const VER_NUMS = 3;

const versionRegex = new RegExp(/^[0-9]{1,3}(\.[0-9]{1,3}){0,2}$/);

/**
 * Validates version string
 * @param {string} version Version string
 * @returns {boolean} True if version string is valid, false if not
 */
export const isValidVersionString = (version: string) => versionRegex.test(version);

/**
 * Validates a version array
 * @param {number[]} version Version array
 * @returns {boolean} True if version array is valid, false if not
 */
export const isValidVersionArray = (version: number[]) => {
    // Check if we're getting an actual array
    if (!Array.isArray(version)) {
        return false;
    }

    // Array has to have something in it and be no longer than the VER_NUMS const
    if (version.length === 0 || version.length > VER_NUMS) {
        return false;
    }

    // There's no major version 0 (invalid number)
    if (version[0] === 0) {
        return false;
    }

    // Check for invalid numbers in the array
    for (let i = 0; i < version.length; i++) {
        if (typeof version[i] !== 'number' || version[i] < 0) {
            return false;
        }
    }

    return true;
};

/**
 * Fills the missing version numbers with zeros (ie: [1, 2] will become [1, 2, 0])
 * @param {number[]} version Version array
 * @returns {number[]} Version array with all positions filled
 */
export const normalizeVersionArray = (version: number[]) => {
    if (version.length === VER_NUMS) {
        return version;
    }

    // Filling zero's for partial versions
    const partialVersion = [...version];
    for (let i = version.length; i < VER_NUMS; i++) {
        partialVersion.push(0);
    }

    return partialVersion;
};

/**
 * Returns a valid version array from a version string
 * @param {string} version Version string
 * @returns {number[]} Version array
 */
export const versionSplit = (version: string): number[] => {
    if (!isValidVersionString(version)) {
        return [0, 0, 0];
    }

    return version.split('.').map(v => Number(v));
};

/**
 * Compares two versions and returns if the version is newer (1), older (-1) or equal (0).
 * @param {string | number[]} a Version to compare from
 * @param {string | number[]} b Version to compare with
 * @returns {number} Returns 1 if newer, -1 if older and 0 if equal
 */
export const versionCompare = (a: string | number[], b: string | number[]) => {
    // Quick compare for same version
    if (typeof a === 'string' && typeof b === 'string' && a === b) {
        return 0;
    }

    // Convert string to version arrays
    const pa = typeof a === 'string' ? versionSplit(a) : a;
    const pb = typeof b === 'string' ? versionSplit(b) : b;

    // Check version validity
    const vpa = isValidVersionArray(pa);
    const vpb = isValidVersionArray(pb);

    if (!vpa && !vpb) {
        // Both arrays are invalid
        return 0;
    }
    if (!vpa && vpb) {
        // First array is Invalid
        return -1;
    }
    if (vpa && !vpb) {
        // Second array is invalid
        return 1;
    }

    // Normalize arrays (to contain the right version array length)
    const npa = normalizeVersionArray(pa);
    const npb = normalizeVersionArray(pb);

    // Compare versions numbers
    for (let i = 0; i < VER_NUMS; i++) {
        if (npa[i] > npb[i]) return 1;
        if (npb[i] > npa[i]) return -1;
    }

    return 0;
};
