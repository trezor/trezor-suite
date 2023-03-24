import {
    isNewer,
    isNewerOrEqual,
    isEqual,
    normalizeVersion,
    isVersionArray,
} from '../src/versionUtils';

describe('versionUtils', () => {
    describe('isNewer', () => {
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

    describe('isEqual', () => {
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

    describe('isNewerOrEqual', () => {
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

    describe('normalizeVersion', () => {
        it('removes preceding zeros from versions to normalize it', () => {
            expect(normalizeVersion('2020.05.13-beta')).toEqual('2020.5.13-beta');
            expect(normalizeVersion('2022.12.01-beta')).toEqual('2022.12.1-beta');
            expect(normalizeVersion('3000.04.04-beta')).toEqual('3000.4.4-beta');
            expect(normalizeVersion('3000.04.04')).toEqual('3000.4.4');
            expect(normalizeVersion('3000.04.0')).toEqual('3000.4.0');
        });

        it('does nothing with normalized versions', () => {
            expect(normalizeVersion('20.11.0')).toEqual('20.11.0');
            expect(normalizeVersion('20.11.1')).toEqual('20.11.1');
        });
    });

    describe('isVersionArray', () => {
        it('invalid cases', () => {
            expect(isVersionArray(null)).toEqual(false);
            expect(isVersionArray([null])).toEqual(false);
            expect(isVersionArray([1, 2, null])).toEqual(false);
            expect(isVersionArray([-1])).toEqual(false);
            expect(isVersionArray([1, 2, -1])).toEqual(false);
            expect(isVersionArray([])).toEqual(false);
            expect(isVersionArray([1, 2, 3, 4])).toEqual(false);
            expect(isVersionArray([1])).toEqual(false);
            expect(isVersionArray([1, 2])).toEqual(false);
        });

        it('valid cases', () => {
            expect(isVersionArray([0, 1, 2])).toEqual(true);
            expect(isVersionArray([1, 2, 3])).toEqual(true);
        });
    });
});
