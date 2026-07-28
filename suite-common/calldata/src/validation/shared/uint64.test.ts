import { findUint64OverflowIssueTestCases } from './__fixtures__/mockUint64';
import { findUint64OverflowIssue } from './uint64';

describe('findUint64OverflowIssue', () => {
    it.each(findUint64OverflowIssueTestCases)('$description', ({ input, expected }) => {
        expect(findUint64OverflowIssue(input)).toBe(expected);
    });
});
