import {
    isNotSameAsSenderTestCases,
    isNotWhitelistedTestCases,
    isSameAsSenderTestCases,
    isValidAddressTestCases,
    isZeroAddressTestCases,
} from '../../../fixtures/validation/evm/address.fixture';
import {
    isNotSameAsSender,
    isNotWhitelisted,
    isSameAsSender,
    isValidAddress,
    isZeroAddress,
} from '../../../validation/evm/address';

describe('isValidAddress', () => {
    it.each(isValidAddressTestCases)('$description', ({ input, expected }) => {
        expect(isValidAddress(input)).toBe(expected);
    });
});

describe('isZeroAddress', () => {
    it.each(isZeroAddressTestCases)('$description', ({ input, expected }) => {
        expect(isZeroAddress(input)).toBe(expected);
    });
});

describe('isSameAsSender', () => {
    it.each(isSameAsSenderTestCases)('$description', ({ input, context, expected }) => {
        expect(isSameAsSender(input, context)).toBe(expected);
    });
});

describe('isNotSameAsSender', () => {
    it.each(isNotSameAsSenderTestCases)('$description', ({ input, context, expected }) => {
        expect(isNotSameAsSender(input, context)).toBe(expected);
    });
});

describe('isNotWhitelisted', () => {
    it.each(isNotWhitelistedTestCases)('$description', ({ input, context, expected }) => {
        expect(isNotWhitelisted(input, context)).toBe(expected);
    });
});
