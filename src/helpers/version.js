export default class Version {
    constructor(major, minor, patch) {
        this.major = major || 0;
        this.minor = minor || 0;
        this.patch = patch || 0;
    }

    toString() {
        return [
            this.major.toString(),
            this.minor.toString(),
            this.patch.toString(),
        ].join('.');
    }

    isNewer(other) {
        if (this.major - other.major !== 0) {
            return (this.major > other.major);
        }
        if (this.minor - other.minor !== 0) {
            return (this.minor > other.minor);
        }
        if (this.patch - other.patch !== 0) {
            return (this.patch > other.patch);
        }
        return false;
    }

    isEqual(other) {
        return this.major === other.major
            && this.minor === other.minor
            && this.patch === other.patch;
    }

    isNewerOrEqual(other) {
        return this.isNewer(other) || this.isEqual(other);
    }

    static fromArray(arr) {
        if (arr == null) {
            throw new Error('Unexpected null.');
        }
        if (arr.length !== 3) {
            throw new Error("Array length isn't 3");
        }
        return new Version(arr[0], arr[1], arr[2]);
    }

    static fromString(str) {
        if (str == null) {
            throw new Error('Unexpected null.');
        }
        const strArr = str.split('.');
        const numArr = strArr.map(n => parseInt(n, 10));
        return Version.fromArray(numArr);
    }
}
