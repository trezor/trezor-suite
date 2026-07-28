import { findBytes32IssueTestCases } from './__fixtures__/mockBytes32';
import { findBytes32Issue } from './bytes32';

describe('findBytes32Issue', () => {
    it.each(findBytes32IssueTestCases)('$description', ({ input, expected }) => {
        expect(findBytes32Issue(input)).toBe(expected);
    });
});
