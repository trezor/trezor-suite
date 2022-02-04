import { isNewer, isNewerOrEqual, isEqual } from '../src/versionUtils';

describe('Version Utils', () => {
    describe('is newer', () => {
        // older
        it('it should return false [0, 0, 1] [0, 0, 2]', () => {
            const result = isNewer([1, 0, 1], [1, 0, 2]);
            expect(result).toBe(false);
        });

        it('it should return false [0, 1, 1] [0, 2, 1]', () => {
            const result = isNewer([1, 1, 1], [1, 2, 1]);
            expect(result).toBe(false);
        });

        it('it should return false [1, 1, 1] [2, 1, 1]', () => {
            const result = isNewer([1, 1, 1], [2, 1, 1]);
            expect(result).toBe(false);
        });

        it('it should return false [1, 0, 0], [1, 0, 1]', () => {
            const result = isNewer([1, 0, 0], [1, 0, 1]);
            expect(result).toBe(false);
        });

        // newer
        it('it should return true [0, 0, 2] [0, 0, 1]', () => {
            const result = isNewer([1, 0, 2], [1, 0, 1]);
            expect(result).toBe(true);
        });

        it('it should return true [0, 2, 1] [0, 1, 1]', () => {
            const result = isNewer([1, 2, 1], [1, 1, 1]);
            expect(result).toBe(true);
        });

        it('it should return true [2, 1, 1] [1, 1, 1]', () => {
            const result = isNewer([2, 1, 1], [1, 1, 1]);
            expect(result).toBe(true);
        });

        it('it should return true [1, 0, 1], [1, 0, 0]', () => {
            const result = isNewer([1, 0, 1], [1, 0, 0]);
            expect(result).toBe(true);
        });

        // equal
        it('it should return false [1, 1, 1] [1, 1, 1]', () => {
            const result = isNewer([1, 1, 1], [1, 1, 1]);
            expect(result).toEqual(false);
        });
    });

    describe('is equal', () => {
        it('it should return false [1, 0, 0], [1, 0, 1]', () => {
            const result = isEqual([1, 0, 0], [1, 0, 1]);
            expect(result).toBe(false);
        });

        it('it should return false [1, 0, 1], [1, 0, 0]', () => {
            const result = isEqual([1, 0, 1], [1, 0, 0]);
            expect(result).toBe(false);
        });

        it('it should return true [1, 1, 1], [1, 1, 1]', () => {
            const result = isEqual([1, 1, 1], [1, 1, 1]);
            expect(result).toBe(true);
        });
    });

    describe('is newer or equal', () => {
        it('it should return false [1, 0, 0], [1, 0, 1]', () => {
            const result = isNewerOrEqual([1, 0, 0], [1, 0, 1]);
            expect(result).toBe(false);
        });

        it('it should return true [1, 0, 1], [1, 0, 0]', () => {
            const result = isNewerOrEqual([1, 0, 1], [1, 0, 0]);
            expect(result).toBe(true);
        });

        it('it should return true [1, 1, 1], [1, 1, 1]', () => {
            const result = isNewerOrEqual([1, 1, 1], [1, 1, 1]);
            expect(result).toBe(true);
        });
    });
});
