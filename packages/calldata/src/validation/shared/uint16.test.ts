import { findUint16OverflowIssueTestCases } from './__fixtures__/uint16.fixture';
import { findUint16OverflowIssue } from './uint16';

describe('findUint16OverflowIssue', () => {
    it.each(findUint16OverflowIssueTestCases)('$description', ({ input, expected }) => {
        expect(findUint16OverflowIssue(input)).toBe(expected);
    });
});
