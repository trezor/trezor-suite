import { findUint16OverflowIssueTestCases } from '../../../fixtures/validation/shared/uint16.fixture';
import { findUint16OverflowIssue } from '../../../validation/shared/uint16';

describe('findUint16OverflowIssue', () => {
    it.each(findUint16OverflowIssueTestCases)('$description', ({ input, expected }) => {
        expect(findUint16OverflowIssue(input)).toBe(expected);
    });
});
