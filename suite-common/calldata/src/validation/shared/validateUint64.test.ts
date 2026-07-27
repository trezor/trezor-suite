import { validateUint64 } from './uint64';
import { validateUint64TestCases } from '../../../mocks/validation/shared/mockValidateUint64';

describe('validateUint64', () => {
    it.each(validateUint64TestCases)('$description', ({ input, expected }) => {
        expect(validateUint64(input, 'source')).toEqual(expected);
    });
});
