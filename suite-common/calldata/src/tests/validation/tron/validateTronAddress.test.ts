import { validateTronAddressTestCases } from '../../../fixtures/validation/tron/validateTronAddress.fixture';
import { validateTronAddress } from '../../../validation/tron/address';

describe('validateTronAddress', () => {
    it.each(validateTronAddressTestCases)('$description', ({ input, context, expected }) => {
        expect(validateTronAddress(input, 'to', context)).toEqual(expected);
    });
});
