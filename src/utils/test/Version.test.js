import Version from '../Version';

describe('Version class', () => {
    describe('toString()', () => {
        it('should return version as string', () => {
            const version = new Version(1, 2, 3);
            const str = version.toString();
            expect(str).toEqual('1.2.3');
        });
    });

    describe('isNewer()', () => {
        it('it should return true for newer version', () => {
            const version = new Version(null, 2, 3);
            const other = new Version(1, 0, 0);
            const result = version.isNewer(other);
            expect(result).toEqual(true);
        });

        it('it should return false for older version', () => {
            const version = new Version(1, 2, 3);
            const other = new Version(6, 6, 6);
            const result = version.isNewer(other);
            expect(result).toEqual(false);
        });

        it('it should return false for same version', () => {
            const version = new Version(1, 2, 3);
            const other = new Version(1, 2, 3);
            const result = version.isNewer(other);
            expect(result).toEqual(false);
        });
    });

    describe('isEqual()', () => {
        it('it should return false for newer version', () => {
            const version = new Version(1, 2, 3);
            const other = new Version(1, 0, 0);
            const result = version.isEqual(other);
            expect(result).toEqual(false);
        });

        it('it should return false for older version', () => {
            const version = new Version(1, 2, 3);
            const other = new Version(6, 6, 6);
            const result = version.isEqual(other);
            expect(result).toEqual(false);
        });

        it('it should return true for same version', () => {
            const version = new Version(1, 2, 3);
            const other = new Version(1, 2, 3);
            const result = version.isEqual(other);
            expect(result).toEqual(true);
        });
    });

    describe('isNewerOrEqual()', () => {
        it('it should return true for newer version', () => {
            const version = new Version(1, 2, 3);
            const other = new Version(1, 0, 0);
            const result = version.isNewerOrEqual(other);
            expect(result).toEqual(true);
        });

        it('it should return false for older version', () => {
            const version = new Version(1, 2, 3);
            const other = new Version(6, 6, 6);
            const result = version.isNewerOrEqual(other);
            expect(result).toEqual(false);
        });

        it('it should return true for same version', () => {
            const version = new Version(1, 2, 3);
            const other = new Version(1, 2, 3);
            const result = version.isNewerOrEqual(other);
            expect(result).toEqual(true);
        });
    });

    describe('static fromArray()', () => {
        it('should create version instance from array', () => {
            const version = Version.fromArray([1, 2, 3]);
            expect(version.toString()).toEqual('1.2.3');
        });

        it('should return error if input is null', () => {
            try {
                Version.fromArray(null);
            } catch (err) {
                expect(err.message).toEqual('Unexpected null.');
            }
        });

        it('should fail on incorrect number of params', () => {
            try {
                Version.fromArray([1, 2]);
                expect('foo').toEqual('boo');
            } catch (err) {
                expect(err.message).toEqual("Array version length isn't 3");
            }
        });
    });

    describe('static fromString()', () => {
        it('should create version instance from string', () => {
            const version = Version.fromString('1.2.3');
            expect(version.toString()).toEqual('1.2.3');
        });

        it('should return error if input is null', () => {
            try {
                Version.fromString(null);
            } catch (err) {
                expect(err.message).toEqual('Unexpected null.');
            }
        });

        it('should fail on incorrect number of params', () => {
            try {
                Version.fromString('1.2');
                expect('foo').toEqual('boo');
            } catch (err) {
                expect(err.message).toEqual("Array version length isn't 3");
            }
        });
    });
});
