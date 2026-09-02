import { validateTronAddressTestCases } from './__fixtures__/validateTronAddress.fixture';
import { validateTronAddress } from './address';

describe('validateTronAddress', () => {
    it.each(validateTronAddressTestCases)('$description', ({ input, context, expected }) => {
        expect(validateTronAddress(input, 'to', context)).toEqual(expected);
    });
});
