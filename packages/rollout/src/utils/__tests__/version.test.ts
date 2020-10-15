import * as versionUtils from '../version';

describe('Version Utils', () => {
    describe('is newer', () => {
        // older
        it('it should return false [0, 0, 1] [0, 0, 2]', () => {
            const result = versionUtils.isNewer([1, 0, 1], [1, 0, 2]);
            expect(result).toBe(false);
        });

        it('it should return false [0, 1, 1] [0, 2, 1]', () => {
            const result = versionUtils.isNewer([1, 1, 1], [1, 2, 1]);
            expect(result).toBe(false);
        });

        it('it should return false [1, 1, 1] [2, 1, 1]', () => {
            const result = versionUtils.isNewer([1, 1, 1], [2, 1, 1]);
            expect(result).toBe(false);
        });

        it('it should return false [1, 0, 0], [1, 0, 1]', () => {
            const result = versionUtils.isNewer([1, 0, 0], [1, 0, 1]);
            expect(result).toBe(false);
        });

        // newer
        it('it should return true [0, 0, 2] [0, 0, 1]', () => {
            const result = versionUtils.isNewer([1, 0, 2], [1, 0, 1]);
            expect(result).toBe(true);
        });

        it('it should return true [0, 2, 1] [0, 1, 1]', () => {
            const result = versionUtils.isNewer([1, 2, 1], [1, 1, 1]);
            expect(result).toBe(true);
        });

        it('it should return true [2, 1, 1] [1, 1, 1]', () => {
            const result = versionUtils.isNewer([2, 1, 1], [1, 1, 1]);
            expect(result).toBe(true);
        });

        it('it should return true [1, 0, 1], [1, 0, 0]', () => {
            const result = versionUtils.isNewer([1, 0, 1], [1, 0, 0]);
            expect(result).toBe(true);
        });

        // equal
        it('it should return false [1, 1, 1] [1, 1, 1]', () => {
            const result = versionUtils.isNewer([1, 1, 1], [1, 1, 1]);
            expect(result).toEqual(false);
        });
    });

    describe('is equal', () => {
        it('it should return false [1, 0, 0], [1, 0, 1]', () => {
            const result = versionUtils.isEqual([1, 0, 0], [1, 0, 1]);
            expect(result).toBe(false);
        });

        it('it should return false [1, 0, 1], [1, 0, 0]', () => {
            const result = versionUtils.isEqual([1, 0, 1], [1, 0, 0]);
            expect(result).toBe(false);
        });

        it('it should return true [1, 1, 1], [1, 1, 1]', () => {
            const result = versionUtils.isEqual([1, 1, 1], [1, 1, 1]);
            expect(result).toBe(true);
        });
    });

    describe('is newer or equal', () => {
        it('it should return false [1, 0, 0], [1, 0, 1]', () => {
            const result = versionUtils.isNewerOrEqual([1, 0, 0], [1, 0, 1]);
            expect(result).toBe(false);
        });

        it('it should return true [1, 0, 1], [1, 0, 0]', () => {
            const result = versionUtils.isNewerOrEqual([1, 0, 1], [1, 0, 0]);
            expect(result).toBe(true);
        });

        it('it should return true [1, 1, 1], [1, 1, 1]', () => {
            const result = versionUtils.isNewerOrEqual([1, 1, 1], [1, 1, 1]);
            expect(result).toBe(true);
        });
    });

    describe('parse', () => {
        it('it should parse', () => {
            const parsed = versionUtils.parse([1, 0, 1]);
            expect(parsed).toEqual({ major: 1, minor: 0, patch: 1 });
        });
    });
});
