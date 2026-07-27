import { validateUint16 } from './uint16';
import { validateUint16TestCases } from '../../../mocks/validation/shared/mockValidateUint16';

describe('validateUint16', () => {
    it.each(validateUint16TestCases)('$description', ({ input, expected }) => {
        expect(validateUint16(input, 'allowedInterchangeNum')).toEqual(expected);
    });
});
