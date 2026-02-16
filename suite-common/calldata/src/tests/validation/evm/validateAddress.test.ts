import { validateAddressTestCases } from '../../../fixtures/validation/evm/validateAddress.fixture';
import { validateAddress } from '../../../validation/evm/address';

describe('validateAddress', () => {
    it.each(validateAddressTestCases)('$description', ({ input, context, expected }) => {
        expect(validateAddress(input, 'to', context)).toEqual(expected);
    });
});
