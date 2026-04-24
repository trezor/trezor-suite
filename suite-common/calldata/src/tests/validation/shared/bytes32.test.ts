import { findBytes32IssueTestCases } from '../../../fixtures/validation/shared/bytes32.fixture';
import { findBytes32Issue } from '../../../validation/shared/bytes32';

describe('findBytes32Issue', () => {
    it.each(findBytes32IssueTestCases)('$description', ({ input, expected }) => {
        expect(findBytes32Issue(input)).toBe(expected);
    });
});
