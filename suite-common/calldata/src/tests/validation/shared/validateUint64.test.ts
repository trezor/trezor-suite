import { validateUint64TestCases } from '../../../fixtures/validation/shared/validateUint64.fixture';
import { validateUint64 } from '../../../validation/shared/uint64';

describe('validateUint64', () => {
    it.each(validateUint64TestCases)('$description', ({ input, expected }) => {
        expect(validateUint64(input, 'source')).toEqual(expected);
    });
});
