import { type AddressValidator } from '../src';

export const mockAddressValidator = (
    overrides: Partial<AddressValidator> = {},
): AddressValidator => ({
    isAddressValid: () => false,
    getAddressType: () => undefined,
    ...overrides,
});
