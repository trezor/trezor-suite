import { findUint16OverflowIssue } from './uint16';
import { findUint16OverflowIssueTestCases } from '../../../mocks/validation/shared/mockUint16';

describe('findUint16OverflowIssue', () => {
    it.each(findUint16OverflowIssueTestCases)('$description', ({ input, expected }) => {
        expect(findUint16OverflowIssue(input)).toBe(expected);
    });
});
