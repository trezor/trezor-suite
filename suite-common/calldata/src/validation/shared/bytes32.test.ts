import { findBytes32IssueTestCases } from './__fixtures__/bytes32.fixture';
import { findBytes32Issue } from './bytes32';

describe('findBytes32Issue', () => {
    it.each(findBytes32IssueTestCases)('$description', ({ input, expected }) => {
        expect(findBytes32Issue(input)).toBe(expected);
    });
});
