import { validateUint16TestCases } from '../../../fixtures/validation/shared/validateUint16.fixture';
import { validateUint16 } from '../../../validation/shared/uint16';

describe('validateUint16', () => {
    it.each(validateUint16TestCases)('$description', ({ input, expected }) => {
        expect(validateUint16(input, 'allowedInterchangeNum')).toEqual(expected);
    });
});
