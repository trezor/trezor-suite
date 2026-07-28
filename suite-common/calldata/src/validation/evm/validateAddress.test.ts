import { validateAddressTestCases } from './__fixtures__/mockValidateAddress';
import { validateAddress } from './address';

describe('validateAddress', () => {
    it.each(validateAddressTestCases)('$description', ({ input, context, expected }) => {
        expect(validateAddress(input, 'to', context)).toEqual(expected);
    });
});
