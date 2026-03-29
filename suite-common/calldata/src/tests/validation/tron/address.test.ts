import {
    isSameAsSenderTestCases,
    isValidTronAddressTestCases,
} from '../../../fixtures/validation/tron/address.fixture';
import { isSameAsSender, isValidTronAddress } from '../../../validation/tron/address';

describe('isValidTronAddress', () => {
    it.each(isValidTronAddressTestCases)('$description', ({ input, expected }) => {
        expect(isValidTronAddress(input)).toBe(expected);
    });
});

describe('isSameAsSender', () => {
    it.each(isSameAsSenderTestCases)('$description', ({ input, context, expected }) => {
        expect(isSameAsSender(input, context)).toBe(expected);
    });
});
