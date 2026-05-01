import { findUint64OverflowIssueTestCases } from '../../../fixtures/validation/shared/uint64.fixture';
import { findUint64OverflowIssue } from '../../../validation/shared/uint64';

describe('findUint64OverflowIssue', () => {
    it.each(findUint64OverflowIssueTestCases)('$description', ({ input, expected }) => {
        expect(findUint64OverflowIssue(input)).toBe(expected);
    });
});
