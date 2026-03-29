import {
    exceedsUint256TestCases,
    hasBalanceTestCases,
    isNegativeTestCases,
    isNotIntegerTestCases,
    isZeroTestCases,
} from '../../../fixtures/validation/shared/uint256.fixture';
import {
    exceedsUint256,
    hasBalance,
    isNegative,
    isNotInteger,
    isZero,
} from '../../../validation/shared/uint256';

describe('isNegative', () => {
    it.each(isNegativeTestCases)('$description', ({ input, expected }) => {
        expect(isNegative(input)).toBe(expected);
    });
});

describe('isNotInteger', () => {
    it.each(isNotIntegerTestCases)('$description', ({ input, expected }) => {
        expect(isNotInteger(input)).toBe(expected);
    });
});

describe('exceedsUint256', () => {
    it.each(exceedsUint256TestCases)('$description', ({ input, expected }) => {
        expect(exceedsUint256(input)).toBe(expected);
    });
});

describe('isZero', () => {
    it.each(isZeroTestCases)('$description', ({ input, expected }) => {
        expect(isZero(input)).toBe(expected);
    });
});

describe('hasBalance', () => {
    it.each(hasBalanceTestCases)('$description', ({ input, context, expected }) => {
        expect(hasBalance(input, context)).toBe(expected);
    });
});
