import { isValidBytes32TestCases } from '../../../fixtures/validation/shared/bytes32.fixture';
import { isValidBytes32 } from '../../../validation/shared/bytes32';

describe('isValidBytes32', () => {
    it.each(isValidBytes32TestCases)('$description', ({ input, expected }) => {
        expect(isValidBytes32(input)).toBe(expected);
    });
});
