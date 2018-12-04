const parse = (versionArr) => {
    if (versionArr.length !== 3) {
        throw Error('Wrong version string');
    } else {
        return {
            major: versionArr[0],
            minor: versionArr[1],
            patch: versionArr[2],
        };
    }
};

const convertToString = arr => `${arr[0]}.${arr[1]}.${arr[2]}`;

const isNewer = (versionX, versionY) => {
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

const isEqual = (versionX, versionY) => toString(versionX) === toString(versionY);
const isNewerOrEqual = (versionX, versionY) => isNewer(versionX, versionY) || isEqual(versionX, versionY);

export default {
    isEqual,
    isNewer,
    isNewerOrEqual,
    parse,
    convertToString,
};
