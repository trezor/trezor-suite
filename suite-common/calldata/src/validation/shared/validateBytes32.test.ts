import { validateBytes32 } from './bytes32';
import { validateBytes32TestCases } from '../../../mocks/validation/shared/mockValidateBytes32';

describe('validateBytes32', () => {
    it.each(validateBytes32TestCases)('$description', ({ input, expected }) => {
        expect(validateBytes32(input, 'proof')).toEqual(expected);
    });
});
