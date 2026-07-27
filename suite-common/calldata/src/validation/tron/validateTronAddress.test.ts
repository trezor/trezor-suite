import { validateTronAddress } from './address';
import { validateTronAddressTestCases } from '../../../mocks/validation/tron/mockValidateTronAddress';

describe('validateTronAddress', () => {
    it.each(validateTronAddressTestCases)('$description', ({ input, context, expected }) => {
        expect(validateTronAddress(input, 'to', context)).toEqual(expected);
    });
});
