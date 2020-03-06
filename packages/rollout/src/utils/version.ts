import { Version, VersionArray } from '../types';

const parse = (versionArr: VersionArray) => {
    return {
        major: versionArr[0],
        minor: versionArr[1],
        patch: versionArr[2],
    };
};

const toString = (arr: VersionArray) => `${arr[0]}.${arr[1]}.${arr[2]}`;

const isNewer = (versionX: VersionArray, versionY: VersionArray) => {
    const parsedX: Version = parse(versionX);
    const parsedY: Version = parse(versionY);

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

const isEqual = (versionX: VersionArray, versionY: VersionArray) =>
    toString(versionX) === toString(versionY);

const isNewerOrEqual = (versionX: VersionArray, versionY: VersionArray) =>
    isNewer(versionX, versionY) || isEqual(versionX, versionY);

export default {
    isEqual,
    isNewer,
    isNewerOrEqual,
    parse,
    toString,
};
