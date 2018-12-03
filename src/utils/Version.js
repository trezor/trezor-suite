class Version {
    constructor(major, minor, patch) {
        this.major = major || 0;
        this.minor = minor || 0;
        this.patch = patch || 0;
    }

    static fromArray(arr) {
        if (arr == null) {
            throw new Error('Unexpected null.');
        }
        if (arr.length !== 3) {
            throw new Error("Array version length isn't 3");
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

    toString() {
        return [this.major.toString(), this.minor.toString(), this.patch.toString()]
            .join('.');
    }

    isNewer(other) {
        let result;
        const { major, minor, patch } = other;
        if (this.major - major !== 0) {
            result = this.major > major;
        }
        if (this.minor - minor !== 0) {
            result = this.minor > minor;
        }
        if (this.patch - patch !== 0) {
            result = this.patch > patch;
        }
        if (this.major === major && this.minor === minor && this.patch === patch) {
            result = false;
        }
        return result;
    }

    isEqual(version) {
        return this.major === version.major
            && this.minor === version.minor
            && this.patch === version.patch;
    }

    isNewerOrEqual(version) {
        return this.isNewer(version) || this.isEqual(version);
    }
}

export default Version;
