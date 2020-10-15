import { VersionArray } from './parse';

export const parse = (versionArr: VersionArray) => {
    return {
        major: versionArr[0],
        minor: versionArr[1],
        patch: versionArr[2],
    };
};

export const toString = (arr: VersionArray) => `${arr[0]}.${arr[1]}.${arr[2]}`;

export const isNewer = (versionX: VersionArray, versionY: VersionArray) => {
    const parsedX = parse(versionX);
    const parsedY = parse(versionY);

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

export const isEqual = (versionX: VersionArray, versionY: VersionArray) =>
    toString(versionX) === toString(versionY);

export const isNewerOrEqual = (versionX: VersionArray, versionY: VersionArray) =>
    isNewer(versionX, versionY) || isEqual(versionX, versionY);
