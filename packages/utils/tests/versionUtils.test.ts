import {
    isEqual,
    isNewer,
    isNewerOrEqual,
    isVersionArray,
    isWithinRange,
    normalizeVersion,
} from '../src/versionUtils';

const fixture = [
    [[1, 0, 0], '1.0.0-beta'],
    [[1, 0, 1]],
    [[1, 0, 2], '1.0.2'],
    [[1, 1, 1]],
    [[1, 20, 1], '1.20.1-prerelase', '1.20.1-foo.4.5.6'],
    [[2, 1, 1]],
] satisfies ([number, number, number] | string)[][];

const testMatrix = (
    testCase: (first: any, second: any) => any,
    expectedResult: (firstIndex: number, secondIndex: number) => boolean,
) => {
    fixture.forEach((firstSet, firstIndex) => {
        fixture.forEach((secondSet, secondIndex) => {
            firstSet.forEach(first => {
                secondSet.forEach(second => {
                    const expected = expectedResult(firstIndex, secondIndex);
                    it(`${first} and ${second} should return ${expected}`, () => {
                        expect(testCase(first, second)).toBe(expected);
                    });
                });
            });
        });
    });
};

describe('versionUtils', () => {
    describe(isNewer.name, () => {
        testMatrix(isNewer, (a, b) => a > b);
    });

    describe(isNewerOrEqual.name, () => {
        testMatrix(isNewerOrEqual, (a, b) => a >= b);
    });

    describe(isEqual.name, () => {
        testMatrix(isEqual, (a, b) => a === b);
    });

    describe(normalizeVersion.name, () => {
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

    describe(isVersionArray.name, () => {
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

    describe(isWithinRange.name, () => {
        it('returns true if version is within range (inclusive)', () => {
            expect(isWithinRange([1, 0, 0], '1.0.0', '2.0.0')).toBe(true);
            expect(isWithinRange('1.5.0', [1, 0, 0], '2.0.0')).toBe(true);
            expect(isWithinRange('2.0.0', '1.0.0', [2, 0, 0])).toBe(true);
        });
        it('returns false if version is outside of range', () => {
            expect(isWithinRange('0.9.9', '1.0.0', [2, 0, 0])).toBe(false);
            expect(isWithinRange([2, 0, 1], '1.0.0', '2.0.0')).toBe(false);
        });
    });
});
