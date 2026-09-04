import type { AddressValidator } from '../src/createAddressValidator';

export const mockAddressValidator = (
    overrides: Partial<AddressValidator> = {},
): AddressValidator => ({
    isAddressValid: () => false,
    getAddressType: () => undefined,
    ...overrides,
});
