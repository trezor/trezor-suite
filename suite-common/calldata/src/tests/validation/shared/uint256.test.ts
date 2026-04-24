import {
    findInsufficientBalanceIssueTestCases,
    findNegativeAmountIssueTestCases,
    findNonIntegerIssueTestCases,
    findUint256OverflowIssueTestCases,
    findZeroAmountIssueTestCases,
} from '../../../fixtures/validation/shared/uint256.fixture';
import {
    findInsufficientBalanceIssue,
    findNegativeAmountIssue,
    findNonIntegerIssue,
    findUint256OverflowIssue,
    findZeroAmountIssue,
} from '../../../validation/shared/uint256';

describe('findNegativeAmountIssue', () => {
    it.each(findNegativeAmountIssueTestCases)('$description', ({ input, expected }) => {
        expect(findNegativeAmountIssue(input)).toBe(expected);
    });
});

describe('findNonIntegerIssue', () => {
    it.each(findNonIntegerIssueTestCases)('$description', ({ input, expected }) => {
        expect(findNonIntegerIssue(input)).toBe(expected);
    });
});

describe('findUint256OverflowIssue', () => {
    it.each(findUint256OverflowIssueTestCases)('$description', ({ input, expected }) => {
        expect(findUint256OverflowIssue(input)).toBe(expected);
    });
});

describe('findZeroAmountIssue', () => {
    it.each(findZeroAmountIssueTestCases)('$description', ({ input, expected }) => {
        expect(findZeroAmountIssue(input)).toBe(expected);
    });
});

describe('findInsufficientBalanceIssue', () => {
    it.each(findInsufficientBalanceIssueTestCases)(
        '$description',
        ({ input, context, expected }) => {
            expect(findInsufficientBalanceIssue(input, context)).toBe(expected);
        },
    );
});
