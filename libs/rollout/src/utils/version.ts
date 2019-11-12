import { Version } from '../types';

const parse = (versionArr: number[]) => {
    if (!versionArr || versionArr.length !== 3) {
        throw Error('Wrong version arr');
    } else {
        return {
            major: versionArr[0],
            minor: versionArr[1],
            patch: versionArr[2],
        };
    }
};

const toString = (arr: number[]) => `${arr[0]}.${arr[1]}.${arr[2]}`;

const isNewer = (versionX: number[], versionY: number[]) => {
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

const isEqual = (versionX: number[], versionY: number[]) =>
    toString(versionX) === toString(versionY);
const isNewerOrEqual = (versionX, versionY) =>
    isNewer(versionX, versionY) || isEqual(versionX, versionY);

export default {
    isEqual,
    isNewer,
    isNewerOrEqual,
    parse,
    toString,
};
