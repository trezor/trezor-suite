import { type AddressValidator } from '@suite-common/networks';

export const mockAddressValidator = (
    overrides: Partial<AddressValidator> = {},
): AddressValidator => ({
    isAddressValid: () => false,
    getAddressType: () => undefined,
    ...overrides,
});
