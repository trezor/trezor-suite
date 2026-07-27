import { validateAddress } from './address';
import { validateAddressTestCases } from '../../../mocks/validation/evm/mockValidateAddress';

describe('validateAddress', () => {
    it.each(validateAddressTestCases)('$description', ({ input, context, expected }) => {
        expect(validateAddress(input, 'to', context)).toEqual(expected);
    });
});
